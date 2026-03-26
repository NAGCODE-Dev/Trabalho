import { FileWarning, Layers3 } from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { formatDateTime } from '../../../lib/utils'
import { summarizeOrder } from '../utils'
import type { Order } from '../types'

export function OrderCard({ order, onOpen }: { order: Order; onOpen: () => void }) {
  const summary = summarizeOrder(order)
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-slate-950">{order.reference}</div>
          <p className="mt-1 text-sm text-slate-600">{formatDateTime(order.updatedAt)}</p>
        </div>
        <Badge className={order.stage === 'ocr-review' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}>
          {order.stage === 'ocr-review' ? 'Revisão OCR' : order.stage === 'picking' ? 'Separação' : 'Intake'}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Layers3 className="h-3.5 w-3.5" />
            Páginas
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800">{order.pages.length} página(s) vinculada(s)</p>
        </div>
        <div className="rounded-2xl bg-red-50 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-600">
            <FileWarning className="h-3.5 w-3.5" />
            Pendências
          </div>
          <p className="mt-2 text-sm font-semibold text-red-700">
            {summary.pending} pendente(s), {summary.partialShortage} parcial(is), {summary.totalShortage} em falta
          </p>
        </div>
      </div>

      <Button className="mt-4" fullWidth onClick={onOpen}>
        Abrir pedido
      </Button>
    </Card>
  )
}
