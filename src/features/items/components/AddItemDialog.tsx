import { useState } from 'react'
import { Dialog } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'

export function AddItemDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (input: {
    description: string
    code: string
    unit: string
    quantityRequested: number
    unitPrice: number
    note?: string
  }) => void
}) {
  const [description, setDescription] = useState('')
  const [code, setCode] = useState('')
  const [unit, setUnit] = useState('UN')
  const [quantityRequested, setQuantityRequested] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [note, setNote] = useState('')

  function reset() {
    setDescription('')
    setCode('')
    setUnit('UN')
    setQuantityRequested(1)
    setUnitPrice(0)
    setNote('')
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Adicionar item manualmente"
      description="Use apenas se o OCR falhou ou se faltou reconhecer algum item."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onAdd({ description, code, unit, quantityRequested, unitPrice, note })
              reset()
              onClose()
            }}
            disabled={!description.trim()}
          >
            Adicionar item
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Input placeholder="Descrição" value={description} onChange={(event) => setDescription(event.target.value)} />
        <Input placeholder="Código" value={code} onChange={(event) => setCode(event.target.value)} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Input placeholder="Unidade" value={unit} onChange={(event) => setUnit(event.target.value)} />
          <Input type="number" min={1} value={quantityRequested} onChange={(event) => setQuantityRequested(Number(event.target.value))} />
          <Input type="number" min={0} step="0.01" value={unitPrice} onChange={(event) => setUnitPrice(Number(event.target.value))} />
        </div>
        <Textarea placeholder="Observação opcional" value={note} onChange={(event) => setNote(event.target.value)} />
      </div>
    </Dialog>
  )
}
