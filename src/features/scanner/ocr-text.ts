const KNOWN_UNITS = ['UN', 'CX', 'FD', 'KG', 'PCT', 'PC', 'LT', 'ML', 'SC', 'BD', 'PT', 'RL']

function normalizeDetectedOrderReference(value: string) {
  const cleaned = compactWhitespace(value)
    .replace(/^[^\dA-Za-z]+/u, '')
    .replace(/[^\dA-Za-z-]+$/u, '')

  if (/^PED[- ]?\d{3,12}$/iu.test(cleaned)) {
    return cleaned.replace(/\s+/g, '-').toUpperCase()
  }

  if (/^\d{3,12}$/u.test(cleaned)) {
    return `PED-${cleaned}`
  }

  if (/^[A-Z]{1,6}[- ]?\d{3,12}$/iu.test(cleaned)) {
    return cleaned.replace(/\s+/g, '-').toUpperCase()
  }

  return null
}

function sanitizeCode(value: string) {
  return value.replace(/[^A-Za-z0-9./_-]/g, '').toUpperCase()
}

function stripFieldLabels(value: string) {
  return value
    .replace(/\b(c[oó]d(?:igo)?|cod)\b[:\s]*/giu, ' ')
    .replace(/\b(unidade|und)\b[:\s]*/giu, ' ')
    .replace(/\bun\b(?=\s+(?:UN|CX|FD|KG|PCT|PC|LT|ML|SC|BD|PT|RL)\b)/giu, ' ')
    .replace(/\b(qtd(?:e)?|qtde)\b[:\s]*/giu, ' ')
    .replace(/\b(vl(?:r)?\.?\s*unit[aá]rio|valor\s*unit[aá]rio)\b[:\s]*/giu, ' ')
    .replace(/\b(vl(?:r)?\.?\s*total|valor\s*total)\b[:\s]*/giu, ' ')
}

function compactWhitespace(value: string) {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}

function fixNumericOCR(value: string) {
  return value
    .replace(/[Oo]/g, '0')
    .replace(/[Il]/g, '1')
    .replace(/S/g, '5')
    .replace(/[^\d,.-]/g, '')
}

function sanitizeNumber(value: string) {
  return fixNumericOCR(value).trim()
}

function sanitizeUnit(value: string) {
  const cleaned = value.replace(/[^A-Za-z]/g, '').toUpperCase()
  return cleaned
}

function normalizeDescription(value: string) {
  return compactWhitespace(
    value
      .replace(/^[|:;.,_-]+/g, '')
      .replace(/[|:;.,_-]+$/g, ''),
  )
}

function buildRow(
  description: string,
  code: string,
  unit: string,
  quantity: string,
  unitPrice: string,
  totalPrice: string,
) {
  return [
    normalizeDescription(description),
    sanitizeCode(code),
    sanitizeUnit(unit),
    sanitizeNumber(quantity),
    sanitizeNumber(unitPrice),
    sanitizeNumber(totalPrice),
  ].join(';')
}

function isLikelyHeaderOrFooter(line: string) {
  const normalized = compactWhitespace(line).toLowerCase()
  const hasItemStructure = /\d{4,14}/.test(normalized) && KNOWN_UNITS.some((unit) => new RegExp(`\\b${unit.toLowerCase()}\\b`).test(normalized))

  if (hasItemStructure) {
    return false
  }

  return (
    normalized.length < 3 ||
    normalized.includes('descri') && normalized.includes('codigo') && normalized.includes('unit') ||
    normalized.includes('valor unit') ||
    normalized.includes('vl unit') ||
    normalized.includes('valor total') ||
    normalized.includes('vl total') ||
    normalized.startsWith('pagina ') ||
    normalized.startsWith('página ') ||
    normalized.startsWith('total do pedido') ||
    normalized.startsWith('total pedido') ||
    normalized.startsWith('cliente ') ||
    normalized.startsWith('pedido ') ||
    normalized.startsWith('nro pedido') ||
    normalized.startsWith('data:') ||
    normalized === 'observacoes' ||
    normalized === 'observações'
  )
}

function isLikelyCode(value: string) {
  const cleaned = sanitizeCode(value)
  return (
    /^\d{4,14}$/.test(cleaned) ||
    /^\d[\d./-]{3,23}\d$/.test(cleaned) ||
    /^(?=.*\d)[A-Z0-9./_-]{4,24}$/.test(cleaned) ||
    /^[A-Z]{2,8}[-/_]?[A-Z0-9]{2,16}$/.test(cleaned)
  )
}

function isLikelyUnit(value: string) {
  return KNOWN_UNITS.includes(sanitizeUnit(value))
}

function isLikelyNumber(value: string) {
  return /^\d+(?:[.,]\d+)?$/.test(sanitizeNumber(value))
}

function splitColumns(line: string) {
  return stripFieldLabels(line)
    .split(/[|;\t]|\s{2,}/)
    .map((column) => compactWhitespace(column))
    .filter(Boolean)
}

function maybeBuildFromColumns(columns: string[]) {
  if (columns.length < 6) return null

  const totalPrice = columns[columns.length - 1] ?? ''
  const unitPrice = columns[columns.length - 2] ?? ''
  const quantity = columns[columns.length - 3] ?? ''
  const unit = columns[columns.length - 4] ?? ''
  const code = columns[columns.length - 5] ?? ''
  const description = columns.slice(0, -5).join(' ')

  if (!description || !isLikelyCode(code) || !isLikelyUnit(unit) || !isLikelyNumber(quantity) || !isLikelyNumber(unitPrice) || !isLikelyNumber(totalPrice)) {
    return null
  }

  return buildRow(description, code, unit, quantity, unitPrice, totalPrice)
}

function maybeBuildFromRegex(line: string) {
  const normalized = compactWhitespace(stripFieldLabels(line).replace(/R\$/gi, ' '))
  const match = normalized.match(
    /^(?<description>.+?)\s+(?<code>[A-Za-z0-9./_-]{4,24})\s+(?<unit>[A-Za-z]{1,5})\s+(?<quantity>[\dOoIlS.,]+)\s+(?<unitPrice>[\dOoIlS.,]+)\s+(?<totalPrice>[\dOoIlS.,]+)$/u,
  )

  if (!match?.groups) return null

  if (!isLikelyUnit(match.groups.unit) || !isLikelyCode(match.groups.code)) return null

  return buildRow(
    match.groups.description,
    match.groups.code,
    match.groups.unit,
    match.groups.quantity,
    match.groups.unitPrice,
    match.groups.totalPrice,
  )
}

function maybeBuildFromLabeledFields(line: string) {
  const normalized = compactWhitespace(line.replace(/R\$/gi, ' '))
  const match = normalized.match(
    /^(?<description>.+?)\s+(?:c[oó]d(?:igo)?|cod)\s+(?<code>[A-Za-z0-9./_-]{4,24})\s+(?:unidade|und|un)\s+(?<unit>[A-Za-z]{1,5})\s+(?:qtd(?:e)?|qtde)\s+(?<quantity>[\dOoIlS.,]+)\s+(?:vl(?:r)?\.?\s*unit[aá]rio|valor\s*unit[aá]rio|vl\s*unit)\s+(?<unitPrice>[\dOoIlS.,]+)\s+(?:vl(?:r)?\.?\s*total|valor\s*total|vl\s*total)\s+(?<totalPrice>[\dOoIlS.,]+)$/iu,
  )

  if (!match?.groups || !isLikelyUnit(match.groups.unit) || !isLikelyCode(match.groups.code)) {
    return null
  }

  return buildRow(
    match.groups.description,
    match.groups.code,
    match.groups.unit,
    match.groups.quantity,
    match.groups.unitPrice,
    match.groups.totalPrice,
  )
}

function maybeBuildFromTailTokens(line: string) {
  const tokens = compactWhitespace(stripFieldLabels(line).replace(/R\$/gi, ' ')).split(' ').filter(Boolean)
  if (tokens.length < 6) return null

  for (let start = Math.max(1, tokens.length - 7); start <= tokens.length - 5; start += 1) {
    const description = tokens.slice(0, start).join(' ')
    const code = tokens[start]
    const unit = tokens[start + 1]
    const quantity = tokens[start + 2]
    const unitPrice = tokens[start + 3]
    const totalPrice = tokens[start + 4]

    if (!description || !totalPrice) continue
    if (!isLikelyCode(code) || !isLikelyUnit(unit) || !isLikelyNumber(quantity) || !isLikelyNumber(unitPrice) || !isLikelyNumber(totalPrice)) {
      continue
    }

    return buildRow(description, code, unit, quantity, unitPrice, totalPrice)
  }

  return null
}

function parseSingleLine(line: string) {
  if (isLikelyHeaderOrFooter(line)) return null

  if (line.includes(';')) {
    const columns = line.split(';').map((column) => compactWhitespace(column)).filter(Boolean)
    const built = maybeBuildFromColumns(columns)
    if (built) return built
  }

  const fromLabeledFields = maybeBuildFromLabeledFields(line)
  if (fromLabeledFields) return fromLabeledFields

  const fromColumns = maybeBuildFromColumns(splitColumns(line))
  if (fromColumns) return fromColumns

  const fromRegex = maybeBuildFromRegex(line)
  if (fromRegex) return fromRegex

  return maybeBuildFromTailTokens(line)
}

function looksLikeDescriptionOnly(line: string) {
  const normalized = compactWhitespace(line)
  return normalized.length >= 4 && !/\d{4,14}/.test(normalized) && /[A-Za-zÀ-ÿ]/u.test(normalized)
}

function looksLikeDetailsOnly(line: string) {
  const tokens = compactWhitespace(stripFieldLabels(line).replace(/R\$/gi, ' ')).split(' ').filter(Boolean)
  return (
    tokens.length >= 5 &&
    isLikelyCode(tokens[0] ?? '') &&
    isLikelyUnit(tokens[1] ?? '') &&
    isLikelyNumber(tokens[2] ?? '') &&
    isLikelyNumber(tokens[3] ?? '') &&
    isLikelyNumber(tokens[4] ?? '')
  )
}

function hasOperationalSignals(line: string) {
  return /\d{4,14}/.test(line) || KNOWN_UNITS.some((unit) => new RegExp(`\\b${unit}\\b`, 'i').test(line))
}

export function extractOrderReferenceFromOCRText(rawText: string) {
  const lines = rawText
    .split('\n')
    .map((line) => compactWhitespace(line))
    .filter(Boolean)

  for (const line of lines) {
    const explicitMatch = line.match(
      /\b(?:pedido|ped|n[ºo°]?\s*pedido|nro\s*pedido|número\s*pedido)\b[:#\s-]*([A-Za-z]{0,6}[- ]?\d{3,12})/iu,
    )
    const explicitCandidate = explicitMatch?.[1] ? normalizeDetectedOrderReference(explicitMatch[1]) : null
    if (explicitCandidate) {
      return explicitCandidate
    }

    const prefixedMatch = line.match(/\b(PED[- ]?\d{3,12})\b/iu)
    const prefixedCandidate = prefixedMatch?.[1] ? normalizeDetectedOrderReference(prefixedMatch[1]) : null
    if (prefixedCandidate) {
      return prefixedCandidate
    }
  }

  return null
}

export function normalizeOCRTextToRows(rawText: string) {
  const extractedRows: string[] = []
  const uncertainRows: string[] = []
  const warnings: string[] = []

  const lines = rawText
    .split('\n')
    .map((line) => compactWhitespace(line))
    .filter(Boolean)

  let pendingDescription = ''

  for (const line of lines) {
    if (isLikelyHeaderOrFooter(line)) {
      continue
    }

    const singleLine = parseSingleLine(line)
    if (singleLine) {
      extractedRows.push(singleLine)
      pendingDescription = ''
      continue
    }

    if (pendingDescription && looksLikeDetailsOnly(line)) {
      const built = parseSingleLine(`${pendingDescription} ${line}`)
      if (built) {
        extractedRows.push(built)
        pendingDescription = ''
        continue
      }
    }

    if (looksLikeDescriptionOnly(line)) {
      pendingDescription = pendingDescription ? `${pendingDescription} ${line}` : line
      continue
    }

    if (pendingDescription && hasOperationalSignals(line)) {
      const built = parseSingleLine(`${pendingDescription} ${line}`)
      if (built) {
        extractedRows.push(built)
        pendingDescription = ''
        continue
      }
    }

    if (hasOperationalSignals(line)) {
      uncertainRows.push(line)
    }
  }

  if (pendingDescription) {
    uncertainRows.push(pendingDescription)
  }

  if (extractedRows.length === 0) {
    warnings.push('OCR real executado, mas nenhuma linha estruturada foi reconhecida automaticamente.')
  }

  if (uncertainRows.length > 0) {
    warnings.push(`${uncertainRows.length} linha(s) ficaram suspeitas e exigem revisão humana.`)
  }

  return {
    extractedRows,
    uncertainRows,
    warnings,
  }
}
