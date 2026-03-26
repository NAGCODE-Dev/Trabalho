import { Archive, ClipboardCheck, History, Smartphone } from 'lucide-react'
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
      <div className="bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.22),transparent_24%),linear-gradient(135deg,#0f172a_0%,#111827_70%,#1f2937_100%)] p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-black tracking-tight">Conferência de pedidos</h1>
              <p className="mt-1 text-sm text-slate-300">
                {hasCurrentOrder ? `Pedido atual: ${currentReference}` : 'Nenhum pedido aberto'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
              <div className="flex items-center justify-end gap-2 text-xs font-semibold text-white">
                <Smartphone className="h-3.5 w-3.5 text-cyan-300" />
                {isInstalled ? 'App' : 'Navegador'} • {isOnline ? 'Online' : 'Offline'}
              </div>
              <p className="mt-1 text-xs text-slate-400">{saveLabel}</p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <div className="flex items-center gap-2 font-semibold text-white">
                <ClipboardCheck className="h-4 w-4 text-emerald-300" />
                Pedido
              </div>
              <p className="mt-1 text-slate-300">{hasCurrentOrder ? currentReference : 'Aguardando abertura'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Archive className="h-4 w-4 text-amber-300" />
                Retenção
              </div>
              <p className="mt-1 text-slate-300">Pedido concluído é apagado. Só faltas ficam salvas.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={onNewOrder}>Novo pedido</Button>
            <Button variant="secondary" onClick={onToggleHistory}>
              <History className="h-4 w-4" />
              {showingHistory ? 'Voltar' : 'Histórico de faltas'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
