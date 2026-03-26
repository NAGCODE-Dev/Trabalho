import { generateId } from '../../lib/utils'
import { type OCRPreviewIssue, type OCRPreviewItem } from '../orders/types'

function parseLocaleNumber(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.').trim()
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : NaN
}

export function parseOrderLine(rawLine: string, pageId: string): {
  item?: OCRPreviewItem
  issue?: OCRPreviewIssue
} {
  const columns = rawLine.split(';').map((column) => column.trim())

  if (columns.length < 6) {
    return {
      issue: {
        id: generateId('ocr-issue'),
        pageId,
        line: rawLine,
        reason: 'Linha sem os 6 campos esperados: descrição; código; unidade; quantidade; valor unitário; valor total.',
        severity: 'error',
      },
    }
  }

  const [description, code, unit, quantityText, unitPriceText, totalText] = columns
  const quantity = parseLocaleNumber(quantityText)
  const unitPrice = parseLocaleNumber(unitPriceText)
  const totalPrice = parseLocaleNumber(totalText)
  const warnings: string[] = []

  if (!description) warnings.push('Descrição ausente.')
  if (!code) warnings.push('Código ausente.')
  if (!unit) warnings.push('Unidade ausente.')
  if (!Number.isFinite(quantity)) warnings.push('Quantidade inválida.')
  if (!Number.isFinite(unitPrice)) warnings.push('Valor unitário inválido.')
  if (!Number.isFinite(totalPrice)) warnings.push('Valor total inválido.')

  if (warnings.length > 0) {
    return {
      issue: {
        id: generateId('ocr-issue'),
        pageId,
        line: rawLine,
        reason: warnings.join(' '),
        severity: 'error',
      },
    }
  }

  const computedTotal = Number((quantity * unitPrice).toFixed(2))
  const diff = Math.abs(computedTotal - totalPrice)
  const confidence = diff > 0.05 ? 'medium' : 'high'

  if (diff > 0.05) {
    warnings.push('Valor total recalculado difere do OCR.')
  }

  if (description.length < 3 || code.length < 3) {
    warnings.push('Linha suspeita: descrição ou código muito curto.')
  }

  return {
    item: {
      id: generateId('ocr-item'),
      pageId,
      description,
      code,
      unit,
      quantity,
      unitPrice,
      totalPrice,
      confidence: warnings.length > 0 ? 'medium' : confidence,
      warnings,
      rawLine,
    },
  }
}
