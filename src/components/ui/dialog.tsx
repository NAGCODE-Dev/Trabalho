import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export function Dialog({ open, onClose, title, description, children, footer }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 sm:items-center">
      <div className="w-full max-w-xl rounded-[28px] bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="text-lg font-semibold text-slate-950">{title}</div>
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </div>
        <div className={cn('max-h-[72vh] overflow-y-auto px-5 py-4')}>{children}</div>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          {footer}
        </div>
        <button
          type="button"
          aria-label="Fechar diálogo"
          className="absolute inset-0 -z-10"
          onClick={onClose}
        />
      </div>
    </div>
  )
}
