import type { ReactNode } from 'react'
import { Header } from './Header'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-slate-950 text-white">
      <Header />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}
