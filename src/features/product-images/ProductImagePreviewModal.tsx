import { useEffect, useState } from 'react'
import { Dialog } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { formatQuantity } from '../../lib/utils'
import { mockProductImageAdapter } from './adapter'
import type { OrderItem } from '../orders/types'

interface ProductImagePreviewModalProps {
  open: boolean
  item: OrderItem | null
  onClose: () => void
}

export function ProductImagePreviewModal({ open, item, onClose }: ProductImagePreviewModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !item) return
    void mockProductImageAdapter.getImage(item.description, item.code).then(setImageUrl)
  }, [item, open])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Imagem do item"
      footer={<Button onClick={onClose}>Fechar</Button>}
    >
      {item ? (
        <div className="grid gap-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
            {imageUrl ? <img src={imageUrl} alt={item.description} className="h-52 w-full object-cover" /> : <div className="flex h-52 items-center justify-center text-sm text-slate-500">Carregando imagem de apoio...</div>}
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
            <p className="text-lg font-black text-slate-950">{item.description}</p>
            <p className="mt-2">Código {item.code || 'sem código'} | Unidade {item.unit}</p>
            <p className="mt-1">
              Pedido {formatQuantity(item.quantityRequested)} | Separado {formatQuantity(item.quantitySeparated)}
            </p>
          </div>
        </div>
      ) : null}
    </Dialog>
  )
}
