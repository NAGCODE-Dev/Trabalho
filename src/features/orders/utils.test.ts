import { describe, expect, it } from 'vitest'
import type { Order, OrderItem } from './types'
import { filterItems, getHighlightRanges, getItemSearchMatch, recalculateItem, summarizeOrder } from './utils'

function makeItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: 'item-1',
    description: 'Produto',
    normalizedDescription: 'produto',
    code: '123',
    unit: 'UN',
    quantityRequested: 10,
    quantitySeparated: 0,
    quantityMissing: 10,
    unitPrice: 5,
    lineTotalRequested: 50,
    lineTotalServed: 0,
    lineTotalMissing: 50,
    status: 'pending',
    source: 'manual',
    sourcePageIds: [],
    parserConfidence: 'high',
    suspicious: false,
    highQuantity: true,
    ...overrides,
  }
}

describe('recalculateItem', () => {
  it('recalcula falta parcial corretamente', () => {
    const result = recalculateItem(makeItem({ quantitySeparated: 6, status: 'partial-shortage' }))
    expect(result.quantityMissing).toBe(4)
    expect(result.lineTotalServed).toBe(30)
    expect(result.lineTotalMissing).toBe(20)
    expect(result.status).toBe('partial-shortage')
  })

  it('impede quantidade separada acima da pedida', () => {
    const result = recalculateItem(makeItem({ quantitySeparated: 99, status: 'separated-complete' }))
    expect(result.quantitySeparated).toBe(10)
    expect(result.quantityMissing).toBe(0)
  })
})

describe('summarizeOrder', () => {
  it('resume contadores e valores do pedido', () => {
    const order: Order = {
      id: 'order-1',
      reference: 'PED-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stage: 'picking',
      notes: '',
      pages: [],
      compactMode: false,
      sourceType: 'manual',
      ocrReview: { previewItems: [], issues: [] },
      items: [
        recalculateItem(makeItem({ status: 'separated-complete', quantitySeparated: 10 })),
        recalculateItem(makeItem({ id: 'item-2', status: 'partial-shortage', quantitySeparated: 4 })),
        recalculateItem(makeItem({ id: 'item-3', status: 'pending', quantitySeparated: 0 })),
      ],
    }
    const summary = summarizeOrder(order)
    expect(summary.pending).toBe(1)
    expect(summary.separatedComplete).toBe(1)
    expect(summary.partialShortage).toBe(1)
    expect(summary.orderValueServed).toBe(70)
    expect(summary.orderValueMissing).toBe(80)
  })
})

describe('search helpers', () => {
  const item = recalculateItem(
    makeItem({
      description: 'Cafe Torrado 500g',
      normalizedDescription: 'cafe torrado 500g',
      code: 'SKU/AB-99',
      unit: 'UN',
      note: 'Separar no corredor central',
    }),
  )

  it('busca por descrição, código, unidade e observação', () => {
    expect(getItemSearchMatch(item, 'cafe').fields).toContain('description')
    expect(getItemSearchMatch(item, 'ab-99').fields).toContain('code')
    expect(getItemSearchMatch(item, 'un').fields).toContain('unit')
    expect(getItemSearchMatch(item, 'corredor').fields).toContain('note')
  })

  it('filtra itens por observação e unidade', () => {
    expect(filterItems([item], 'all', 'central')).toHaveLength(1)
    expect(filterItems([item], 'all', 'UN')).toHaveLength(1)
  })

  it('gera ranges para destacar texto com normalização básica', () => {
    const ranges = getHighlightRanges('Café Torrado 500g', 'cafe')
    expect(ranges).toHaveLength(1)
    expect('Café Torrado 500g'.slice(ranges[0].start, ranges[0].end)).toBe('Café')
  })
})
