import { History, PackageX } from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { formatDateTime, formatQuantity } from '../../../lib/utils'
import type { MinimalShortageRecord } from '../../orders/types'

export function ShortageHistoryPanel({ history }: { history: MinimalShortageRecord[] }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-lg font-black text-slate-950">
        <History className="h-5 w-5" />
        Histórico mínimo de faltas
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Só registros mínimos de itens com falta total ou parcial são mantidos localmente após a conclusão.
      </p>

      <div className="mt-4 grid gap-3">
        {history.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">Nenhum histórico mínimo salvo.</div>
        ) : (
          history.map((record) => (
            <div key={record.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-base font-bold text-slate-950">
                    <PackageX className="h-4 w-4 text-orange-600" />
                    {record.productLabel}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">Código {record.productCode || 'sem código'} | Falta {formatQuantity(record.missingQuantity)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${record.occurrenceType === 'total-shortage' ? 'bg-amber-200 text-amber-900' : 'bg-orange-200 text-orange-900'}`}>
                  {record.occurrenceType === 'total-shortage' ? 'Falta total' : 'Falta parcial'}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {formatDateTime(record.createdAt)} {record.lastOrderReference ? `| Último pedido ${record.lastOrderReference}` : ''}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
