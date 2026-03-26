import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950/20',
  {
    variants: {
      variant: {
        primary: 'bg-slate-950 text-white hover:bg-slate-800',
        secondary: 'bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        ghost: 'text-slate-700 hover:bg-slate-100',
        warning: 'bg-amber-400 text-slate-950 hover:bg-amber-300',
      },
      size: {
        sm: 'h-10 px-3',
        md: 'h-12 px-4',
        lg: 'h-14 px-5 text-base',
        icon: 'h-12 w-12',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, fullWidth }), className)} {...props} />
  ),
)

Button.displayName = 'Button'
