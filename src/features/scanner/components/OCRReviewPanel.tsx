import { AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { type OCRPreviewIssue, type OCRPreviewItem } from '../../orders/types'

interface OCRReviewPanelProps {
  previewItems: OCRPreviewItem[]
  issues: OCRPreviewIssue[]
  onChangeItem: (itemId: string, changes: Partial<OCRPreviewItem>) => void
  onRemoveItem: (itemId: string) => void
  onAccept: () => void
}

export function OCRReviewPanel({ previewItems, issues, onChangeItem, onRemoveItem, onAccept }: OCRReviewPanelProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">Revisão obrigatória da extração</h2>
          <p className="text-sm text-slate-600">
            Nada é assumido silenciosamente. Revise o que foi reconhecido, corrija campos suspeitos e trate linhas não reconhecidas antes de liberar a separação.
          </p>
        </div>
        <Button onClick={onAccept} disabled={previewItems.length === 0}>
          Criar checklist operacional
        </Button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-3">
          {previewItems.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Pencil className="h-4 w-4" />
                  Corrigir item OCR
                </div>
                <Button size="sm" variant="ghost" onClick={() => onRemoveItem(item.id)}>
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={item.description} onChange={(event) => onChangeItem(item.id, { description: event.target.value })} />
                <Input value={item.code} onChange={(event) => onChangeItem(item.id, { code: event.target.value })} />
                <Input value={item.unit} onChange={(event) => onChangeItem(item.id, { unit: event.target.value })} />
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(event) => onChangeItem(item.id, { quantity: Number(event.target.value) })}
                />
                <Input
                  value={item.unitPrice}
                  type="number"
                  step="0.01"
                  onChange={(event) => onChangeItem(item.id, { unitPrice: Number(event.target.value), totalPrice: Number(event.target.value) * item.quantity })}
                />
                <Input
                  value={item.totalPrice}
                  type="number"
                  step="0.01"
                  onChange={(event) => onChangeItem(item.id, { totalPrice: Number(event.target.value) })}
                />
              </div>
              {item.warnings.length > 0 ? <p className="mt-3 text-sm font-semibold text-orange-700">{item.warnings.join(' ')}</p> : null}
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-base font-black text-red-800">
            <AlertTriangle className="h-5 w-5" />
            Linhas não reconhecidas ou suspeitas
          </div>
          <div className="mt-4 grid gap-3">
            {issues.length === 0 ? (
              <p className="rounded-2xl bg-white p-3 text-sm text-slate-700">Nenhuma inconsistência adicional encontrada.</p>
            ) : (
              issues.map((issue) => (
                <div key={issue.id} className="rounded-2xl bg-white p-3 text-sm">
                  <div className="font-semibold text-slate-900">{issue.line}</div>
                  <p className="mt-1 text-red-700">{issue.reason}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{issue.severity}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
