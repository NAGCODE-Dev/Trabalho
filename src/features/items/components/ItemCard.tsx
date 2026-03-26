import { AlertTriangle, Camera, Package, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { formatCurrency, formatQuantity } from '../../../lib/utils'
import type { OrderItem } from '../../orders/types'
import { getHighlightRanges, getItemSearchMatch, statusMeta } from '../../orders/utils'
import { StatusBadge } from './StatusBadge'

interface ItemCardProps {
  item: OrderItem
  compactMode: boolean
  searchQuery: string
  onSetStatus: (status: OrderItem['status']) => void
  onSetSeparatedQuantity: (quantity: number) => void
  onOpenImage: () => void
  onDelete: () => void
}

export function ItemCard({
  item,
  compactMode,
  searchQuery,
  onSetStatus,
  onSetSeparatedQuantity,
  onOpenImage,
  onDelete,
}: ItemCardProps) {
  const meta = statusMeta[item.status]
  const match = getItemSearchMatch(item, searchQuery)

  return (
    <Card className={`overflow-hidden border-2 ${meta.border} ${meta.bg}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.status} />
              {item.hasHistoryAlert ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                  Já faltou antes
                </span>
              ) : null}
              {item.highQuantity ? (
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Qtd alta</span>
              ) : null}
            </div>
            <h3 className="mt-3 text-lg font-black text-slate-950">
              <HighlightedText text={item.description} query={match.fields.includes('description') ? searchQuery : ''} />
            </h3>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-700">
              <span>
                Cód <HighlightedText text={item.code || '-'} query={match.fields.includes('code') ? searchQuery : ''} strong />
              </span>
              <span>
                Un <HighlightedText text={item.unit} query={match.fields.includes('unit') ? searchQuery : ''} strong />
              </span>
            </div>
          </div>
          <Button size="icon" variant="secondary" onClick={onOpenImage}>
            <Camera className="h-4 w-4" />
          </Button>
        </div>

        <div className={`mt-4 grid gap-3 ${compactMode ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}`}>
          <div className="rounded-2xl bg-white/80 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pedida</p>
            <p className="mt-1 text-lg font-black text-slate-950">{formatQuantity(item.quantityRequested)}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Feita</p>
            <Input
              type="number"
              min={0}
              max={item.quantityRequested}
              value={item.quantitySeparated}
              onChange={(event) => onSetSeparatedQuantity(Number(event.target.value))}
              className="mt-1 bg-white"
            />
          </div>
          <div className="rounded-2xl bg-white/80 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Falta</p>
            <p className="mt-1 text-lg font-black text-slate-950">{formatQuantity(item.quantityMissing)}</p>
            <p className="mt-1 text-xs text-slate-600">
              {formatQuantity(item.quantitySeparated)}/{formatQuantity(item.quantityRequested)}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-white/80 p-3 text-sm text-slate-700">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Package className="h-4 w-4" />
            Valores
          </div>
          <p className="mt-2">
            Unit {formatCurrency(item.unitPrice)} | Pedido {formatCurrency(item.lineTotalRequested)}
          </p>
          <p>
            Feito {formatCurrency(item.lineTotalServed)} | Falta {formatCurrency(item.lineTotalMissing)}
          </p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <Button variant="primary" onClick={() => onSetStatus('pending')}>
            Pendente
          </Button>
          <Button variant="secondary" onClick={() => onSetStatus('separated-complete')}>
            OK
          </Button>
          <Button variant="warning" onClick={() => onSetStatus('partial-shortage')}>
            Parcial
          </Button>
          <Button variant="warning" onClick={() => onSetStatus('total-shortage')}>
            Falta
          </Button>
        </div>
        <Button className="mt-2" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          Excluir
        </Button>
      </div>
    </Card>
  )
}

function HighlightedText({
  text,
  query,
  strong = false,
}: {
  text: string
  query: string
  strong?: boolean
}) {
  const ranges = getHighlightRanges(text, query)
  if (ranges.length === 0) {
    return <>{text}</>
  }

  const parts: Array<{ text: string; highlighted: boolean }> = []
  let cursor = 0

  for (const range of ranges) {
    if (range.start > cursor) {
      parts.push({ text: text.slice(cursor, range.start), highlighted: false })
    }
    parts.push({ text: text.slice(range.start, range.end), highlighted: true })
    cursor = range.end
  }

  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), highlighted: false })
  }

  return (
    <>
      {parts.map((part, index) =>
        part.highlighted ? (
          <mark
            key={`${part.text}-${index}`}
            className={`rounded px-1 ${strong ? 'bg-amber-300 text-slate-950' : 'bg-yellow-200 text-slate-950'}`}
          >
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </>
  )
}
