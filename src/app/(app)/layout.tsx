import { Sidebar } from '@/components/layout/Sidebar'
import { LayoutClient } from '@/components/layout/LayoutClient'

export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <LayoutClient>{children}</LayoutClient>
      </main>
    </div>
  )
}
