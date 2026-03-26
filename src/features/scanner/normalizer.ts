import { generateId, normalizeText } from '../../lib/utils'
import { type OCRPreviewItem, type OrderItem } from '../orders/types'
import { recalculateItem } from '../orders/utils'

export function normalizePreviewItems(previewItems: OCRPreviewItem[]): OrderItem[] {
  return previewItems.map((preview) =>
    recalculateItem({
      id: generateId('item'),
      description: preview.description,
      normalizedDescription: normalizeText(preview.description),
      code: preview.code,
      unit: preview.unit.toUpperCase(),
      quantityRequested: preview.quantity,
      quantitySeparated: 0,
      quantityMissing: preview.quantity,
      unitPrice: preview.unitPrice,
      lineTotalRequested: preview.totalPrice,
      lineTotalServed: 0,
      lineTotalMissing: preview.totalPrice,
      note: preview.warnings.length > 0 ? preview.warnings.join(' ') : undefined,
      status: 'pending',
      source: 'ocr',
      sourcePageIds: [preview.pageId],
      parserConfidence: preview.confidence,
      suspicious: preview.warnings.length > 0,
      flaggedReason: preview.warnings[0],
      highQuantity: preview.quantity >= 10,
      hasHistoryAlert: false,
    }),
  )
}
