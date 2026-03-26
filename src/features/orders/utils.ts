import {
  type ItemStatus,
  type MinimalShortageRecord,
  type Order,
  type OrderFilter,
  type OrderItem,
  type OrderSummary,
} from './types'
import { normalizeText } from '../../lib/utils'

export interface ItemSearchMatch {
  matched: boolean
  fields: Array<'description' | 'code' | 'unit' | 'note'>
}

export const statusMeta: Record<
  ItemStatus,
  { label: string; chip: string; border: string; text: string; bg: string; priority: number }
> = {
  pending: {
    label: 'Pendente',
    chip: 'bg-red-600 text-white',
    border: 'border-red-500',
    text: 'text-red-700',
    bg: 'bg-red-50',
    priority: 0,
  },
  'partial-shortage': {
    label: 'Parcial',
    chip: 'bg-orange-500 text-white',
    border: 'border-orange-400',
    text: 'text-orange-700',
    bg: 'bg-orange-50',
    priority: 1,
  },
  'total-shortage': {
    label: 'Falta',
    chip: 'bg-amber-400 text-slate-950',
    border: 'border-amber-400',
    text: 'text-amber-800',
    bg: 'bg-amber-50',
    priority: 2,
  },
  'separated-complete': {
    label: 'OK',
    chip: 'bg-emerald-600 text-white',
    border: 'border-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    priority: 3,
  },
}

export function computeItemStatus(quantityRequested: number, quantitySeparated: number): ItemStatus {
  if (quantitySeparated <= 0) {
    return 'total-shortage'
  }
  if (quantitySeparated >= quantityRequested) {
    return 'separated-complete'
  }
  return 'partial-shortage'
}

export function recalculateItem(item: OrderItem): OrderItem {
  const safeRequested = Math.max(0, item.quantityRequested)
  const safeSeparated = Math.min(Math.max(0, item.quantitySeparated), safeRequested)
  const missing = Math.max(0, safeRequested - safeSeparated)
  let status = item.status

  if (status !== 'pending') {
    status = computeItemStatus(safeRequested, safeSeparated)
  }

  return {
    ...item,
    quantityRequested: safeRequested,
    quantitySeparated: safeSeparated,
    quantityMissing: missing,
    lineTotalRequested: safeRequested * item.unitPrice,
    lineTotalServed: safeSeparated * item.unitPrice,
    lineTotalMissing: missing * item.unitPrice,
    status,
    normalizedDescription: normalizeText(item.description),
    highQuantity: safeRequested >= 10,
  }
}

export function applyStatus(item: OrderItem, status: ItemStatus): OrderItem {
  if (status === 'pending') {
    return recalculateItem({ ...item, quantitySeparated: 0, status })
  }
  if (status === 'separated-complete') {
    return recalculateItem({ ...item, quantitySeparated: item.quantityRequested, status })
  }
  if (status === 'total-shortage') {
    return recalculateItem({ ...item, quantitySeparated: 0, status })
  }
  const fallback = item.quantitySeparated > 0 ? item.quantitySeparated : Math.max(1, item.quantityRequested - 1)
  return recalculateItem({ ...item, quantitySeparated: fallback, status })
}

export function orderItemsByCriticality(items: OrderItem[]) {
  return [...items].sort((left, right) => {
    const priorityDifference = statusMeta[left.status].priority - statusMeta[right.status].priority
    if (priorityDifference !== 0) {
      return priorityDifference
    }
    if (left.hasHistoryAlert !== right.hasHistoryAlert) {
      return left.hasHistoryAlert ? -1 : 1
    }
    if (left.highQuantity !== right.highQuantity) {
      return left.highQuantity ? -1 : 1
    }
    return left.description.localeCompare(right.description, 'pt-BR')
  })
}

export function filterItems(items: OrderItem[], filter: OrderFilter, query: string) {
  const normalizedQuery = normalizeText(query)
  return items.filter((item) => {
    const matchesFilter = filter === 'all' ? true : item.status === filter
    const matchesQuery = getItemSearchMatch(item, normalizedQuery).matched
    return matchesFilter && matchesQuery
  })
}

export function getItemSearchMatch(item: OrderItem, query: string): ItemSearchMatch {
  const normalizedQuery = normalizeText(query)
  if (normalizedQuery.length === 0) {
    return { matched: true, fields: [] }
  }

  const fields: ItemSearchMatch['fields'] = []

  if (item.normalizedDescription.includes(normalizedQuery)) {
    fields.push('description')
  }
  if (normalizeText(item.code).includes(normalizedQuery)) {
    fields.push('code')
  }
  if (normalizeText(item.unit).includes(normalizedQuery)) {
    fields.push('unit')
  }
  if (normalizeText(item.note ?? '').includes(normalizedQuery)) {
    fields.push('note')
  }

  return {
    matched: fields.length > 0,
    fields,
  }
}

function buildNormalizedIndexMap(text: string) {
  let normalized = ''
  const map: number[] = []

  for (let index = 0; index < text.length; index += 1) {
    const normalizedChunk = text[index].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    for (let chunkIndex = 0; chunkIndex < normalizedChunk.length; chunkIndex += 1) {
      normalized += normalizedChunk[chunkIndex]
      map.push(index)
    }
  }

  return { normalized, map }
}

export function getHighlightRanges(text: string, query: string) {
  const normalizedQuery = normalizeText(query)
  if (!text || !normalizedQuery) return []

  const tokens = [...new Set(normalizedQuery.split(' ').filter(Boolean))].sort((left, right) => right.length - left.length)
  const { normalized, map } = buildNormalizedIndexMap(text)
  const ranges: Array<{ start: number; end: number }> = []

  for (const token of tokens) {
    let searchFrom = 0
    while (searchFrom < normalized.length) {
      const index = normalized.indexOf(token, searchFrom)
      if (index === -1) break
      const start = map[index]
      const end = map[Math.min(index + token.length - 1, map.length - 1)] + 1
      ranges.push({ start, end })
      searchFrom = index + token.length
    }
  }

  return ranges
    .sort((left, right) => left.start - right.start)
    .reduce<Array<{ start: number; end: number }>>((merged, current) => {
      const previous = merged[merged.length - 1]
      if (!previous || current.start > previous.end) {
        merged.push(current)
        return merged
      }
      previous.end = Math.max(previous.end, current.end)
      return merged
    }, [])
}

export function summarizeOrder(order: Order, visibleItems?: OrderItem[]): OrderSummary {
  const items = order.items
  const source = visibleItems ?? items
  const pending = items.filter((item) => item.status === 'pending').length
  const separatedComplete = items.filter((item) => item.status === 'separated-complete').length
  const partialShortage = items.filter((item) => item.status === 'partial-shortage').length
  const totalShortage = items.filter((item) => item.status === 'total-shortage').length
  const quantityRequested = items.reduce((sum, item) => sum + item.quantityRequested, 0)
  const quantitySeparated = items.reduce((sum, item) => sum + item.quantitySeparated, 0)
  const quantityMissing = items.reduce((sum, item) => sum + item.quantityMissing, 0)
  const orderValueRequested = items.reduce((sum, item) => sum + item.lineTotalRequested, 0)
  const orderValueServed = items.reduce((sum, item) => sum + item.lineTotalServed, 0)
  const orderValueMissing = items.reduce((sum, item) => sum + item.lineTotalMissing, 0)
  const concluded = separatedComplete + partialShortage + totalShortage

  return {
    totalItems: items.length,
    visibleItems: source.length,
    pending,
    separatedComplete,
    partialShortage,
    totalShortage,
    quantityRequested,
    quantitySeparated,
    quantityMissing,
    orderValueRequested,
    orderValueServed,
    orderValueMissing,
    completionRate: items.length === 0 ? 0 : Math.round((concluded / items.length) * 100),
  }
}

export function toMinimalShortageRecords(order: Order): MinimalShortageRecord[] {
  return order.items
    .filter((item) => item.status === 'partial-shortage' || item.status === 'total-shortage')
    .map((item) => ({
      id: `${item.code || item.normalizedDescription}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productCode: item.code || undefined,
      normalizedDescription: item.normalizedDescription,
      productLabel: item.description,
      occurrenceType: item.status as 'partial-shortage' | 'total-shortage',
      missingQuantity: item.quantityMissing,
      createdAt: new Date().toISOString(),
      lastOrderReference: order.reference,
    }))
}

export function hasShortageHistory(
  item: Pick<OrderItem, 'code' | 'normalizedDescription'>,
  history: MinimalShortageRecord[],
) {
  return history.some(
    (entry) =>
      (item.code.length > 0 && entry.productCode === item.code) ||
      entry.normalizedDescription === item.normalizedDescription,
  )
}
