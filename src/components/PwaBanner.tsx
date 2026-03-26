import { Download, RefreshCcw, WifiOff, X } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface PwaBannerProps {
  isOnline: boolean
  isInstalled: boolean
  canInstall: boolean
  updateReady: boolean
  onInstall: () => void
  onRefresh: () => void
  onDismissInstall?: () => void
}

export function PwaBanner({
  isOnline,
  isInstalled,
  canInstall,
  updateReady,
  onInstall,
  onRefresh,
  onDismissInstall,
}: PwaBannerProps) {
  if (isOnline && !canInstall && !updateReady && isInstalled) return null
  if (isOnline && !canInstall && !updateReady && !isInstalled) return null

  return (
    <Card className="border-slate-300 bg-slate-950 text-white">
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {!isOnline ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <WifiOff className="h-4 w-4" />
              Sem internet.
            </div>
          ) : null}
          {canInstall ? (
            <p className="text-sm text-slate-200">Instalar na tela inicial.</p>
          ) : null}
          {updateReady ? (
            <p className="text-sm text-slate-200">Nova versão disponível.</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {canInstall ? (
            <>
              <Button variant="warning" onClick={onInstall}>
                <Download className="h-4 w-4" />
                Instalar app
              </Button>
              {onDismissInstall ? (
                <Button variant="ghost" onClick={onDismissInstall}>
                  <X className="h-4 w-4" />
                  Agora não
                </Button>
              ) : null}
            </>
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
