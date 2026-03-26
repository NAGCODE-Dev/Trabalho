import { Dialog } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'

interface CompletionConfirmationDialogProps {
  open: boolean
  step: 1 | 2
  onClose: () => void
  onConfirm: () => void
}

export function CompletionConfirmationDialog({
  open,
  step,
  onClose,
  onConfirm,
}: CompletionConfirmationDialogProps) {
  const title =
    step === 1 ? 'Confirmação final do pedido' : 'Confirmação extra antes de liberar a próxima lista'
  const description =
    step === 1
      ? 'Você revisou todos os itens deste pedido? Pendentes impedem a conclusão.'
      : 'Após concluir, os dados completos do pedido serão removidos do dispositivo. Só faltas totais e parciais ficam no histórico mínimo.'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>
            {step === 1 ? 'Confirmar revisão' : 'Concluir e liberar próxima lista'}
          </Button>
        </>
      }
    >
      <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
        {step === 1
          ? 'Revise pendentes, faltas parciais e faltas totais antes de confirmar.'
          : 'Os dados operacionais completos do pedido, inclusive imagens e checklist detalhado, serão apagados do armazenamento local.'}
      </div>
    </Dialog>
  )
}
