interface BinaryAnalysisInput {
  width: number
  height: number
  luminances: number[]
  threshold: number
}

interface ContentBounds {
  top: number
  bottom: number
  left: number
  right: number
}

interface Point {
  x: number
  y: number
}

export interface DocumentCorners {
  topLeft: Point
  topRight: Point
  bottomRight: Point
  bottomLeft: Point
}

export interface PreprocessResult {
  dataUrl: string
  operations: string[]
}

export interface ImageCaptureQuality {
  isTooDark: boolean
  isLowDetail: boolean
  warnings: string[]
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Falha ao carregar imagem para pré-processamento.'))
    image.src = source
  })
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, value))
}

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

function percentile(values: number[], ratio: number) {
  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)))
  return sorted[index] ?? 0
}

export function analyzeImageCaptureQuality(luminances: number[], width: number, height: number): ImageCaptureQuality {
  const average = luminances.reduce((sum, value) => sum + value, 0) / Math.max(1, luminances.length)
  let edgeEnergy = 0
  let comparisons = 0

  for (let row = 0; row < height - 1; row += 1) {
    for (let column = 0; column < width - 1; column += 1) {
      const current = luminances[row * width + column]
      const right = luminances[row * width + (column + 1)]
      const bottom = luminances[(row + 1) * width + column]
      edgeEnergy += Math.abs(current - right) + Math.abs(current - bottom)
      comparisons += 2
    }
  }

  const averageEdgeEnergy = edgeEnergy / Math.max(1, comparisons)
  const isTooDark = average < 95
  const isLowDetail = averageEdgeEnergy < 18
  const warnings: string[] = []

  if (isTooDark) warnings.push('Foto escura. Aproxime e aumente a luz.')
  if (isLowDetail) warnings.push('Foto com pouca nitidez. Tente firmar mais a câmera.')

  return {
    isTooDark,
    isLowDetail,
    warnings,
  }
}

export async function inspectImageCaptureQuality(imageUrl: string): Promise<ImageCaptureQuality> {
  if (import.meta.env.MODE === 'test' || typeof Image === 'undefined') {
    return { isTooDark: false, isLowDetail: false, warnings: [] }
  }

  const image = await loadImage(imageUrl)
  const scale = Math.min(1, Math.max(0.35, 900 / Math.max(image.width, image.height)))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    return { isTooDark: false, isLowDetail: false, warnings: [] }
  }

  context.drawImage(image, 0, 0, width, height)
  const frame = context.getImageData(0, 0, width, height)
  const luminances = new Array<number>(frame.data.length / 4)

  for (let index = 0; index < frame.data.length; index += 4) {
    const red = frame.data[index]
    const green = frame.data[index + 1]
    const blue = frame.data[index + 2]
    luminances[index / 4] = 0.299 * red + 0.587 * green + 0.114 * blue
  }

  return analyzeImageCaptureQuality(luminances, width, height)
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function sampleRowEdges(luminances: number[], width: number, row: number, threshold: number) {
  const start = row * width
  let left = -1
  let right = -1

  for (let column = 0; column < width; column += 1) {
    if (luminances[start + column] <= threshold) {
      left = column
      break
    }
  }

  for (let column = width - 1; column >= 0; column -= 1) {
    if (luminances[start + column] <= threshold) {
      right = column
      break
    }
  }

  if (left === -1 || right === -1 || right <= left) {
    return null
  }

  return { left, right }
}

function sampleColumnEdges(
  luminances: number[],
  width: number,
  height: number,
  column: number,
  threshold: number,
) {
  let top = -1
  let bottom = -1

  for (let row = 0; row < height; row += 1) {
    if (luminances[row * width + column] <= threshold) {
      top = row
      break
    }
  }

  for (let row = height - 1; row >= 0; row -= 1) {
    if (luminances[row * width + column] <= threshold) {
      bottom = row
      break
    }
  }

  if (top === -1 || bottom === -1 || bottom <= top) {
    return null
  }

  return { top, bottom }
}

export function detectContentBounds({ width, height, luminances, threshold }: BinaryAnalysisInput): ContentBounds {
  const darkRows: number[] = []
  const darkColumns = new Array<number>(width).fill(0)

  for (let row = 0; row < height; row += 1) {
    let rowDark = 0
    for (let column = 0; column < width; column += 1) {
      if (luminances[row * width + column] <= threshold) {
        rowDark += 1
        darkColumns[column] += 1
      }
    }

    if (rowDark >= Math.max(3, Math.floor(width * 0.015))) {
      darkRows.push(row)
    }
  }

  const activeColumns = darkColumns
    .map((count, column) => ({ count, column }))
    .filter(({ count }) => count >= Math.max(3, Math.floor(height * 0.015)))
    .map(({ column }) => column)

  if (darkRows.length === 0 || activeColumns.length === 0) {
    return { top: 0, bottom: height - 1, left: 0, right: width - 1 }
  }

  const paddingX = Math.max(8, Math.floor(width * 0.015))
  const paddingY = Math.max(8, Math.floor(height * 0.015))

  return {
    top: Math.max(0, darkRows[0] - paddingY),
    bottom: Math.min(height - 1, darkRows[darkRows.length - 1] + paddingY),
    left: Math.max(0, activeColumns[0] - paddingX),
    right: Math.min(width - 1, activeColumns[activeColumns.length - 1] + paddingX),
  }
}

export function detectDocumentCorners(
  { width, height, luminances, threshold }: BinaryAnalysisInput,
  bounds: ContentBounds,
): DocumentCorners | null {
  const topBandLimit = bounds.top + Math.max(10, Math.floor((bounds.bottom - bounds.top) * 0.22))
  const bottomBandStart = bounds.bottom - Math.max(10, Math.floor((bounds.bottom - bounds.top) * 0.22))
  const leftBandLimit = bounds.left + Math.max(10, Math.floor((bounds.right - bounds.left) * 0.22))
  const rightBandStart = bounds.right - Math.max(10, Math.floor((bounds.right - bounds.left) * 0.22))

  const topLeftXs: number[] = []
  const topLeftYs: number[] = []
  const topRightXs: number[] = []
  const topRightYs: number[] = []
  const bottomLeftXs: number[] = []
  const bottomLeftYs: number[] = []
  const bottomRightXs: number[] = []
  const bottomRightYs: number[] = []

  for (let row = bounds.top; row <= bounds.bottom; row += 1) {
    const edges = sampleRowEdges(luminances, width, row, threshold)
    if (!edges) continue

    if (row <= topBandLimit) {
      topLeftXs.push(edges.left)
      topLeftYs.push(row)
      topRightXs.push(edges.right)
      topRightYs.push(row)
    }
    if (row >= bottomBandStart) {
      bottomLeftXs.push(edges.left)
      bottomLeftYs.push(row)
      bottomRightXs.push(edges.right)
      bottomRightYs.push(row)
    }
  }

  for (let column = bounds.left; column <= bounds.right; column += 1) {
    const edges = sampleColumnEdges(luminances, width, height, column, threshold)
    if (!edges) continue

    if (column <= leftBandLimit) {
      topLeftXs.push(column)
      topLeftYs.push(edges.top)
      bottomLeftXs.push(column)
      bottomLeftYs.push(edges.bottom)
    }
    if (column >= rightBandStart) {
      topRightXs.push(column)
      topRightYs.push(edges.top)
      bottomRightXs.push(column)
      bottomRightYs.push(edges.bottom)
    }
  }

  if (
    topLeftXs.length < 3 ||
    topRightXs.length < 3 ||
    bottomLeftXs.length < 3 ||
    bottomRightXs.length < 3
  ) {
    return null
  }

  const corners: DocumentCorners = {
    topLeft: { x: median(topLeftXs), y: median(topLeftYs) },
    topRight: { x: median(topRightXs), y: median(topRightYs) },
    bottomRight: { x: median(bottomRightXs), y: median(bottomRightYs) },
    bottomLeft: { x: median(bottomLeftXs), y: median(bottomLeftYs) },
  }

  const topWidth = distance(corners.topLeft, corners.topRight)
  const bottomWidth = distance(corners.bottomLeft, corners.bottomRight)
  const leftHeight = distance(corners.topLeft, corners.bottomLeft)
  const rightHeight = distance(corners.topRight, corners.bottomRight)

  if (topWidth < 40 || bottomWidth < 40 || leftHeight < 40 || rightHeight < 40) {
    return null
  }

  return corners
}

function interpolatePoint(a: Point, b: Point, ratio: number): Point {
  return {
    x: a.x + (b.x - a.x) * ratio,
    y: a.y + (b.y - a.y) * ratio,
  }
}

export function computeAdaptiveThreshold(luminances: number[]) {
  const low = percentile(luminances, 0.12)
  const high = percentile(luminances, 0.88)
  const spread = Math.max(18, high - low)
  return Math.max(80, Math.min(190, low + spread * 0.58))
}

export function removeIsolatedNoise(
  luminances: number[],
  width: number,
  height: number,
  threshold: number,
) {
  const next = [...luminances]

  for (let row = 1; row < height - 1; row += 1) {
    for (let column = 1; column < width - 1; column += 1) {
      const index = row * width + column
      const currentDark = luminances[index] <= threshold
      let darkNeighbors = 0

      for (let y = -1; y <= 1; y += 1) {
        for (let x = -1; x <= 1; x += 1) {
          if (x === 0 && y === 0) continue
          if (luminances[(row + y) * width + (column + x)] <= threshold) {
            darkNeighbors += 1
          }
        }
      }

      if (currentDark && darkNeighbors <= 1) {
        next[index] = 255
      }
      if (!currentDark && darkNeighbors >= 7) {
        next[index] = 0
      }
    }
  }

  return next
}

function rectifyFromCorners(source: ImageData, corners: DocumentCorners, context: CanvasRenderingContext2D) {
  const outputWidth = Math.max(
    1,
    Math.round(
      Math.max(distance(corners.topLeft, corners.topRight), distance(corners.bottomLeft, corners.bottomRight)),
    ),
  )
  const outputHeight = Math.max(
    1,
    Math.round(
      Math.max(distance(corners.topLeft, corners.bottomLeft), distance(corners.topRight, corners.bottomRight)),
    ),
  )

  const output = context.createImageData(outputWidth, outputHeight)

  for (let row = 0; row < outputHeight; row += 1) {
    const v = outputHeight <= 1 ? 0 : row / (outputHeight - 1)
    const leftEdge = interpolatePoint(corners.topLeft, corners.bottomLeft, v)
    const rightEdge = interpolatePoint(corners.topRight, corners.bottomRight, v)

    for (let column = 0; column < outputWidth; column += 1) {
      const u = outputWidth <= 1 ? 0 : column / (outputWidth - 1)
      const sourcePoint = interpolatePoint(leftEdge, rightEdge, u)
      const sourceX = Math.max(0, Math.min(source.width - 1, Math.round(sourcePoint.x)))
      const sourceY = Math.max(0, Math.min(source.height - 1, Math.round(sourcePoint.y)))
      const sourceIndex = (sourceY * source.width + sourceX) * 4
      const targetIndex = (row * outputWidth + column) * 4

      output.data[targetIndex] = source.data[sourceIndex]
      output.data[targetIndex + 1] = source.data[sourceIndex + 1]
      output.data[targetIndex + 2] = source.data[sourceIndex + 2]
      output.data[targetIndex + 3] = 255
    }
  }

  return output
}

function cropFromBounds(source: ImageData, bounds: ContentBounds, context: CanvasRenderingContext2D) {
  const outputWidth = Math.max(1, bounds.right - bounds.left + 1)
  const outputHeight = Math.max(1, bounds.bottom - bounds.top + 1)
  const output = context.createImageData(outputWidth, outputHeight)

  for (let row = 0; row < outputHeight; row += 1) {
    for (let column = 0; column < outputWidth; column += 1) {
      const sourceX = bounds.left + column
      const sourceY = bounds.top + row
      const sourceIndex = (sourceY * source.width + sourceX) * 4
      const targetIndex = (row * outputWidth + column) * 4

      output.data[targetIndex] = source.data[sourceIndex]
      output.data[targetIndex + 1] = source.data[sourceIndex + 1]
      output.data[targetIndex + 2] = source.data[sourceIndex + 2]
      output.data[targetIndex + 3] = 255
    }
  }

  return output
}

export async function preprocessImageForOCR(imageUrl: string): Promise<PreprocessResult> {
  const image = await loadImage(imageUrl)
  const scale = Math.min(2, Math.max(1.2, 1800 / Math.max(image.width, image.height)))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('Canvas indisponível para pré-processamento.')
  }

  context.drawImage(image, 0, 0, width, height)
  const frame = context.getImageData(0, 0, width, height)
  const { data } = frame
  const operations = ['escala para OCR', 'grayscale', 'contraste adaptativo', 'binarização', 'limpeza leve de ruído']

  let totalLuminance = 0
  const luminances = new Array<number>(data.length / 4)

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index]
    const green = data[index + 1]
    const blue = data[index + 2]
    const luminance = 0.299 * red + 0.587 * green + 0.114 * blue
    luminances[index / 4] = luminance
    totalLuminance += luminance
  }

  const averageLuminance = totalLuminance / luminances.length
  const threshold = computeAdaptiveThreshold(luminances)

  for (let index = 0; index < data.length; index += 4) {
    const sourceLuminance = luminances[index / 4]
    const contrasted = clampChannel((sourceLuminance - averageLuminance) * 2.15 + averageLuminance)
    const binary = contrasted > threshold ? 255 : 0
    data[index] = binary
    data[index + 1] = binary
    data[index + 2] = binary
    data[index + 3] = 255
    luminances[index / 4] = binary
  }

  const cleanedLuminances = removeIsolatedNoise(luminances, width, height, 127)
  for (let index = 0; index < data.length; index += 4) {
    const binary = cleanedLuminances[index / 4]
    data[index] = binary
    data[index + 1] = binary
    data[index + 2] = binary
    data[index + 3] = 255
  }

  const analysis = { width, height, luminances: cleanedLuminances, threshold: 127 }
  const bounds = detectContentBounds(analysis)
  const corners = detectDocumentCorners(analysis, bounds)

  if (bounds.left > 0 || bounds.top > 0 || bounds.right < width - 1 || bounds.bottom < height - 1) {
    operations.push('recorte automático de margens')
  }
  if (corners) {
    operations.push('detecção de 4 cantos do documento')
    operations.push('retificação por quadrilátero')
  }

  const corrected = corners ? rectifyFromCorners(frame, corners, context) : cropFromBounds(frame, bounds, context)
  canvas.width = corrected.width
  canvas.height = corrected.height
  context.putImageData(corrected, 0, 0)

  return {
    dataUrl: canvas.toDataURL('image/png', 0.92),
    operations,
  }
}
