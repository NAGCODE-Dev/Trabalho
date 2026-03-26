import { Dialog } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'

export function ExitConfirmationDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Sair do pedido"
      description="Há pendências ou dados ainda em revisão. O pedido em andamento continuará salvo localmente se você apenas sair da tela."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Continuar no pedido
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Sair da tela
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-700">
        Esta ação não conclui o pedido. Ela apenas volta para a tela inicial mantendo o pedido em andamento salvo no dispositivo.
      </p>
    </Dialog>
  )
}
