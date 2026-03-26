import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ListChecks, RotateCcw, ScanSearch } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import type { Order, OrderFilter, OrderItem } from '../types'
import type { OrderSummary } from '../types'
import { SummaryPanel } from './SummaryPanel'
import { MultiImageScannerUploader } from '../../scanner/components/MultiImageScannerUploader'
import { OCRReviewPanel } from '../../scanner/components/OCRReviewPanel'
import { PendingBanner } from '../../items/components/PendingBanner'
import { SearchAndFilterBar } from '../../items/components/SearchAndFilterBar'
import { ItemCard } from '../../items/components/ItemCard'
import { ReviewFinalPanel } from './ReviewFinalPanel'

interface OrderDetailProps {
  order: Order
  summary: OrderSummary
  showProductImageButton: boolean
  filter: OrderFilter
  query: string
  visibleItems: OrderItem[]
  onBack: () => void
  onFilesSelected: (files: FileList) => void
  onProcessAllPages: () => void
  onReprocessPage: (pageId: string) => void
  onRemovePage: (pageId: string) => void
  onPreviewItemChange: (itemId: string, changes: Partial<Order['ocrReview']['previewItems'][number]>) => void
  onPreviewItemRemove: (itemId: string) => void
  onAcceptOCR: () => void
  onFilterChange: (filter: OrderFilter) => void
  onQueryChange: (query: string) => void
  onClearFilter: () => void
  onSetStatus: (itemId: string, status: OrderItem['status']) => void
  onSetSeparatedQuantity: (itemId: string, quantity: number) => void
  onOpenImage: (item: OrderItem) => void
  onDeleteItem: (item: OrderItem) => void
  onUndo: () => void
  onMoveToFinalReview: () => void
  onBackFromReview: () => void
  onConfirmFinish: () => void
  onToggleCompactMode: () => void
  onMarkAllSeparated: () => void
  onResetStatuses: () => void
}

export function OrderDetail({
  order,
  summary,
  showProductImageButton,
  filter,
  query,
  visibleItems,
  onBack,
  onFilesSelected,
  onProcessAllPages,
  onReprocessPage,
  onRemovePage,
  onPreviewItemChange,
  onPreviewItemRemove,
  onAcceptOCR,
  onFilterChange,
  onQueryChange,
  onClearFilter,
  onSetStatus,
  onSetSeparatedQuantity,
  onOpenImage,
  onDeleteItem,
  onUndo,
  onMoveToFinalReview,
  onBackFromReview,
  onConfirmFinish,
  onToggleCompactMode,
  onMarkAllSeparated,
  onResetStatuses,
}: OrderDetailProps) {
  const isOcrReview = order.stage === 'ocr-review'
  const isPickingStage = order.stage === 'picking'
  const hasOperationalItems = order.items.length > 0
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [nextPendingTargetId, setNextPendingTargetId] = useState<string | null>(null)
  const pagesWithAttention = order.pages.filter(
    (page) => page.status === 'error' || page.recognizedItems === 0 || page.unrecognizedLines.length > 0,
  ).length
  const pendingVisibleIds = useMemo(
    () => visibleItems.filter((item) => item.status === 'pending').map((item) => item.id),
    [visibleItems],
  )

  useEffect(() => {
    if (!nextPendingTargetId) return
    const target = itemRefs.current[nextPendingTargetId]
    if (!target) return

    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => target.focus(), 120)
    setNextPendingTargetId(null)
  }, [nextPendingTargetId, visibleItems])

  function moveToNextPending(fromItemId: string) {
    if (pendingVisibleIds.length === 0) return

    const currentIndex = visibleItems.findIndex((item) => item.id === fromItemId)
    if (currentIndex === -1) return

    const nextForward = visibleItems
      .slice(currentIndex + 1)
      .find((item) => item.status === 'pending')
    const wrapped = visibleItems.slice(0, currentIndex).find((item) => item.status === 'pending')
    const nextTarget = nextForward ?? wrapped

    if (nextTarget) {
      setNextPendingTargetId(nextTarget.id)
    }
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black text-slate-950">{order.reference}</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700">
              {isOcrReview ? 'Etapa 1: OCR' : order.stage === 'final-review' ? 'Etapa 3: revisão final' : 'Etapa 2: separação'}
            </span>
          </div>
        </div>

        {isPickingStage ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={onToggleCompactMode}>
              {order.compactMode ? 'Modo detalhado' : 'Modo compacto'}
            </Button>
            <Button variant="secondary" onClick={onMarkAllSeparated} disabled={order.items.length === 0}>
              Marcar todos completos
            </Button>
            <Button variant="secondary" onClick={onResetStatuses} disabled={order.items.length === 0}>
              <RotateCcw className="h-4 w-4" />
              Resetar status
            </Button>
          </div>
        ) : null}
      </div>

      {(isPickingStage || order.stage === 'final-review') && hasOperationalItems ? (
        <SummaryPanel summary={{ ...summary, visibleItems: visibleItems.length }} />
      ) : null}

      {isPickingStage && hasOperationalItems && summary.pending > 0 ? (
        <PendingBanner pending={summary.pending} partial={summary.partialShortage} totalShortage={summary.totalShortage} onUndo={onUndo} />
      ) : null}

      {isOcrReview ? (
        <Card className="border-2 border-amber-300 bg-amber-50 p-4">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-950">Revisão da leitura</h3>
              <p className="mt-1 text-sm font-semibold text-slate-700">Só siga quando todas as páginas e todos os itens fizerem sentido.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Páginas</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{order.pages.length}</p>
              </div>
              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Itens lidos</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{order.ocrReview.previewItems.length}</p>
              </div>
              <div className={`rounded-2xl p-3 ${pagesWithAttention > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${pagesWithAttention > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  Páginas com problema
                </p>
                <p className={`mt-1 text-2xl font-black ${pagesWithAttention > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{pagesWithAttention}</p>
              </div>
            </div>

            <div className="grid gap-4">
              <MultiImageScannerUploader
                pages={order.pages}
                onFilesSelected={onFilesSelected}
                onProcessAll={onProcessAllPages}
                onReprocessPage={onReprocessPage}
                onRemovePage={onRemovePage}
                embedded
              />

              <OCRReviewPanel
                previewItems={order.ocrReview.previewItems}
                issues={order.ocrReview.issues}
                onChangeItem={onPreviewItemChange}
                onRemoveItem={onPreviewItemRemove}
                onAccept={onAcceptOCR}
                embedded
              />
            </div>
          </div>
        </Card>
      ) : null}

      {!isOcrReview ? (
        <MultiImageScannerUploader
          pages={order.pages}
          onFilesSelected={onFilesSelected}
          onProcessAll={onProcessAllPages}
          onReprocessPage={onReprocessPage}
          onRemovePage={onRemovePage}
        />
      ) : null}

      {isPickingStage && hasOperationalItems ? (
        <>
          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-950">Checklist operacional</h3>
                <p className="text-sm text-slate-600">Lista estável. Marque e siga.</p>
              </div>
              <Button onClick={onMoveToFinalReview} disabled={order.items.length === 0}>
                <ListChecks className="h-4 w-4" />
                Revisão final
              </Button>
            </div>
          </Card>

          {order.auditTrail.length > 0 ? (
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">Últimas ações</h3>
                <span className="text-xs font-semibold text-slate-500">Só deste pedido</span>
              </div>
              <div className="mt-3 grid gap-2">
                {order.auditTrail.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-800">
                    <span className="font-semibold">{entry.label}</span>
                    {entry.detail ? ` • ${entry.detail}` : ''}
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <SearchAndFilterBar
            query={query}
            filter={filter}
            visibleCount={visibleItems.length}
            totalCount={order.items.length}
            onQueryChange={onQueryChange}
            onFilterChange={onFilterChange}
            onClear={onClearFilter}
          />

          <div className="grid gap-4">
            {visibleItems.length === 0 ? (
              <Card className="p-5 text-sm text-slate-600">
                Nenhum item nessa visualização. O total real do pedido continua sendo {order.items.length}. Limpe o filtro se necessário.
              </Card>
            ) : (
              visibleItems.map((item) => (
                <div
                  key={item.id}
                  ref={(element) => {
                    itemRefs.current[item.id] = element
                  }}
                  tabIndex={-1}
                  className="rounded-[30px] focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <ItemCard
                    item={item}
                    compactMode={order.compactMode}
                    showProductImageButton={showProductImageButton}
                    searchQuery={query}
                    onSetStatus={(status) => {
                      onSetStatus(item.id, status)
                      if (status !== 'pending') {
                        moveToNextPending(item.id)
                      }
                    }}
                    onSetSeparatedQuantity={(quantity) => onSetSeparatedQuantity(item.id, quantity)}
                    onOpenImage={() => onOpenImage(item)}
                    onDelete={() => onDeleteItem(item)}
                  />
                </div>
              ))
            )}
          </div>
        </>
      ) : null}

      {order.stage === 'final-review' ? (
        <ReviewFinalPanel summary={summary} items={order.items} onBack={onBackFromReview} onConfirm={onConfirmFinish} />
      ) : null}

      {order.stage === 'intake' && order.pages.length === 0 ? (
        <Card className="border-dashed border-slate-300 p-5">
          <div className="flex items-center gap-2 text-slate-800">
            <ScanSearch className="h-5 w-5" />
            Comece pelas páginas da lista.
          </div>
          <p className="mt-2 text-sm text-slate-600">Adicione as fotos. O checklist só aparece depois da leitura e da revisão.</p>
        </Card>
      ) : null}
    </section>
  )
}
