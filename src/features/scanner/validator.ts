import { type OCRPreviewIssue, type OCRPreviewItem } from '../orders/types'
import { generateId } from '../../lib/utils'

export function validateOCRConsistency(items: OCRPreviewItem[]): OCRPreviewIssue[] {
  const issues: OCRPreviewIssue[] = []
  const seenKeys = new Set<string>()

  items.forEach((item) => {
    const key = `${item.code}-${item.description}`
    if (seenKeys.has(key)) {
      issues.push({
        id: generateId('ocr-issue'),
        pageId: item.pageId,
        line: item.rawLine,
        reason: 'Item potencialmente duplicado entre páginas. Revisar se é repetição real ou erro do OCR.',
        severity: 'warning',
      })
    } else {
      seenKeys.add(key)
    }
  })

  return issues
}
