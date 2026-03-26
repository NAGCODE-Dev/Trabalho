import { Archive, ClipboardCheck, ScanLine, Smartphone } from 'lucide-react'
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
  return (
    <Card className="overflow-hidden border-0 bg-slate-950 text-white">
      <div className="bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.35),transparent_26%),linear-gradient(135deg,#0f172a_0%,#111827_70%,#1f2937_100%)] p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80">
                <ScanLine className="h-3.5 w-3.5" />
                Conferência mobile-first
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Separação segura de pedidos</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Operação desenhada para celular, com revisão de OCR, pendências muito visíveis e limpeza automática dos dados completos após conclusão.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <ClipboardCheck className="h-4 w-4 text-emerald-300" />
                Pedido ativo
              </div>
              <p className="mt-2 text-lg font-bold">{hasCurrentOrder ? currentReference : 'Nenhum pedido aberto'}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Archive className="h-4 w-4 text-amber-300" />
                Retenção mínima
              </div>
              <p className="mt-2 text-sm text-slate-300">Pedidos concluídos são apagados. Só faltas totais e parciais permanecem no histórico local.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Smartphone className="h-4 w-4 text-cyan-300" />
                Estado PWA
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {isInstalled ? 'Instalado em modo app.' : 'Executando no navegador.'} {isOnline ? 'Online.' : 'Offline.'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {saveState === 'saving'
                  ? 'Salvando localmente...'
                  : saveState === 'saved'
                    ? `Salvo localmente${lastSavedAt ? ` em ${formatDateTime(lastSavedAt)}` : '.'}`
                    : saveState === 'error'
                      ? 'Falha ao salvar localmente.'
                      : 'Aguardando alteração.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={onNewOrder}>
              Novo pedido
            </Button>
            <Button size="lg" variant="secondary" onClick={onToggleHistory}>
              {showingHistory ? 'Voltar para operação' : 'Abrir histórico de faltas'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
