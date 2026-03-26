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
  onNoteChange: (itemId: string, note: string) => void
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
  onNoteChange,
  onUndo,
  onMoveToFinalReview,
  onBackFromReview,
  onConfirmFinish,
  onToggleCompactMode,
  onMarkAllSeparated,
  onResetStatuses,
}: OrderDetailProps) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao painel
          </button>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{order.reference}</h2>
          <p className="text-sm text-slate-600">Etapa atual: {order.stage}</p>
        </div>

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
      </div>

      <SummaryPanel summary={{ ...summary, visibleItems: visibleItems.length }} />

      {summary.pending > 0 ? (
        <PendingBanner pending={summary.pending} partial={summary.partialShortage} totalShortage={summary.totalShortage} onUndo={onUndo} />
      ) : null}

      <MultiImageScannerUploader
        pages={order.pages}
        onFilesSelected={onFilesSelected}
        onProcessAll={onProcessAllPages}
        onReprocessPage={onReprocessPage}
        onRemovePage={onRemovePage}
      />

      {order.stage === 'ocr-review' ? (
        <OCRReviewPanel
          previewItems={order.ocrReview.previewItems}
          issues={order.ocrReview.issues}
          onChangeItem={onPreviewItemChange}
          onRemoveItem={onPreviewItemRemove}
          onAccept={onAcceptOCR}
        />
      ) : null}

      {order.stage !== 'ocr-review' && order.stage !== 'final-review' ? (
        <>
          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-950">Checklist operacional</h3>
                <p className="text-sm text-slate-600">
                  Ordenação automática por criticidade: pendentes, falta parcial, em falta total e completos.
                </p>
              </div>
              <Button onClick={onMoveToFinalReview} disabled={order.items.length === 0}>
                <ListChecks className="h-4 w-4" />
                Revisão final
              </Button>
            </div>
          </Card>

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
                <ItemCard
                  key={item.id}
                  item={item}
                  compactMode={order.compactMode}
                  searchQuery={query}
                  onSetStatus={(status) => onSetStatus(item.id, status)}
                  onSetSeparatedQuantity={(quantity) => onSetSeparatedQuantity(item.id, quantity)}
                  onOpenImage={() => onOpenImage(item)}
                  onDelete={() => onDeleteItem(item)}
                  onNoteChange={(note) => onNoteChange(item.id, note)}
                />
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
            O fluxo principal começa com múltiplas páginas da lista.
          </div>
          <p className="mt-2 text-sm text-slate-600">Adicione as fotos do pedido, rode OCR e revise a extração antes de criar o checklist. A importação por texto fica disponível como backup.</p>
        </Card>
      ) : null}
    </section>
  )
}
