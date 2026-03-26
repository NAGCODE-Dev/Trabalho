import { TriangleAlert } from 'lucide-react'
import { Button } from '../../../components/ui/button'

interface PendingBannerProps {
  pending: number
  partial: number
  totalShortage: number
  onUndo: () => void
}

export function PendingBanner({ pending, partial, totalShortage, onUndo }: PendingBannerProps) {
  const shortageCount = partial + totalShortage

  return (
    <div className="sticky top-[8.2rem] z-20 rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2 text-slate-900 shadow-md">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TriangleAlert className="h-4 w-4 flex-none text-amber-700" />
          <p className="text-sm font-black">{pending} pendente(s)</p>
          <span className="rounded-full bg-amber-200 px-2 py-1 text-xs font-bold text-amber-900">Falta {shortageCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Não conclui com pendente.</span>
          <Button size="sm" variant="secondary" onClick={onUndo}>
            Desfazer
          </Button>
        </div>
      </div>
    </div>
  )
}
