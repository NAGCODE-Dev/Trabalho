import { extractOrderReferenceFromOCRText, normalizeOCRTextToRows } from './ocr-text'
import { preprocessImageForOCR } from './preprocess'
import { type OCRAdapter, type OCRRawPageResult } from './types'

const sampleRows = [
  [
    'Arroz Tipo 1 5kg;7891001;FD;3;25,90;77,70',
    'Feijao Carioca 1kg;7892002;UN;8;8,50;68,00',
    'Oleo de Soja 900ml;7893003;CX;2;71,90;143,80',
  ],
  [
    'Macarrao Espaguete 500g;7894004;FD;12;4,80;57,60',
    'Molho de Tomate 300g;7895005;CX;4;19,90;79,60',
    'Acuçar Refinado 1kg;7896006;UN;6;4,70;28,20',
  ],
]

const sampleUncertain = [
  ['Farinha de Trigo 5kg;7897007;FD;2;19,90', 'L1X0 OCR ???'],
  ['Cafe Torrado 500g;7898008;UN;5;13,4O;67,00'],
]

async function mockProcessPage(page: { id: string; pageNumber: number }): Promise<OCRRawPageResult> {
  const index = (page.pageNumber - 1) % sampleRows.length
  await new Promise((resolve) => setTimeout(resolve, 450))
  const rawText = [`Pedido PED-1048${page.pageNumber}`, ...sampleRows[index], ...sampleUncertain[index]].join('\n')
  return {
    pageId: page.id,
    extractedRows: sampleRows[index],
    uncertainRows: sampleUncertain[index],
    warnings:
      index === 0
        ? ['1 linha parcial sem valor total.']
        : ['1 valor unitário com caractere suspeito.', 'Confirmar acentuação da descrição.'],
    engine: 'mock-local-ocr',
    rawText,
    detectedOrderReference: extractOrderReferenceFromOCRText(rawText) ?? undefined,
  }
}

export const mockOCRAdapter: OCRAdapter = {
  name: 'mock-local-ocr',
  processPage: mockProcessPage,
}

async function realProcessPage(page: { id: string; name: string; pageNumber: number; imageUrl?: string }) {
  if (!page.imageUrl) {
    return mockProcessPage(page)
  }

  try {
    const { createWorker } = await import('tesseract.js')
    const preparedImage = await preprocessImageForOCR(page.imageUrl)
    const worker = await createWorker('por+eng')
    const result = await worker.recognize(preparedImage.dataUrl)
    await worker.terminate()

    const normalized = normalizeOCRTextToRows(result.data.text)
    return {
      pageId: page.id,
      extractedRows: normalized.extractedRows,
      uncertainRows: normalized.uncertainRows,
      warnings: [`Pré-processamento aplicado: ${preparedImage.operations.join(', ')}.`, ...normalized.warnings],
      rawText: result.data.text,
      engine: 'tesseract.js',
      detectedOrderReference: extractOrderReferenceFromOCRText(result.data.text) ?? undefined,
    }
  } catch {
    const fallback = await mockProcessPage(page)
    return {
      ...fallback,
      warnings: [
        'OCR real indisponível no momento. Resultado mockado de fallback carregado para não bloquear o fluxo.',
        ...fallback.warnings,
      ],
      engine: 'mock-fallback',
    }
  }
}

export const browserOCRAdapter: OCRAdapter = {
  name: 'browser-tesseract-ocr',
  processPage: realProcessPage,
}
