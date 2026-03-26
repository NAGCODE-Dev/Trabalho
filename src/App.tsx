import { useMemo, useState } from 'react'
import { AlertTriangle, Plus, ScanText, Trash2 } from 'lucide-react'
import { AppShell } from './components/AppShell'
import { DashboardHeader } from './components/DashboardHeader'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import { Dialog } from './components/ui/dialog'
import { OrderList } from './features/orders/components/OrderList'
import { OrderDetail } from './features/orders/components/OrderDetail'
import { NewOrderDialog } from './features/orders/components/NewOrderDialog'
import { AddItemDialog } from './features/items/components/AddItemDialog'
import { ImportItemsDialog } from './features/items/components/ImportItemsDialog'
import { ExitConfirmationDialog } from './features/orders/components/ExitConfirmationDialog'
import { CompletionConfirmationDialog } from './features/orders/components/CompletionConfirmationDialog'
import { ProductImagePreviewModal } from './features/product-images/ProductImagePreviewModal'
import { ShortageHistoryPanel } from './features/shortage-history/components/ShortageHistoryPanel'
import { usePersistentOrdersApp } from './hooks/usePersistentOrdersApp'
import { usePwaState } from './hooks/usePwaState'
import { filterItems } from './features/orders/utils'
import type { OrderFilter, OrderItem } from './features/orders/types'
import { PwaBanner } from './components/PwaBanner'

function App() {
  const app = usePersistentOrdersApp()
  const pwa = usePwaState()
  const [showHistory, setShowHistory] = useState(false)
  const [newOrderOpen, setNewOrderOpen] = useState(false)
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const [completionStep, setCompletionStep] = useState<0 | 1 | 2>(0)
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<OrderFilter>('all')
  const [deleteCandidate, setDeleteCandidate] = useState<OrderItem | null>(null)

  const visibleItems = useMemo(() => {
    if (!app.currentOrder) return []
    return filterItems(app.currentOrder.items, filter, searchQuery)
  }, [app.currentOrder, filter, searchQuery])

  if (!app.isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-slate-600">
        Carregando pedido em andamento e histórico mínimo local...
      </div>
    )
  }

  return (
    <AppShell
      header={
        <DashboardHeader
          hasCurrentOrder={Boolean(app.currentOrder)}
          currentReference={app.currentOrder?.reference}
          onNewOrder={() => setNewOrderOpen(true)}
          onToggleHistory={() => setShowHistory((current) => !current)}
          showingHistory={showHistory}
          isOnline={pwa.isOnline}
          isInstalled={pwa.isInstalled}
          saveState={app.saveState}
          lastSavedAt={app.lastSavedAt}
        />
      }
    >
      <PwaBanner
        isOnline={pwa.isOnline}
        isInstalled={pwa.isInstalled}
        canInstall={pwa.canInstall}
        updateReady={pwa.updateReady}
        onInstall={() => void pwa.promptInstall()}
        onRefresh={() => window.location.reload()}
      />

      {app.currentOrder && !showHistory ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" onClick={() => setAddItemOpen(true)}>
              <Plus className="h-4 w-4" />
              Faltou reconhecer um item? Adicione manualmente
            </Button>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <ScanText className="h-4 w-4" />
              Importar texto como backup
            </Button>
            <Button variant="ghost" onClick={() => setExitOpen(true)}>
              Sair da tela do pedido
            </Button>
          </div>

          <OrderDetail
            order={app.currentOrder}
            summary={app.summary!}
            filter={filter}
            query={searchQuery}
            visibleItems={visibleItems}
            onBack={() => setExitOpen(true)}
            onFilesSelected={(files) => void app.addPages(files)}
            onProcessAllPages={() => void app.processOCR()}
            onReprocessPage={(pageId) => void app.processOCR([pageId])}
            onRemovePage={app.removePage}
            onPreviewItemChange={app.updatePreviewItem}
            onPreviewItemRemove={app.removePreviewItem}
            onAcceptOCR={app.acceptOCRReview}
            onFilterChange={setFilter}
            onQueryChange={setSearchQuery}
            onClearFilter={() => {
              setSearchQuery('')
              setFilter('all')
            }}
            onSetStatus={app.setItemStatus}
            onSetSeparatedQuantity={app.setSeparatedQuantity}
            onOpenImage={setSelectedItem}
            onDeleteItem={setDeleteCandidate}
            onNoteChange={app.updateItemNote}
            onUndo={app.undoLastItemChange}
            onMoveToFinalReview={app.moveToFinalReview}
            onBackFromReview={app.returnToPicking}
            onConfirmFinish={() => setCompletionStep(1)}
            onToggleCompactMode={app.toggleCompactMode}
            onMarkAllSeparated={app.markAllSeparated}
            onResetStatuses={app.resetOrderStatuses}
          />
        </>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="grid gap-4">
            <Card className="p-4">
              <h2 className="text-lg font-black text-slate-950">Pedidos demo disponíveis</h2>
              <p className="mt-1 text-sm text-slate-600">
                Dois cenários prontos para demonstração: um já em conferência e outro aguardando revisão do OCR.
              </p>
            </Card>
            <OrderList orders={app.demoOrders} onOpen={app.loadTemplate} />
          </section>

          <ShortageHistoryPanel history={app.shortageHistory} />
        </div>
      )}

      {app.toast ? (
        <div className={`fixed bottom-4 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 rounded-3xl px-4 py-3 text-sm font-semibold shadow-2xl ${app.toast.tone === 'warning' ? 'bg-amber-400 text-slate-950' : app.toast.tone === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-white'}`}>
          {app.toast.message}
        </div>
      ) : null}

      <NewOrderDialog
        open={newOrderOpen}
        onClose={() => setNewOrderOpen(false)}
        onCreate={(reference) => {
          app.createOrder(reference)
          setFilter('all')
          setSearchQuery('')
        }}
      />

      <AddItemDialog open={addItemOpen} onClose={() => setAddItemOpen(false)} onAdd={app.addManualItem} />

      <ImportItemsDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(previewItems) => {
          app.importPreviewItems(previewItems)
          setImportOpen(false)
        }}
      />

      <ExitConfirmationDialog
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        onConfirm={() => {
          setExitOpen(false)
          setShowHistory(false)
        }}
      />

      <CompletionConfirmationDialog
        open={completionStep === 1}
        step={1}
        onClose={() => setCompletionStep(0)}
        onConfirm={() => setCompletionStep(2)}
      />

      <CompletionConfirmationDialog
        open={completionStep === 2}
        step={2}
        onClose={() => setCompletionStep(0)}
        onConfirm={() => {
          void app.completeCurrentOrder().then((result) => {
            if (!result.success) {
              app.showToast(result.reason, 'warning')
              return
            }
            setCompletionStep(0)
            setShowHistory(true)
          })
        }}
      />

      <ProductImagePreviewModal open={Boolean(selectedItem)} item={selectedItem} onClose={() => setSelectedItem(null)} />

      <Dialog
        open={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        title="Excluir item"
        description="Confirme a exclusão. Essa ação remove o item da interface do pedido."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteCandidate(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteCandidate) {
                  app.deleteItem(deleteCandidate.id)
                }
                setDeleteCandidate(null)
              }}
            >
              Confirmar exclusão
            </Button>
          </>
        }
      >
        {deleteCandidate ? (
          <div className="rounded-3xl bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2 font-semibold">
              <Trash2 className="h-4 w-4" />
              {deleteCandidate.description}
            </div>
            <p className="mt-2">Se isso foi erro de status, prefira redefinir para pendente em vez de excluir.</p>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={completionStep > 0 && app.summary?.pending !== 0}
        onClose={() => setCompletionStep(0)}
        title="Conclusão bloqueada"
        description="Ainda existem pendentes. A conclusão normal está bloqueada."
        footer={<Button onClick={() => setCompletionStep(0)}>Voltar para revisar</Button>}
      >
        <div className="rounded-3xl bg-red-50 p-4 text-red-700">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Há item sem decisão operacional válida.
          </div>
        </div>
      </Dialog>
    </AppShell>
  )
}

export default App
