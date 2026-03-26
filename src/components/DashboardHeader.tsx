import { History, Smartphone } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { formatDateTime } from '../lib/utils'

interface DashboardHeaderProps {
  hasCurrentOrder: boolean
  currentReference?: string
  onNewOrder: () => void
  onToggleHistory: () => void
  showingHistory: boolean
  isOnline: boolean
  isInstalled: boolean
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt: string | null
}

export function DashboardHeader({
  hasCurrentOrder,
  currentReference,
  onNewOrder,
  onToggleHistory,
  showingHistory,
  isOnline,
  isInstalled,
  saveState,
  lastSavedAt,
}: DashboardHeaderProps) {
  const saveLabel =
    saveState === 'saving'
      ? 'Salvando...'
      : saveState === 'saved'
        ? `Salvo${lastSavedAt ? ` às ${formatDateTime(lastSavedAt)}` : ''}`
        : saveState === 'error'
          ? 'Falha ao salvar'
          : 'Sem alteração'

  return (
    <Card className="overflow-hidden border-0 bg-slate-950 text-white">
      <div className="bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_24%),linear-gradient(135deg,#0f172a_0%,#111827_70%,#1f2937_100%)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight">Conferência</h1>
            <p className="mt-1 text-sm text-slate-300">{hasCurrentOrder ? currentReference : 'Sem pedido aberto'}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
              <div className="flex items-center justify-end gap-2 text-xs font-semibold text-white">
                <Smartphone className="h-3.5 w-3.5 text-cyan-300" />
                {isInstalled ? 'App' : 'Navegador'} • {isOnline ? 'Online' : 'Offline'}
              </div>
              <p className="mt-1 text-xs text-slate-400">{saveLabel}</p>
            </div>

            <Button onClick={onNewOrder}>Novo pedido</Button>
            <Button variant="secondary" onClick={onToggleHistory}>
              <History className="h-4 w-4" />
              {showingHistory ? 'Fechar histórico' : 'Histórico'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
