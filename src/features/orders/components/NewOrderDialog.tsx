import { useState } from 'react'
import { Dialog } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'

export function NewOrderDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (reference?: string) => void
}) {
  const [reference, setReference] = useState('')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Novo pedido"
      description="Cria um pedido vazio para iniciar o fluxo por OCR, texto ou inserção manual excepcional."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onCreate(reference)
              setReference('')
              onClose()
            }}
          >
            Criar pedido
          </Button>
        </>
      }
    >
      <Input placeholder="Referência do pedido, ex. PED-10500" value={reference} onChange={(event) => setReference(event.target.value)} />
    </Dialog>
  )
}
