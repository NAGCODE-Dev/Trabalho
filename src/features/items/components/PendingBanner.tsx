import { TriangleAlert } from 'lucide-react'
import { Button } from '../../../components/ui/button'

interface PendingBannerProps {
  pending: number
  partial: number
  totalShortage: number
  onUndo: () => void
}

export function PendingBanner({ pending, partial, totalShortage, onUndo }: PendingBannerProps) {
  return (
    <div className="sticky top-[10.2rem] z-20 rounded-3xl border border-red-300 bg-red-600 p-4 text-white shadow-lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 h-5 w-5 flex-none" />
          <div>
            <p className="text-base font-black">{pending} item(ns) ainda exigem decisão obrigatória</p>
            <p className="text-sm text-red-100">
              Parciais: {partial} | Em falta total: {totalShortage}. Nenhum pedido pode ser concluído com pendentes.
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={onUndo}>
          Desfazer última alteração
        </Button>
      </div>
    </div>
  )
}
