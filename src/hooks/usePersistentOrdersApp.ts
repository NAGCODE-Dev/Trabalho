import { useEffect, useMemo, useState } from 'react'
import { buildDemoOrders } from '../data/mockOrders'
import {
  appendPilotLogs,
  appendScanStructureMemory,
  appendShortageHistory,
  hasSeededDemo,
  loadSnapshot,
  saveCurrentOrder,
  setSeededDemo,
} from '../lib/db'
import { generateId, normalizeText } from '../lib/utils'
import { browserOCRAdapter } from '../features/scanner/adapters'
import { normalizePreviewItems } from '../features/scanner/normalizer'
import { parseOrderLine } from '../features/scanner/parser'
import { buildScanStructureProfile } from '../features/scanner/structure'
import { validateOCRConsistency } from '../features/scanner/validator'
import {
  type AppStateSnapshot,
  type ItemStatus,
  type OCRPreviewItem,
  type Order,
  type OrderItem,
  type OrderPage,
  type PilotLogEntry,
  type ScanStructureProfile,
} from '../features/orders/types'
import {
  applyStatus,
  hasShortageHistory,
  orderItemsByCriticality,
  recalculateItem,
  summarizeOrder,
  toMinimalShortageRecords,
} from '../features/orders/utils'

type ToastTone = 'info' | 'warning' | 'success'

interface ToastState {
  id: string
  message: string
  tone: ToastTone
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface UndoState {
  itemId: string
  previous: OrderItem
}

function cloneTemplate(order: Order, history: AppStateSnapshot['shortageHistory']): Order {
  const now = new Date().toISOString()
  const pageIdMap = new Map<string, string>()
  const pages = order.pages.map((page, index) => {
    const newId = generateId('page')
    pageIdMap.set(page.id, newId)
    return {
      ...page,
      id: newId,
      pageNumber: index + 1,
      uploadedAt: now,
    }
  })

  const items = order.items.map((item) =>
    recalculateItem({
      ...item,
      id: generateId('item'),
      quantitySeparated: item.status === 'pending' ? 0 : item.quantitySeparated,
      sourcePageIds: item.sourcePageIds.map((pageId) => pageIdMap.get(pageId) ?? pageId),
      hasHistoryAlert: hasShortageHistory(item, history),
    }),
  )

  return {
    ...order,
    id: generateId('order'),
    createdAt: now,
    updatedAt: now,
    compactMode: false,
    items: orderItemsByCriticality(items),
    pages,
  }
}

function mergeItems(order: Order, incoming: OrderItem[], history: AppStateSnapshot['shortageHistory']) {
  const stamped = incoming.map((item) =>
    recalculateItem({
      ...item,
      hasHistoryAlert: hasShortageHistory(item, history),
    }),
  )
  return orderItemsByCriticality([...order.items, ...stamped])
}

function buildBlankOrder(reference?: string): Order {
  const now = new Date().toISOString()
  return {
    id: generateId('order'),
    reference: reference?.trim() || `PED-${Math.floor(10000 + Math.random() * 90000)}`,
    createdAt: now,
    updatedAt: now,
    stage: 'intake',
    sourceType: 'scan',
    compactMode: false,
    notes: '',
    pages: [],
    items: [],
    ocrReview: {
      previewItems: [],
      issues: [],
    },
  }
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(`Falha ao ler ${file.name}`))
    reader.readAsDataURL(file)
  })
}

export function createOrderFromTemplate(order: Order, history: AppStateSnapshot['shortageHistory']) {
  return cloneTemplate(order, history)
}

export function createEmptyOrder(reference?: string) {
  return buildBlankOrder(reference)
}

export function usePersistentOrdersApp() {
  const demo = useMemo(() => buildDemoOrders(), [])
  const [isReady, setIsReady] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [shortageHistory, setShortageHistoryState] = useState(demo.shortageHistory)
  const [, setScanStructureMemory] = useState<AppStateSnapshot['scanStructureMemory']>([])
  const [, setPilotLogs] = useState<AppStateSnapshot['pilotLogs']>([])
  const [lastUndo, setLastUndo] = useState<UndoState | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  function pushPilotLog(entry: Omit<PilotLogEntry, 'id' | 'createdAt'>) {
    const record: PilotLogEntry = {
      id: generateId('pilot-log'),
      createdAt: new Date().toISOString(),
      ...entry,
    }
    void appendPilotLogs([record])
    setPilotLogs((previous) => [record, ...previous].slice(0, 200))
  }

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      const snapshot = await loadSnapshot()
      const seeded = await hasSeededDemo()

      if (!seeded && !snapshot.currentOrder) {
        if (snapshot.shortageHistory.length === 0) {
          await appendShortageHistory(demo.shortageHistory)
        }
        await setSeededDemo(true)
        if (!mounted) return
        setCurrentOrder(null)
        setShortageHistoryState(demo.shortageHistory)
        setScanStructureMemory(snapshot.scanStructureMemory)
        setPilotLogs(snapshot.pilotLogs)
        pushPilotLog({
          level: 'info',
          event: 'app_bootstrap',
          message: 'Aplicação inicializada na tela inicial.',
        })
        setIsReady(true)
        return
      }

      if (!mounted) return
      setCurrentOrder(snapshot.currentOrder)
      setShortageHistoryState(snapshot.shortageHistory.length > 0 ? snapshot.shortageHistory : demo.shortageHistory)
      setScanStructureMemory(snapshot.scanStructureMemory)
      setPilotLogs(snapshot.pilotLogs)
      pushPilotLog({
        level: snapshot.currentOrder ? 'warning' : 'info',
        event: snapshot.currentOrder ? 'order_recovered' : 'app_bootstrap',
        message: snapshot.currentOrder
          ? `Pedido ${snapshot.currentOrder.reference} recuperado do armazenamento local.`
          : 'Aplicação inicializada sem pedido em andamento.',
        orderReference: snapshot.currentOrder?.reference,
      })
      if (snapshot.currentOrder) {
        showToast(`Pedido ${snapshot.currentOrder.reference} recuperado automaticamente.`, 'warning')
      }
      setIsReady(true)
    }

    void bootstrap()
    return () => {
      mounted = false
    }
  }, [demo])

  useEffect(() => {
    if (!isReady) return
    let cancelled = false
    setSaveState('saving')
    void saveCurrentOrder(currentOrder)
      .then(() => {
        if (cancelled) return
        setSaveState('saved')
        setLastSavedAt(new Date().toISOString())
      })
      .catch(() => {
        if (cancelled) return
        setSaveState('error')
      })

    return () => {
      cancelled = true
    }
  }, [currentOrder, isReady])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function showToast(message: string, tone: ToastTone = 'info') {
    setToast({ id: generateId('toast'), message, tone })
  }

  function updateOrder(mutator: (order: Order) => Order) {
    setCurrentOrder((previous) => {
      if (!previous) return previous
      const next = mutator(previous)
      return {
        ...next,
        updatedAt: new Date().toISOString(),
      }
    })
  }

  function createOrder(reference?: string) {
    const next = buildBlankOrder(reference)
    setCurrentOrder(next)
    pushPilotLog({
      level: 'info',
      event: 'order_created',
      message: `Pedido ${next.reference} criado manualmente.`,
      orderReference: next.reference,
    })
    showToast('Novo pedido iniciado.')
  }

  function loadTemplate(order: Order) {
    const next = createOrderFromTemplate(order, shortageHistory)
    setCurrentOrder(next)
    showToast(`Pedido ${next.reference} aberto para conferência.`)
  }

  async function addPages(files: FileList | File[]) {
    if (!currentOrder) {
      createOrder()
    }

    const nextFiles = Array.from(files)
    const pages = await Promise.all(
      nextFiles.map(async (file, index) => ({
        id: generateId('page'),
        name: file.name,
        imageUrl: await fileToDataUrl(file),
        pageNumber: (currentOrder?.pages.length ?? 0) + index + 1,
        uploadedAt: new Date().toISOString(),
        status: 'queued' as const,
        recognizedItems: 0,
        warnings: [],
        rawLines: [],
        unrecognizedLines: [],
        parserNotes: [],
      })),
    )

    setCurrentOrder((previous) => {
      const base = previous ?? buildBlankOrder()
      return {
        ...base,
        stage: 'intake',
        sourceType: 'scan',
        pages: [...base.pages, ...pages],
        updatedAt: new Date().toISOString(),
      }
    })
    pushPilotLog({
      level: 'info',
      event: 'pages_added',
      message: `${pages.length} página(s) adicionada(s) ao pedido.`,
      orderReference: currentOrder?.reference,
      metadata: {
        count: pages.length,
      },
    })
    showToast(`${pages.length} página(s) adicionada(s) ao pedido.`)
  }

  function removePage(pageId: string) {
    updateOrder((order) => ({
      ...order,
      pages: order.pages
        .filter((page) => page.id !== pageId)
        .map((page, index) => ({
          ...page,
          pageNumber: index + 1,
        })),
    }))
    showToast('Página removida. Revise o OCR antes de seguir.', 'warning')
  }

  async function processOCR(pageIds?: string[]) {
    if (!currentOrder) return
    const selectedIds = new Set(pageIds ?? currentOrder.pages.map((page) => page.id))
    pushPilotLog({
      level: 'info',
      event: 'ocr_started',
      message: `OCR iniciado para ${selectedIds.size} página(s).`,
      orderReference: currentOrder.reference,
      metadata: { pageCount: selectedIds.size },
    })

    updateOrder((order) => ({
      ...order,
      pages: order.pages.map((page) =>
        selectedIds.has(page.id)
          ? {
              ...page,
              status: 'processing',
            }
          : page,
      ),
    }))

    const processedPages: Record<string, OrderPage> = {}
    const structureProfiles: ScanStructureProfile[] = []
    const detectedReferences: string[] = []

    for (const page of currentOrder.pages.filter((candidate) => selectedIds.has(candidate.id))) {
      try {
        const result = await browserOCRAdapter.processPage(page)
        const parsed = result.extractedRows.map((row) => parseOrderLine(row, page.id))
        const previewItems = parsed.flatMap((entry) => (entry.item ? [entry.item] : []))
        const parseIssues = parsed.flatMap((entry) => (entry.issue ? [entry.issue] : []))
        const structureProfile = buildScanStructureProfile({
          rawText: result.rawText,
          extractedRows: result.extractedRows,
          uncertainRows: result.uncertainRows,
          sourceEngine: result.engine,
        })
        structureProfiles.push(structureProfile)
        if (result.detectedOrderReference) {
          detectedReferences.push(result.detectedOrderReference)
        }
        processedPages[page.id] = {
          ...page,
          status: 'processed',
          recognizedItems: previewItems.length,
          warnings: result.engine ? [`Motor OCR: ${result.engine}.`, ...result.warnings] : result.warnings,
          rawLines: result.extractedRows,
          unrecognizedLines: result.uncertainRows,
          parserNotes: parseIssues.map((issue) => issue.reason),
          structureProfile,
        }
        setCurrentOrder((previous) => {
          if (!previous) return previous
          return {
            ...previous,
            updatedAt: new Date().toISOString(),
            pages: previous.pages.map((candidate) => (candidate.id === page.id ? processedPages[page.id] : candidate)),
          }
        })
        pushPilotLog({
          level: 'info',
          event: 'ocr_page_processed',
          message: `Página ${page.pageNumber} processada com ${previewItems.length} item(ns) reconhecido(s).`,
          orderReference: currentOrder.reference,
          pageId: page.id,
          metadata: {
            pageNumber: page.pageNumber,
            recognizedItems: previewItems.length,
            uncertain: result.uncertainRows.length,
          },
        })
      } catch {
        processedPages[page.id] = {
          ...page,
          status: 'error',
          recognizedItems: 0,
          warnings: ['Falha ao processar a página. Reprocesse esta página antes de seguir.'],
          rawLines: [],
          unrecognizedLines: [],
          parserNotes: [],
        }
        setCurrentOrder((previous) => {
          if (!previous) return previous
          return {
            ...previous,
            updatedAt: new Date().toISOString(),
            pages: previous.pages.map((candidate) => (candidate.id === page.id ? processedPages[page.id] : candidate)),
          }
        })
        pushPilotLog({
          level: 'error',
          event: 'ocr_page_failed',
          message: `Falha ao processar a página ${page.pageNumber}.`,
          orderReference: currentOrder.reference,
          pageId: page.id,
          metadata: {
            pageNumber: page.pageNumber,
          },
        })
      }
    }

    if (structureProfiles.length > 0) {
      void appendScanStructureMemory(structureProfiles)
      setScanStructureMemory((previous) => [...structureProfiles, ...previous].slice(0, 50))
    }

    updateOrder((order) => {
      const pages = order.pages.map((page) => processedPages[page.id] ?? page)
      const previewItems = pages.flatMap((page) =>
        page.rawLines
          .map((row) => parseOrderLine(row, page.id))
          .flatMap((entry) => (entry.item ? [entry.item] : [])),
      )
      const issuesFromRows = pages.flatMap((page) =>
        page.rawLines
          .map((row) => parseOrderLine(row, page.id))
          .flatMap((entry) => (entry.issue ? [entry.issue] : [])),
      )
      const issuesFromUncertain = pages.flatMap((page) =>
        page.unrecognizedLines.map((line) => ({
          id: generateId('ocr-issue'),
          pageId: page.id,
          line,
          reason: 'Trecho não reconhecido claramente. Revisão humana obrigatória.',
          severity: 'error' as const,
        })),
      )
      const consistencyIssues = validateOCRConsistency(previewItems)
      const nextReference = detectedReferences[0] ?? order.reference

      return {
        ...order,
        reference: nextReference,
        stage: 'ocr-review',
        pages,
        ocrReview: {
          processedAt: new Date().toISOString(),
          previewItems,
          issues: [...issuesFromRows, ...issuesFromUncertain, ...consistencyIssues],
        },
      }
    })

    pushPilotLog({
      level: 'info',
      event: 'ocr_finished',
      message: 'OCR finalizado e checklist de revisão reconstruído.',
      orderReference: currentOrder.reference,
      metadata: {
        pageCount: selectedIds.size,
      },
    })

    showToast('OCR processado. Revise os trechos suspeitos antes de liberar a separação.')
  }

  function updatePreviewItem(itemId: string, changes: Partial<OCRPreviewItem>) {
    updateOrder((order) => ({
      ...order,
      ocrReview: {
        ...order.ocrReview,
        previewItems: order.ocrReview.previewItems.map((item) =>
          item.id === itemId ? { ...item, ...changes } : item,
        ),
      },
    }))
  }

  function removePreviewItem(itemId: string) {
    updateOrder((order) => ({
      ...order,
      ocrReview: {
        ...order.ocrReview,
        previewItems: order.ocrReview.previewItems.filter((item) => item.id !== itemId),
      },
    }))
  }

  function acceptOCRReview() {
    updateOrder((order) => ({
      ...order,
      stage: 'picking',
      items: mergeItems(order, normalizePreviewItems(order.ocrReview.previewItems), shortageHistory),
    }))
    showToast('Checklist gerado a partir da revisão do OCR.', 'success')
  }

  function addManualItem(input: {
    description: string
    code: string
    unit: string
    quantityRequested: number
    unitPrice: number
    note?: string
  }) {
    const item = recalculateItem({
      id: generateId('item'),
      description: input.description,
      normalizedDescription: normalizeText(input.description),
      code: input.code,
      unit: input.unit,
      quantityRequested: input.quantityRequested,
      quantitySeparated: 0,
      quantityMissing: input.quantityRequested,
      unitPrice: input.unitPrice,
      lineTotalRequested: 0,
      lineTotalServed: 0,
      lineTotalMissing: 0,
      note: input.note,
      status: 'pending',
      source: 'manual',
      sourcePageIds: [],
      parserConfidence: 'high',
      suspicious: false,
      highQuantity: input.quantityRequested >= 10,
      hasHistoryAlert: false,
    })

    updateOrder((order) => ({
      ...order,
      stage: order.stage === 'intake' ? 'picking' : order.stage,
      sourceType: order.sourceType === 'scan' ? order.sourceType : 'manual',
      items: mergeItems(order, [item], shortageHistory),
    }))
    showToast('Item manual adicionado como exceção.', 'warning')
  }

  function importPreviewItems(previewItems: OCRPreviewItem[]) {
    updateOrder((order) => ({
      ...order,
      stage: 'picking',
      sourceType: 'text',
      items: mergeItems(order, normalizePreviewItems(previewItems).map((item) => ({ ...item, source: 'text-import' })), shortageHistory),
    }))
    showToast(`${previewItems.length} item(ns) importado(s) por texto.`, 'success')
  }

  function setItemStatus(itemId: string, status: ItemStatus) {
    updateOrder((order) => ({
      ...order,
      items: order.items.map((item) => {
        if (item.id !== itemId) return item
        setLastUndo({ itemId, previous: item })
        return recalculateItem({ ...applyStatus(item, status), hasHistoryAlert: item.hasHistoryAlert })
      }),
    }))
  }

  function setSeparatedQuantity(itemId: string, quantitySeparated: number) {
    updateOrder((order) => ({
      ...order,
      items: order.items.map((item) => {
        if (item.id !== itemId) return item
        setLastUndo({ itemId, previous: item })
        const next = recalculateItem({
          ...item,
          quantitySeparated,
          status:
            quantitySeparated === 0
              ? 'total-shortage'
              : quantitySeparated < item.quantityRequested
                ? 'partial-shortage'
                : 'separated-complete',
        })
        return {
          ...next,
          hasHistoryAlert: item.hasHistoryAlert,
        }
      }),
    }))
  }

  function updateItemNote(itemId: string, note: string) {
    updateOrder((order) => ({
      ...order,
      items: order.items.map((item) => (item.id === itemId ? { ...item, note } : item)),
    }))
  }

  function resetOrderStatuses() {
    updateOrder((order) => ({
      ...order,
      stage: 'picking',
      items: order.items.map((item) =>
        recalculateItem({
          ...item,
          quantitySeparated: 0,
          status: 'pending',
        }),
      ),
    }))
    showToast('Todos os itens voltaram para pendente.', 'warning')
  }

  function markAllSeparated() {
    updateOrder((order) => ({
      ...order,
      stage: 'picking',
      items: order.items.map((item) =>
        recalculateItem({
          ...item,
          quantitySeparated: item.quantityRequested,
          status: 'separated-complete',
        }),
      ),
    }))
    showToast('Todos os itens foram marcados como separados completos.', 'success')
  }

  function deleteItem(itemId: string) {
    updateOrder((order) => ({
      ...order,
      items: order.items.filter((item) => item.id !== itemId),
    }))
    showToast('Item removido do pedido.', 'warning')
  }

  function undoLastItemChange() {
    if (!lastUndo) return
    updateOrder((order) => ({
      ...order,
      items: order.items.map((item) => (item.id === lastUndo.itemId ? lastUndo.previous : item)),
    }))
    setLastUndo(null)
    showToast('Última alteração desfeita.')
  }

  function toggleCompactMode() {
    updateOrder((order) => ({
      ...order,
      compactMode: !order.compactMode,
    }))
  }

  function moveToFinalReview() {
    updateOrder((order) => ({
      ...order,
      stage: 'final-review',
    }))
  }

  function returnToPicking() {
    updateOrder((order) => ({
      ...order,
      stage: 'picking',
    }))
  }

  async function completeCurrentOrder() {
    if (!currentOrder) return { success: false, reason: 'Nenhum pedido em andamento.' }
    const summary = summarizeOrder(currentOrder)
    if (summary.pending > 0) {
      return { success: false, reason: 'Ainda existem itens pendentes.' }
    }
    const records = toMinimalShortageRecords(currentOrder)
    await appendShortageHistory(records)
    setShortageHistoryState((previous) => [...records, ...previous])
    pushPilotLog({
      level: 'info',
      event: 'order_completed',
      message: `Pedido ${currentOrder.reference} concluído com limpeza local dos dados operacionais completos.`,
      orderReference: currentOrder.reference,
      metadata: {
        shortageRecords: records.length,
      },
    })
    setCurrentOrder(null)
    setLastUndo(null)
    showToast('Pedido concluído. Dados operacionais removidos do dispositivo.', 'success')
    return { success: true, reason: `${records.length} ocorrência(s) mínima(s) preservada(s) no histórico.` }
  }

  const summary = currentOrder ? summarizeOrder(currentOrder) : null

  return {
    isReady,
    currentOrder,
    shortageHistory,
    demoOrders: demo.demoOrders,
    summary,
    toast,
    saveState,
    lastSavedAt,
    createOrder,
    loadTemplate,
    addPages,
    removePage,
    processOCR,
    updatePreviewItem,
    removePreviewItem,
    acceptOCRReview,
    addManualItem,
    importPreviewItems,
    setItemStatus,
    setSeparatedQuantity,
    updateItemNote,
    resetOrderStatuses,
    markAllSeparated,
    deleteItem,
    undoLastItemChange,
    toggleCompactMode,
    moveToFinalReview,
    returnToPicking,
    completeCurrentOrder,
    showToast,
  }
}
