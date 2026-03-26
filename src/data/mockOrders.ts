import { generateId, normalizeText } from '../lib/utils'
import { type MinimalShortageRecord, type Order, type OrderItem, type OrderPage } from '../features/orders/types'
import { recalculateItem } from '../features/orders/utils'

function makeItem(input: Partial<OrderItem> & Pick<OrderItem, 'description' | 'code' | 'unit' | 'quantityRequested' | 'unitPrice'>) {
  return recalculateItem({
    id: input.id ?? generateId('item'),
    description: input.description,
    normalizedDescription: normalizeText(input.description),
    code: input.code,
    unit: input.unit,
    quantityRequested: input.quantityRequested,
    quantitySeparated: input.quantitySeparated ?? 0,
    quantityMissing: 0,
    unitPrice: input.unitPrice,
    lineTotalRequested: 0,
    lineTotalServed: 0,
    lineTotalMissing: 0,
    note: input.note,
    status: input.status ?? 'pending',
    source: input.source ?? 'ocr',
    sourcePageIds: input.sourcePageIds ?? [],
    parserConfidence: input.parserConfidence ?? 'high',
    suspicious: input.suspicious ?? false,
    flaggedReason: input.flaggedReason,
    highQuantity: input.quantityRequested >= 10,
    hasHistoryAlert: input.hasHistoryAlert ?? false,
  })
}

function makePage(name: string, pageNumber: number, status: OrderPage['status'], warnings: string[] = []): OrderPage {
  return {
    id: generateId('page'),
    name,
    imageUrl: '',
    pageNumber,
    uploadedAt: new Date().toISOString(),
    status,
    recognizedItems: 0,
    warnings,
    rawLines: [],
    unrecognizedLines: [],
    parserNotes: [],
  }
}

export function buildDemoOrders() {
  const now = new Date().toISOString()

  const activeOrder: Order = {
    id: generateId('order'),
    reference: 'PED-10482',
    createdAt: now,
    updatedAt: now,
    stage: 'picking',
    sourceType: 'scan',
    compactMode: false,
    notes: 'Pedido demo com múltiplas páginas e faltas históricas sinalizadas.',
    pages: [
      makePage('pedido_10482_pg1.jpg', 1, 'processed', ['1 linha exigiu revisão.']),
      makePage('pedido_10482_pg2.jpg', 2, 'processed'),
      makePage('pedido_10482_pg3.jpg', 3, 'processed'),
    ],
    ocrReview: {
      processedAt: now,
      previewItems: [],
      issues: [],
    },
    auditTrail: [],
    items: [
      makeItem({
        description: 'Arroz Tipo 1 5kg',
        code: '7891001',
        unit: 'FD',
        quantityRequested: 3,
        quantitySeparated: 3,
        unitPrice: 25.9,
        status: 'separated-complete',
      }),
      makeItem({
        description: 'Feijao Carioca 1kg',
        code: '7892002',
        unit: 'UN',
        quantityRequested: 8,
        quantitySeparated: 0,
        unitPrice: 8.5,
        status: 'pending',
        hasHistoryAlert: true,
      }),
      makeItem({
        description: 'Macarrao Espaguete 500g',
        code: '7894004',
        unit: 'FD',
        quantityRequested: 12,
        quantitySeparated: 10,
        unitPrice: 4.8,
        status: 'partial-shortage',
        note: 'Separado parcialmente. Confirmar reposição.',
        hasHistoryAlert: true,
      }),
      makeItem({
        description: 'Oleo de Soja 900ml',
        code: '7893003',
        unit: 'CX',
        quantityRequested: 2,
        quantitySeparated: 0,
        unitPrice: 71.9,
        status: 'total-shortage',
        note: 'Ruptura no corredor B.',
      }),
    ],
  }

  const ocrReviewOrder: Order = {
    id: generateId('order'),
    reference: 'PED-10483',
    createdAt: now,
    updatedAt: now,
    stage: 'ocr-review',
    sourceType: 'scan',
    compactMode: false,
    notes: 'Pedido demo aguardando revisão do OCR.',
    pages: [
      makePage('pedido_10483_pg1.jpg', 1, 'processed', ['1 linha com valor total ausente.']),
      makePage('pedido_10483_pg2.jpg', 2, 'processed', ['1 linha com caractere suspeito.']),
    ],
    ocrReview: {
      processedAt: now,
      previewItems: [
        {
          id: generateId('ocr-item'),
          pageId: 'demo-page-1',
          description: 'Arroz Tipo 1 5kg',
          code: '7891001',
          unit: 'FD',
          quantity: 3,
          unitPrice: 25.9,
          totalPrice: 77.7,
          confidence: 'high',
          warnings: [],
          rawLine: 'Arroz Tipo 1 5kg;7891001;FD;3;25,90;77,70',
        },
        {
          id: generateId('ocr-item'),
          pageId: 'demo-page-2',
          description: 'Molho de Tomate 300g',
          code: '7895005',
          unit: 'CX',
          quantity: 4,
          unitPrice: 19.9,
          totalPrice: 79.6,
          confidence: 'medium',
          warnings: ['Confirmar se a descrição está completa.'],
          rawLine: 'Molho de Tomate 300g;7895005;CX;4;19,90;79,60',
        },
      ],
      issues: [
        {
          id: generateId('ocr-issue'),
          pageId: 'demo-page-1',
          line: 'Farinha de Trigo 5kg;7897007;FD;2;19,90',
          reason: 'Linha sem os 6 campos esperados.',
          severity: 'error',
        },
        {
          id: generateId('ocr-issue'),
          pageId: 'demo-page-2',
          line: 'Cafe Torrado 500g;7898008;UN;5;13,4O;67,00',
          reason: 'Valor unitário com caractere suspeito.',
          severity: 'warning',
        },
      ],
    },
    auditTrail: [],
    items: [],
  }

  const shortageHistory: MinimalShortageRecord[] = [
    {
      id: generateId('hist'),
      productCode: '7892002',
      normalizedDescription: normalizeText('Feijao Carioca 1kg'),
      productLabel: 'Feijao Carioca 1kg',
      occurrenceType: 'total-shortage',
      missingQuantity: 8,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      lastOrderReference: 'PED-10460',
    },
    {
      id: generateId('hist'),
      productCode: '7894004',
      normalizedDescription: normalizeText('Macarrao Espaguete 500g'),
      productLabel: 'Macarrao Espaguete 500g',
      occurrenceType: 'partial-shortage',
      missingQuantity: 2,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      lastOrderReference: 'PED-10470',
    },
  ]

  return {
    activeOrder,
    demoOrders: [activeOrder, ocrReviewOrder],
    shortageHistory,
  }
}
