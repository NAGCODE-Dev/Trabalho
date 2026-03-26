export type ItemStatus =
  | 'pending'
  | 'separated-complete'
  | 'partial-shortage'
  | 'total-shortage'

export type OrderStage = 'intake' | 'ocr-review' | 'picking' | 'final-review'

export type OrderFilter = 'all' | ItemStatus

export type OCRPageStatus = 'queued' | 'processing' | 'processed' | 'error'

export interface OrderPage {
  id: string
  name: string
  imageUrl: string
  pageNumber: number
  uploadedAt: string
  status: OCRPageStatus
  recognizedItems: number
  warnings: string[]
  rawLines: string[]
  unrecognizedLines: string[]
  parserNotes: string[]
  structureProfile?: ScanStructureProfile
}

export interface OrderItem {
  id: string
  description: string
  normalizedDescription: string
  code: string
  unit: string
  quantityRequested: number
  quantitySeparated: number
  quantityMissing: number
  unitPrice: number
  lineTotalRequested: number
  lineTotalServed: number
  lineTotalMissing: number
  note?: string
  status: ItemStatus
  source: 'ocr' | 'manual' | 'text-import'
  sourcePageIds: string[]
  parserConfidence: 'high' | 'medium' | 'low'
  suspicious: boolean
  flaggedReason?: string
  highQuantity: boolean
  hasHistoryAlert?: boolean
}

export interface OCRPreviewItem {
  id: string
  pageId: string
  description: string
  code: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  confidence: 'high' | 'medium' | 'low'
  warnings: string[]
  rawLine: string
}

export interface OCRPreviewIssue {
  id: string
  pageId: string
  line: string
  reason: string
  severity: 'warning' | 'error'
}

export interface OCRReviewState {
  previewItems: OCRPreviewItem[]
  issues: OCRPreviewIssue[]
  processedAt?: string
}

export interface OrderSummary {
  totalItems: number
  visibleItems: number
  pending: number
  separatedComplete: number
  partialShortage: number
  totalShortage: number
  quantityRequested: number
  quantitySeparated: number
  quantityMissing: number
  orderValueRequested: number
  orderValueServed: number
  orderValueMissing: number
  completionRate: number
}

export interface OrderAuditEntry {
  id: string
  createdAt: string
  label: string
  detail?: string
}

export interface Order {
  id: string
  reference: string
  createdAt: string
  updatedAt: string
  stage: OrderStage
  notes?: string
  pages: OrderPage[]
  items: OrderItem[]
  ocrReview: OCRReviewState
  sourceType: 'scan' | 'text' | 'manual'
  compactMode: boolean
  auditTrail: OrderAuditEntry[]
}

export interface MinimalShortageRecord {
  id: string
  productCode?: string
  normalizedDescription: string
  productLabel: string
  occurrenceType: 'partial-shortage' | 'total-shortage'
  missingQuantity: number
  createdAt: string
  lastOrderReference?: string
}

export interface ScanStructureProfile {
  id: string
  createdAt: string
  parserVersion: string
  sourceEngine?: string
  lineCount: number
  extractedCount: number
  uncertainCount: number
  dominantDelimiter: 'semicolon' | 'pipe' | 'tab' | 'spaces' | 'mixed' | 'unknown'
  codePatternKinds: string[]
  unitHints: string[]
  detectedLabels: string[]
  lineShapes: string[]
  lineRoleSequence: string[]
  sectionSequence: string[]
  columnCountHints: number[]
  tokenCountHistogram: Array<{ tokens: number; count: number }>
  numericTokenHistogram: Array<{ numericTokens: number; count: number }>
  uppercaseRatioBuckets: string[]
  indentationPattern: string[]
  spacingPatternKinds: string[]
  orderReferencePattern?: 'prefixed' | 'numeric' | 'alphanumeric-prefixed'
  hasCurrencyMarkers: boolean
  hasTableHeader: boolean
  headerShapeHints: string[]
  footerShapeHints: string[]
}

export interface PilotLogEntry {
  id: string
  createdAt: string
  level: 'info' | 'warning' | 'error'
  event:
    | 'app_bootstrap'
    | 'order_recovered'
    | 'order_created'
    | 'pages_added'
    | 'ocr_started'
    | 'ocr_page_processed'
    | 'ocr_page_failed'
    | 'ocr_finished'
    | 'order_completed'
  message: string
  orderReference?: string
  pageId?: string
  metadata?: Record<string, string | number | boolean>
}

export interface AppStateSnapshot {
  currentOrder: Order | null
  shortageHistory: MinimalShortageRecord[]
  scanStructureMemory: ScanStructureProfile[]
  pilotLogs: PilotLogEntry[]
}
