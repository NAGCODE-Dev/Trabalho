import { generateId } from '../../lib/utils'
import type { ScanStructureProfile } from '../orders/types'

function compactWhitespace(value: string) {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
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

  return {
    id: generateId('scan-structure'),
    createdAt: new Date().toISOString(),
    parserVersion: 'bling-heuristic-v2',
    sourceEngine: input.sourceEngine,
    lineCount: lines.length,
    extractedCount: input.extractedRows.length,
    uncertainCount: input.uncertainRows.length,
    dominantDelimiter: detectDelimiter(lines.join('\n')),
    codePatternKinds: [...codePatterns],
    unitHints: extractUnitHints(lines.join('\n')),
    detectedLabels: detectLabels(lines.join('\n')),
    lineShapes: [...new Set(lines.slice(0, 12).map((line) => toLineShape(line)))],
  }
}
