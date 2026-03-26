import { Download, RefreshCcw, WifiOff } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface PwaBannerProps {
  isOnline: boolean
  isInstalled: boolean
  canInstall: boolean
  updateReady: boolean
  onInstall: () => void
  onRefresh: () => void
}

export function PwaBanner({
  isOnline,
  isInstalled,
  canInstall,
  updateReady,
  onInstall,
  onRefresh,
}: PwaBannerProps) {
  if (isOnline && !canInstall && !updateReady && isInstalled) return null
  if (isOnline && !canInstall && !updateReady && !isInstalled) return null

  return (
    <Card className="border-slate-300 bg-slate-950 text-white">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {!isOnline ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <WifiOff className="h-4 w-4" />
              Sem internet. O shell do app continua disponível offline.
            </div>
          ) : null}
          {canInstall ? (
            <p className="text-sm text-slate-200">Instale este PWA na tela inicial para usar em modo app, com acesso mais rápido no celular.</p>
          ) : null}
          {updateReady ? (
            <p className="text-sm text-slate-200">Uma nova versão do app está pronta. Atualize para carregar o cache mais recente.</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {canInstall ? (
            <Button variant="warning" onClick={onInstall}>
              <Download className="h-4 w-4" />
              Instalar app
            </Button>
          ) : null}
          {updateReady ? (
            <Button variant="secondary" onClick={onRefresh}>
              <RefreshCcw className="h-4 w-4" />
              Atualizar
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
