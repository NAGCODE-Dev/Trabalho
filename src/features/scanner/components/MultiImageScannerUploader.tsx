import { Camera, FileImage, RefreshCcw, Trash2, Upload } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import type { OrderPage } from '../../orders/types'

interface MultiImageScannerUploaderProps {
  pages: OrderPage[]
  onFilesSelected: (files: FileList) => void
  onProcessAll: () => void
  onReprocessPage: (pageId: string) => void
  onRemovePage: (pageId: string) => void
}

export function MultiImageScannerUploader({
  pages,
  onFilesSelected,
  onProcessAll,
  onReprocessPage,
  onRemovePage,
}: MultiImageScannerUploaderProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">Páginas do pedido</h2>
          <p className="text-sm text-slate-600">Aceita uma ou várias fotos do mesmo pedido. Cada página fica rastreável e pode ser reprocessada.</p>
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
            Rodar OCR
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {pages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
            Nenhuma página adicionada. O fluxo principal é por OCR. Se faltar reconhecimento, a inserção manual continua disponível como exceção.
          </div>
        ) : (
          pages.map((page) => (
            <div key={page.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <FileImage className="h-4 w-4" />
                    Página {page.pageNumber}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{page.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Status: {page.status} | Itens reconhecidos: {page.recognizedItems}
                  </p>
                  {page.warnings.length > 0 ? <p className="mt-2 text-xs font-semibold text-orange-600">{page.warnings.join(' ')}</p> : null}
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="secondary" onClick={() => onReprocessPage(page.id)}>
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onRemovePage(page.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
