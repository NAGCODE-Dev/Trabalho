import { AlertTriangle, Camera, CheckCircle2, RefreshCcw, Trash2, Upload } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import type { OrderPage } from '../../orders/types'

interface MultiImageScannerUploaderProps {
  pages: OrderPage[]
  onFilesSelected: (files: FileList) => void
  onProcessAll: () => void
  onReprocessPage: (pageId: string) => void
  onRemovePage: (pageId: string) => void
  embedded?: boolean
}

export function MultiImageScannerUploader({
  pages,
  onFilesSelected,
  onProcessAll,
  onReprocessPage,
  onRemovePage,
  embedded = false,
}: MultiImageScannerUploaderProps) {
  const Wrapper = embedded ? 'div' : Card
  const queuedCount = pages.filter((page) => page.status === 'queued').length
  const processingCount = pages.filter((page) => page.status === 'processing').length
  const problemCount = pages.filter((page) => page.status === 'error' || page.recognizedItems === 0 || page.unrecognizedLines.length > 0).length
  const completedCount = pages.filter((page) => page.status === 'processed' && page.recognizedItems > 0 && page.unrecognizedLines.length === 0).length
  const processedPages = [...pages]
    .filter((page) => page.status === 'processed')
    .sort((left, right) => left.pageNumber - right.pageNumber)
  const lastProcessedPage = processedPages[processedPages.length - 1]

  return (
    <Wrapper className={embedded ? 'grid gap-3' : 'p-4'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">{embedded ? '1. Páginas' : 'Páginas do pedido'}</h2>
          <p className="text-sm text-slate-600">{embedded ? 'Adicione as fotos e rode a leitura.' : 'Uma ou várias fotos da mesma lista. Cada página fica separada para facilitar a revisão.'}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
            <Upload className="h-4 w-4" />
            Adicionar páginas
            <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => event.target.files && onFilesSelected(event.target.files)} />
          </label>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950">
            <Camera className="h-4 w-4" />
            Capturar câmera
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(event) => event.target.files && onFilesSelected(event.target.files)}
            />
          </label>
          <Button variant="secondary" onClick={onProcessAll} disabled={pages.length === 0}>
            Ler páginas
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-amber-300 bg-amber-50/70 p-3">
        <div className="text-xs font-black uppercase tracking-wide text-amber-800">Guia rápido da câmera</div>
        <p className="mt-2 text-sm text-slate-700">
          Preencha a moldura com a folha, evite sombra forte e prefira foto em pé.
        </p>
        <div className="mt-3 rounded-[28px] border-2 border-amber-400/80 bg-white/70 p-3">
          <div className="rounded-[22px] border-2 border-dashed border-slate-400 p-6 text-center text-xs font-semibold text-slate-500">
            Enquadre a folha inteira aqui
          </div>
        </div>
      </div>

      {pages.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">Fila {queuedCount}</div>
          <div className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">Lendo {processingCount}</div>
          <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">OK {completedCount}</div>
          <div className="rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">Ação {problemCount}</div>
        </div>
      ) : null}

      {lastProcessedPage ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
          Última lida: página {lastProcessedPage.pageNumber}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {pages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
            Nenhuma página adicionada ainda.
          </div>
        ) : (
          pages.map((page) => {
            const hasCriticalProblem = page.status === 'error' || page.recognizedItems === 0
            const needsReview = !hasCriticalProblem && page.unrecognizedLines.length > 0

            return (
              <div
                key={page.id}
                className={`rounded-3xl border-2 p-4 ${
                  hasCriticalProblem
                    ? 'border-red-500 bg-red-50'
                    : needsReview
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-emerald-300 bg-emerald-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-black text-slate-950">
                      {hasCriticalProblem ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : needsReview ? (
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      )}
                      Página {page.pageNumber}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wide ${
                          hasCriticalProblem
                            ? 'bg-red-600 text-white'
                            : needsReview
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {hasCriticalProblem ? 'Ação agora' : needsReview ? 'Revisar' : 'OK'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-700">{page.name}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-2xl bg-white/80 px-3 py-2">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Itens lidos</div>
                        <div className="mt-1 text-lg font-black text-slate-950">{page.recognizedItems}</div>
                      </div>
                      <div className="rounded-2xl bg-white/80 px-3 py-2">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Trechos com problema</div>
                        <div className="mt-1 text-lg font-black text-slate-950">{page.unrecognizedLines.length}</div>
                      </div>
                    </div>
                    <p
                      className={`mt-3 text-sm font-black ${
                        hasCriticalProblem ? 'text-red-700' : needsReview ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {page.status === 'error'
                        ? 'Falhou. Rode de novo.'
                        : page.recognizedItems === 0
                          ? 'Nada foi lido. Revise esta página.'
                          : page.unrecognizedLines.length > 0
                            ? 'Leitura parcial. Ainda falta revisar.'
                            : 'Leitura concluída.'}
                    </p>
                    {page.warnings.length > 0 ? <p className="mt-1 text-xs font-medium text-slate-700">{page.warnings[0]}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="secondary" onClick={() => onReprocessPage(page.id)} aria-label={`Reler página ${page.pageNumber}`}>
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onRemovePage(page.id)} aria-label={`Remover página ${page.pageNumber}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </Wrapper>
  )
}
