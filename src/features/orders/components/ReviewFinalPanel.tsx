import { AlertTriangle, CheckCircle2, CircleAlert } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import type { OrderItem, OrderSummary } from '../types'
import { StatusBadge } from '../../items/components/StatusBadge'

interface ReviewFinalPanelProps {
  summary: OrderSummary
  items: OrderItem[]
  onBack: () => void
  onConfirm: () => void
}

export function ReviewFinalPanel({ summary, items, onBack, onConfirm }: ReviewFinalPanelProps) {
  const pending = items.filter((item) => item.status === 'pending')
  const partial = items.filter((item) => item.status === 'partial-shortage')
  const missing = items.filter((item) => item.status === 'total-shortage')

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">Revisão final</h2>
          <p className="text-sm text-slate-600">Feche só quando não houver pendente.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onBack}>
            Voltar ao pedido
          </Button>
          <Button onClick={onConfirm} disabled={summary.pending > 0}>
            Confirmar conclusão
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl bg-red-50 p-4">
          <div className="flex items-center gap-2 text-base font-black text-red-800">
            <CircleAlert className="h-4 w-4" />
            Pendentes
          </div>
          <p className="mt-2 text-3xl font-black text-red-700">{summary.pending}</p>
        </div>
        <div className="rounded-3xl bg-orange-50 p-4">
          <div className="text-base font-black text-orange-800">Falta parcial</div>
          <p className="mt-2 text-3xl font-black text-orange-700">{summary.partialShortage}</p>
        </div>
        <div className="rounded-3xl bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-base font-black text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Em falta total
          </div>
          <p className="mt-2 text-3xl font-black text-amber-700">{summary.totalShortage}</p>
        </div>
      </div>

      {summary.pending === 0 ? (
        <div className="mt-4 rounded-3xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
          <div className="flex items-center gap-2 text-lg font-black">
            <CheckCircle2 className="h-5 w-5" />
            Pedido liberado
          </div>
          <p className="mt-1 text-sm">Faltas continuam listadas e entram no histórico mínimo ao concluir.</p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ReviewColumn title="Pendentes" items={pending} emptyText="Nenhum pendente." />
        <ReviewColumn title="Falta parcial" items={partial} emptyText="Nenhum item parcial." />
        <ReviewColumn title="Em falta total" items={missing} emptyText="Nenhuma ruptura total." />
      </div>
    </Card>
  )
}

function ReviewColumn({ title, items, emptyText }: { title: string; items: OrderItem[]; emptyText: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-base font-black text-slate-950">{title}</h3>
      <div className="mt-3 grid gap-3">
        {items.length === 0 ? (
          <p className="rounded-2xl bg-white p-3 text-sm text-slate-600">{emptyText}</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-slate-900">{item.description}</div>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-1 text-slate-600">
                Separado {item.quantitySeparated}/{item.quantityRequested} | Faltou {item.quantityMissing}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
