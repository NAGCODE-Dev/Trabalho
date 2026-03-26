import { AlertTriangle, CircleAlert, PackageCheck, Wallet } from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { Progress } from '../../../components/ui/progress'
import { formatCurrency, formatQuantity } from '../../../lib/utils'
import type { OrderSummary } from '../types'

export function SummaryPanel({ summary }: { summary: OrderSummary }) {
  return (
    <Card className="sticky top-2 z-20 border-slate-300 bg-slate-950 text-white">
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Resumo do pedido</p>
            <p className="mt-1 text-2xl font-black">{summary.completionRate}% conferido</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-right text-sm">
            <div>{summary.visibleItems} exibidos</div>
            <div className="text-slate-300">de {summary.totalItems} itens</div>
          </div>
        </div>

        <div className="mt-4">
          <Progress value={summary.completionRate} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-red-600 p-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/80">
              <CircleAlert className="h-3.5 w-3.5" />
              Pendentes
            </div>
            <p className="mt-2 text-2xl font-black">{summary.pending}</p>
          </div>
          <div className="rounded-2xl bg-orange-500 p-3">
            <div className="text-xs uppercase tracking-wide text-white/80">Falta parcial</div>
            <p className="mt-2 text-2xl font-black">{summary.partialShortage}</p>
          </div>
          <div className="rounded-2xl bg-amber-400 p-3 text-slate-950">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-900/70">
              <AlertTriangle className="h-3.5 w-3.5" />
              Em falta
            </div>
            <p className="mt-2 text-2xl font-black">{summary.totalShortage}</p>
          </div>
          <div className="rounded-2xl bg-emerald-600 p-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/80">
              <PackageCheck className="h-3.5 w-3.5" />
              Completos
            </div>
            <p className="mt-2 text-2xl font-black">{summary.separatedComplete}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Quantidades</div>
            <p className="mt-2 text-sm">
              Pedida {formatQuantity(summary.quantityRequested)} | Separada {formatQuantity(summary.quantitySeparated)} |
              Faltante {formatQuantity(summary.quantityMissing)}
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3 sm:col-span-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
              <Wallet className="h-3.5 w-3.5" />
              Financeiro recalculado
            </div>
            <p className="mt-2 text-sm">
              Pedido {formatCurrency(summary.orderValueRequested)} | Atendido {formatCurrency(summary.orderValueServed)} |
              Faltante {formatCurrency(summary.orderValueMissing)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
