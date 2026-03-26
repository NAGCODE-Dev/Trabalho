import { AlertTriangle, CircleAlert, PackageCheck, Wallet } from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { Progress } from '../../../components/ui/progress'
import { formatCurrency, formatQuantity } from '../../../lib/utils'
import type { OrderSummary } from '../types'

export function SummaryPanel({ summary }: { summary: OrderSummary }) {
  const shortageCount = summary.partialShortage + summary.totalShortage

  return (
    <Card className="sticky top-2 z-20 border-slate-300 bg-slate-950 text-white">
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Resumo</p>
            <p className="mt-1 text-2xl font-black">{summary.completionRate}% feito</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-right text-sm">
            <div>{summary.visibleItems} exibidos</div>
            <div className="text-slate-300">de {summary.totalItems} itens</div>
          </div>
        </div>

        <div className="mt-4">
          <Progress value={summary.completionRate} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-red-600 p-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/80">
              <CircleAlert className="h-3.5 w-3.5" />
              Pendente
            </div>
            <p className="mt-2 text-2xl font-black">{summary.pending}</p>
          </div>
          <div className="rounded-2xl bg-amber-400 p-3 text-slate-950">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-900/70">
              <AlertTriangle className="h-3.5 w-3.5" />
              Falta
            </div>
            <p className="mt-2 text-2xl font-black">{shortageCount}</p>
          </div>
          <div className="rounded-2xl bg-emerald-600 p-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/80">
              <PackageCheck className="h-3.5 w-3.5" />
              OK
            </div>
            <p className="mt-2 text-2xl font-black">{summary.separatedComplete}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Qtd</div>
            <p className="mt-2 text-sm">
              Pedida {formatQuantity(summary.quantityRequested)} | Feita {formatQuantity(summary.quantitySeparated)} | Falta {formatQuantity(summary.quantityMissing)}
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3 sm:col-span-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
              <Wallet className="h-3.5 w-3.5" />
              Valores
            </div>
            <p className="mt-2 text-sm">
              Pedido {formatCurrency(summary.orderValueRequested)} | Feito {formatCurrency(summary.orderValueServed)} | Falta {formatCurrency(summary.orderValueMissing)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
