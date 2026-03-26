interface ProgressProps {
  value: number
}

export function Progress({ value }: ProgressProps) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-emerald-500 transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}
