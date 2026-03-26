import { AlertTriangle, CircleAlert, PackageCheck } from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { Progress } from '../../../components/ui/progress'
import { formatCurrency, formatQuantity } from '../../../lib/utils'
import type { OrderSummary } from '../types'

export function SummaryPanel({ summary }: { summary: OrderSummary }) {
  const shortageCount = summary.partialShortage + summary.totalShortage

  return (
    <Card className="sticky top-2 z-20 border-slate-300 bg-slate-950 text-white">
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Resumo</p>
            <p className="mt-1 text-2xl font-black">{summary.completionRate}% feito</p>
            <p className="mt-1 text-xs text-slate-400">
              {summary.visibleItems} de {summary.totalItems} item(ns)
            </p>
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">{summary.pending} em aberto</div>
        </div>

        <div className="mt-3">
          <Progress value={summary.completionRate} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-red-600 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-white/80">
              <CircleAlert className="h-3.5 w-3.5" />
              Pendente
            </div>
            <p className="mt-1 text-2xl font-black leading-none">{summary.pending}</p>
          </div>
          <div className="rounded-2xl bg-amber-400 px-3 py-2 text-slate-950">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-900/70">
              <AlertTriangle className="h-3.5 w-3.5" />
              Falta
            </div>
            <p className="mt-1 text-2xl font-black leading-none">{shortageCount}</p>
          </div>
          <div className="rounded-2xl bg-emerald-600 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-white/80">
              <PackageCheck className="h-3.5 w-3.5" />
              OK
            </div>
            <p className="mt-1 text-2xl font-black leading-none">{summary.separatedComplete}</p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-white/5 px-3 py-2 text-xs text-slate-300">
          Qtd {formatQuantity(summary.quantitySeparated)}/{formatQuantity(summary.quantityRequested)} | Falta {formatQuantity(summary.quantityMissing)} | {formatCurrency(summary.orderValueServed)} de {formatCurrency(summary.orderValueRequested)}
        </div>
      </div>
    </Card>
  )
}
