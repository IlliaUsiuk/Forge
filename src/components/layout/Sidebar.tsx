'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarDays, BookMarked, Layers, Bot, LogOut,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/sync'
import { useRouter } from 'next/navigation'

const NAV = [
  { href: '/',          icon: LayoutDashboard, label: 'Главная' },
  { href: '/chat',      icon: Bot,             label: 'Помощник' },
  { href: '/schedule',  icon: CalendarDays,    label: 'Расписание' },
  { href: '/pool',      icon: Layers,          label: 'Активности' },
  { href: '/journal',   icon: BookMarked,      label: 'Дневник' },
]


export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { userName, avatarUrl } = useStore()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  const firstLetter = userName.trim().charAt(0).toUpperCase() || '?'

  return (
    <aside className="flex w-16 flex-col items-center border-r border-border bg-sidebar py-5 lg:w-60 lg:items-start lg:px-4">

      {/* Logo → Profile page */}
      <Link
        href="/profile"
        className="mb-6 flex h-9 w-9 items-center justify-center rounded-xl lg:w-full lg:rounded-2xl lg:h-auto lg:py-0 group"
        style={{ background: 'none' }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-black text-white transition-opacity group-hover:opacity-80 overflow-hidden"
          style={{ background: avatarUrl ? undefined : 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
        >
          {avatarUrl
            ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            : firstLetter
          }
        </div>
        <span className="ml-3 hidden truncate text-base font-semibold text-foreground transition-opacity group-hover:opacity-70 lg:block">
          {userName}
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex w-full flex-col gap-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group relative flex h-10 items-center justify-center rounded-xl transition-all duration-150 lg:justify-start lg:gap-3 lg:px-3',
                active
                  ? 'text-primary'
                  : 'text-sidebar-foreground hover:text-foreground'
              )}
              style={active ? {
                background: 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(167,139,250,0.08))',
                boxShadow: '0 0 0 1px rgba(129,140,248,0.12) inset',
              } : undefined}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full"
                  style={{ background: '#818cf8' }}
                />
              )}
              <Icon size={20} className={cn('shrink-0', active ? 'text-primary' : '')} />
              <span className="hidden text-base font-medium lg:block">{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="flex-1" />

      <div className="flex w-full flex-col gap-2">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-all hover:text-red-400 lg:justify-start"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <LogOut size={18} className="shrink-0" />
          <span className="hidden text-sm lg:block">Выйти</span>
        </button>
      </div>
    </aside>
  )
}
