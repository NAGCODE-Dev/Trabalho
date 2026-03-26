import { generateId } from '../../lib/utils'
import type { ScanStructureProfile } from '../orders/types'

function compactWhitespace(value: string) {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}

function rawIndentation(value: string) {
  const match = value.match(/^\s+/)
  return match?.[0].length ?? 0
}

function detectDelimiter(text: string): ScanStructureProfile['dominantDelimiter'] {
  const semicolons = (text.match(/;/g) ?? []).length
  const pipes = (text.match(/\|/g) ?? []).length
  const tabs = (text.match(/\t/g) ?? []).length
  const spaces = (text.match(/\s{2,}/g) ?? []).length
  const counts = [
    ['semicolon', semicolons],
    ['pipe', pipes],
    ['tab', tabs],
    ['spaces', spaces],
  ] as const

  const sorted = counts.filter(([, count]) => count > 0).sort((left, right) => right[1] - left[1])
  if (sorted.length === 0) return 'unknown'
  if (sorted.length > 1 && sorted[0][1] === sorted[1][1]) return 'mixed'
  return sorted[0][0]
}

function classifyCodePattern(line: string) {
  const candidates = line.match(/[A-Za-z0-9./_-]{4,24}/g) ?? []
  const kinds = new Set<string>()

  for (const token of candidates) {
    if (/^\d{4,14}$/.test(token)) kinds.add('numeric')
    else if (/^\d[\d./-]+\d$/.test(token)) kinds.add('numeric-separated')
    else if (/^(?=.*\d)(?=.*[A-Za-z])[A-Za-z0-9./_-]{4,24}$/.test(token)) kinds.add('alphanumeric')
    else if (/^[A-Za-z]{4,24}$/.test(token)) kinds.add('alpha')
  }

  return [...kinds]
}

function extractUnitHints(text: string) {
  const matches = text.match(/\b(UN|CX|FD|KG|PCT|PC|LT|ML|SC|BD|PT|RL)\b/gi) ?? []
  return [...new Set(matches.map((match) => match.toUpperCase()))]
}

function detectLabels(text: string) {
  const labels = [
    ['codigo', /\b(c[oó]d(?:igo)?|cod)\b/iu],
    ['unidade', /\b(unidade|und|un)\b/iu],
    ['quantidade', /\b(qtd(?:e)?|qtde)\b/iu],
    ['valor-unitario', /\b(vl(?:r)?\.?\s*unit[aá]rio|valor\s*unit[aá]rio|vl\s*unit)\b/iu],
    ['valor-total', /\b(vl(?:r)?\.?\s*total|valor\s*total|vl\s*total)\b/iu],
  ] as const

  return labels.filter(([, pattern]) => pattern.test(text)).map(([label]) => label)
}

function hasTableHeaderLikeText(text: string) {
  const normalized = text.toLowerCase()
  return (
    /(descri[cç][aã]o|descricao)/u.test(normalized) &&
    /(c[oó]d(?:igo)?|cod)/u.test(normalized) &&
    /(qtd(?:e)?|qtde|quantidade)/u.test(normalized)
  )
}

function classifyLineRole(line: string) {
  const compact = compactWhitespace(line)
  const lowered = compact.toLowerCase()

  if (hasTableHeaderLikeText(compact) || detectLabels(compact).length >= 3) return 'table-header'
  if (/\b(pedido|ped|nro pedido|n[oº°] pedido)\b/iu.test(compact)) return 'order-header'
  if (/^(cliente|transportadora|data|observa[cç][aã]o)/iu.test(compact)) return 'meta-header'
  if (/^(p[aá]gina|pagina)\s+\d+/iu.test(compact)) return 'page-marker'
  if (/^(total|subtotal|valor total|total do pedido)/iu.test(compact)) return 'total-footer'
  if (/\d{4,14}/.test(compact) && /(UN|CX|FD|KG|PCT|PC|LT|ML|SC|BD|PT|RL)\b/i.test(compact)) return 'item-line'
  if (/\d{4,14}/.test(compact) || /R\$/i.test(compact)) return 'numeric-line'
  if (/[A-Za-zÀ-ÿ]/u.test(compact) && !/\d/.test(compact)) return 'text-line'
  if (lowered.length === 0) return 'empty'
  return 'misc'
}

function compressRoleSequence(lines: string[]) {
  const sequence: string[] = []
  for (const line of lines) {
    const role = classifyLineRole(line)
    if (sequence[sequence.length - 1] !== role) {
      sequence.push(role)
    }
  }
  return sequence.slice(0, 20)
}

function classifySectionSequence(lines: string[]) {
  const sections = lines.map((line) => classifyLineRole(line))
  const mapped = sections.map((role) => {
    if (role === 'order-header' || role === 'meta-header') return 'header'
    if (role === 'table-header') return 'table-header'
    if (role === 'item-line' || role === 'numeric-line' || role === 'text-line') return 'body'
    if (role === 'page-marker') return 'page-break'
    if (role === 'total-footer') return 'footer'
    return 'misc'
  })

  return mapped.reduce<string[]>((acc, value) => {
    if (acc[acc.length - 1] !== value) acc.push(value)
    return acc
  }, []).slice(0, 12)
}

function collectColumnCountHints(lines: string[]) {
  const counts = new Set<number>()
  for (const line of lines) {
    const semicolonCount = line.split(';').map((part) => compactWhitespace(part)).filter(Boolean).length
    const pipeCount = line.split('|').map((part) => compactWhitespace(part)).filter(Boolean).length
    const spacedCount = line.split(/\s{2,}|\t/).map((part) => compactWhitespace(part)).filter(Boolean).length

    for (const count of [semicolonCount, pipeCount, spacedCount]) {
      if (count >= 2) counts.add(count)
    }

    if (hasTableHeaderLikeText(line) || detectLabels(line).length >= 3) {
      counts.add(6)
    }
  }
  return [...counts].sort((left, right) => left - right).slice(0, 8)
}

function buildTokenHistogram(values: number[]) {
  const counts = new Map<number, number>()
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  return [...counts.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([tokens, count]) => ({ tokens, count }))
}

function buildNumericTokenHistogram(values: number[]) {
  const counts = new Map<number, number>()
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  return [...counts.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([numericTokens, count]) => ({ numericTokens, count }))
}

function toUppercaseRatioBucket(line: string) {
  const letters = line.match(/[A-Za-zÀ-ÿ]/gu) ?? []
  if (letters.length === 0) return 'none'
  const uppercase = (line.match(/[A-ZÀ-Ý]/gu) ?? []).length
  const ratio = uppercase / letters.length
  if (ratio >= 0.85) return 'high'
  if (ratio >= 0.45) return 'medium'
  return 'low'
}

function detectSpacingPatternKinds(lines: string[]) {
  const kinds = new Set<string>()
  for (const line of lines) {
    if (/\t/.test(line)) kinds.add('tabs')
    if (/\s{2,}/.test(line)) kinds.add('wide-gaps')
    if (/\|/.test(line)) kinds.add('pipe-columns')
    if (/;/.test(line)) kinds.add('semicolon-columns')
    if (/^\s+/.test(line)) kinds.add('indented')
  }
  return [...kinds]
}

function detectOrderReferencePattern(text: string): ScanStructureProfile['orderReferencePattern'] {
  if (/\b(?:pedido|ped|nro pedido|n[oº°] pedido)\b[:#\s-]*PED[- ]?\d{3,12}\b/iu.test(text) || /\bPED[- ]?\d{3,12}\b/iu.test(text)) {
    return 'prefixed'
  }
  if (/\b(?:pedido|ped|nro pedido|n[oº°] pedido)\b[:#\s-]*\d{3,12}\b/iu.test(text)) {
    return 'numeric'
  }
  if (/\b(?:pedido|ped|nro pedido|n[oº°] pedido)\b[:#\s-]*[A-Z]{1,6}[- ]?\d{3,12}\b/iu.test(text)) {
    return 'alphanumeric-prefixed'
  }
  return undefined
}

function toLineShape(line: string) {
  const compact = compactWhitespace(line)
  return compact
    .replace(/[A-Za-zÀ-ÿ]+/gu, 'A')
    .replace(/\d+/g, '9')
    .replace(/[;|]/g, ';')
    .replace(/\s+/g, ' ')
    .slice(0, 80)
}

export function buildScanStructureProfile(input: {
  rawText?: string
  extractedRows: string[]
  uncertainRows: string[]
  sourceEngine?: string
}): ScanStructureProfile {
  const lines = (input.rawText ?? [...input.extractedRows, ...input.uncertainRows].join('\n'))
    .split('\n')
    .map((line) => compactWhitespace(line))
    .filter(Boolean)

  const codePatterns = new Set<string>()
  lines.forEach((line) => classifyCodePattern(line).forEach((kind) => codePatterns.add(kind)))
  const joinedText = lines.join('\n')
  const tokenCounts = lines.map((line) => compactWhitespace(line).split(' ').filter(Boolean).length)
  const numericTokenCounts = lines.map((line) => line.match(/\b[\d.,/-]+\b/g)?.length ?? 0)
  const headerLines = lines.filter((line) => {
    const role = classifyLineRole(line)
    return role === 'order-header' || role === 'meta-header' || role === 'table-header'
  })
  const footerLines = lines.filter((line) => {
    const role = classifyLineRole(line)
    return role === 'page-marker' || role === 'total-footer'
  })

  return {
    id: generateId('scan-structure'),
    createdAt: new Date().toISOString(),
    parserVersion: 'bling-heuristic-v3',
    sourceEngine: input.sourceEngine,
    lineCount: lines.length,
    extractedCount: input.extractedRows.length,
    uncertainCount: input.uncertainRows.length,
    dominantDelimiter: detectDelimiter(joinedText),
    codePatternKinds: [...codePatterns],
    unitHints: extractUnitHints(joinedText),
    detectedLabels: detectLabels(joinedText),
    lineShapes: [...new Set(lines.slice(0, 12).map((line) => toLineShape(line)))],
    lineRoleSequence: compressRoleSequence(lines),
    sectionSequence: classifySectionSequence(lines),
    columnCountHints: collectColumnCountHints(lines),
    tokenCountHistogram: buildTokenHistogram(tokenCounts),
    numericTokenHistogram: buildNumericTokenHistogram(numericTokenCounts),
    uppercaseRatioBuckets: [...new Set(lines.slice(0, 20).map((line) => toUppercaseRatioBucket(line)))],
    indentationPattern: [...new Set(lines.slice(0, 20).map((line) => String(Math.min(rawIndentation(line), 8))))],
    spacingPatternKinds: detectSpacingPatternKinds(lines),
    orderReferencePattern: detectOrderReferencePattern(joinedText),
    hasCurrencyMarkers: /R\$/i.test(joinedText),
    hasTableHeader: hasTableHeaderLikeText(joinedText),
    headerShapeHints: [...new Set(headerLines.slice(0, 6).map((line) => toLineShape(line)))],
    footerShapeHints: [...new Set(footerLines.slice(0, 6).map((line) => toLineShape(line)))],
  }
}
