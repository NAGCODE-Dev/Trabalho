import { useMemo, useState } from 'react'
import { Dialog } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Textarea } from '../../../components/ui/textarea'
import { sampleImportText } from '../../../data/mockTextImport'
import { generateId } from '../../../lib/utils'
import { parseOrderLine } from '../../scanner/parser'
import type { OCRPreviewItem } from '../../orders/types'

export function ImportItemsDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean
  onClose: () => void
  onImport: (previewItems: OCRPreviewItem[]) => void
}) {
  const [text, setText] = useState(sampleImportText)

  const preview = useMemo(() => {
    const lines = text.split('\n').map((line) => line.trim())
    const validLines = lines.filter((line) => line.length > 0)
    const parsed = validLines.map((line) => parseOrderLine(line, 'text-import-page'))
    return {
      previewItems: parsed.flatMap((entry) => (entry.item ? [{ ...entry.item, id: generateId('import-item') }] : [])),
      invalid: parsed.flatMap((entry) => (entry.issue ? [entry.issue] : [])),
    }
  }, [text])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Importação por texto"
      description="Formato esperado: descrição; código; unidade; quantidade; valor unitário; valor total. Linhas vazias são ignoradas. Erros nunca são ignorados silenciosamente."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onImport(preview.previewItems)} disabled={preview.previewItems.length === 0}>
            Importar itens válidos
          </Button>
        </>
      }
    >
      <Textarea value={text} onChange={(event) => setText(event.target.value)} />
      <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm">
        <p className="font-semibold text-slate-900">Prévia</p>
        <p className="mt-1 text-slate-600">
          {preview.previewItems.length} linha(s) válida(s) | {preview.invalid.length} inválida(s)
        </p>
        {preview.invalid.length > 0 ? (
          <div className="mt-3 grid gap-2">
            {preview.invalid.map((issue) => (
              <div key={issue.id} className="rounded-2xl bg-red-50 p-3 text-red-700">
                <div className="font-semibold">{issue.line}</div>
                <div>{issue.reason}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Dialog>
  )
}
