import { describe, expect, it } from 'vitest'
import { computeAdaptiveThreshold, detectContentBounds, detectDocumentCorners, removeIsolatedNoise } from './preprocess'

function createBinaryScene(width: number, height: number, painter: (x: number, y: number) => boolean) {
  const luminances = new Array<number>(width * height).fill(255)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (painter(x, y)) {
        luminances[y * width + x] = 0
      }
    }
  }
  return { width, height, luminances, threshold: 127 }
}

describe('detectContentBounds', () => {
  it('encontra a área útil do documento e ignora margens claras', () => {
    const scene = createBinaryScene(100, 120, (x, y) => x >= 20 && x <= 80 && y >= 15 && y <= 100)
    const bounds = detectContentBounds(scene)
    expect(bounds.top).toBeLessThanOrEqual(15)
    expect(bounds.bottom).toBeGreaterThanOrEqual(100)
    expect(bounds.left).toBeLessThanOrEqual(20)
    expect(bounds.right).toBeGreaterThanOrEqual(80)
  })
})

describe('adaptive threshold helpers', () => {
  it('calcula threshold adaptativo dentro de faixa útil', () => {
    const threshold = computeAdaptiveThreshold([40, 55, 60, 180, 190, 210, 220, 235])
    expect(threshold).toBeGreaterThan(80)
    expect(threshold).toBeLessThan(190)
  })

  it('remove ruído isolado e preserva bloco principal', () => {
    const width = 5
    const height = 5
    const luminances = [
      255, 255, 255, 255, 255,
      255, 0, 255, 255, 255,
      255, 255, 0, 0, 255,
      255, 255, 0, 0, 255,
      255, 255, 255, 255, 255,
    ]
    const cleaned = removeIsolatedNoise(luminances, width, height, 127)
    expect(cleaned[6]).toBe(255)
    expect(cleaned[12]).toBe(0)
    expect(cleaned[13]).toBe(0)
  })
})

describe('detectDocumentCorners', () => {
  it('detecta os 4 cantos quando o documento está em quadrilátero', () => {
    const scene = createBinaryScene(140, 120, (x, y) => {
      const left = Math.round(18 + y * 0.18)
      const right = Math.round(122 - y * 0.1)
      const top = Math.round(8 + x * 0.03)
      const bottom = Math.round(112 - x * 0.02)
      return x >= left && x <= right && y >= top && y <= bottom
    })
    const bounds = detectContentBounds(scene)
    const corners = detectDocumentCorners(scene, bounds)
    expect(corners).not.toBeNull()
    expect((corners?.topLeft.x ?? 0)).toBeLessThan(corners?.bottomLeft.x ?? 0)
    expect((corners?.topRight.y ?? 0)).toBeLessThan(corners?.bottomRight.y ?? 0)
  })

  it('detecta cantos coerentes quando a página já está reta', () => {
    const scene = createBinaryScene(120, 120, (x, y) => x >= 20 && x <= 100 && y >= 10 && y <= 110)
    const bounds = detectContentBounds(scene)
    const corners = detectDocumentCorners(scene, bounds)
    expect(corners).not.toBeNull()
    expect(Math.abs((corners?.topLeft.x ?? 0) - 20)).toBeLessThanOrEqual(10)
    expect(Math.abs((corners?.bottomRight.x ?? 0) - 100)).toBeLessThanOrEqual(10)
  })
})
