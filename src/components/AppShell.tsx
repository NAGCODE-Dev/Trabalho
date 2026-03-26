import type { ReactNode } from 'react'

export function AppShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-3 pb-32 pt-3 sm:px-4 lg:px-6">
      {header}
      <main className="mt-4 flex flex-1 flex-col gap-4">{children}</main>
    </div>
  )
}
