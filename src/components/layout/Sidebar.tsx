'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Crown, Scroll,
  BookOpen, Flame, Zap, Settings, BookMarked, Briefcase, ShoppingBag,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/',          icon: Crown,          label: 'Цитадель' },
  { href: '/schedule',  icon: Scroll,         label: 'Хроники' },
  { href: '/stats',     icon: BookOpen,       label: 'Свитки' },
  { href: '/journal',   icon: BookMarked,     label: 'Дневник' },
  { href: '/career',    icon: Briefcase,      label: 'Карьера' },
  { href: '/shop',      icon: ShoppingBag,    label: 'Магазин' },
  { href: '/settings',  icon: Settings,       label: 'Настройки' },
]

const RANK_NAMES = ['Странник', 'Ученик', 'Воин', 'Рыцарь', 'Страж', 'Чемпион', 'Паладин', 'Легенда', 'Архонт']

export function Sidebar() {
  const pathname = usePathname()
  const { streak, trackXP, purchases } = useStore()
  const totalXP = Object.values(trackXP).reduce((a, b) => a + b, 0)
  const spentXP = purchases.reduce((s, p) => s + p.price, 0)
  const availableXP = totalXP - spentXP
  const level = Math.floor(totalXP / 200) + 1
  const rankIndex = Math.min(Math.floor((level - 1) / 3), RANK_NAMES.length - 1)
  const rankName = RANK_NAMES[rankIndex]

  return (
    <aside className="flex w-16 flex-col items-center border-r border-border bg-sidebar py-5 lg:w-60 lg:items-start lg:px-4">

      {/* Logo */}
      <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-xl lg:w-full lg:rounded-2xl lg:h-auto lg:py-0"
        style={{ background: 'none' }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
          style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
        >
          И
        </div>
        <span className="ml-3 hidden text-sm font-semibold text-foreground lg:block">
          Цитадель Ильи
        </span>
      </div>

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
              <Icon size={17} className={cn('shrink-0', active ? 'text-primary' : '')} />
              <span className="hidden text-sm font-medium lg:block">{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* Streak + XP */}
      <div className="flex w-full flex-col gap-2">
        <div
          className="flex items-center justify-center gap-3 rounded-xl px-3 py-3 lg:justify-start"
          style={{
            background: 'linear-gradient(135deg, rgba(251,146,60,0.12), rgba(251,146,60,0.04))',
            boxShadow: '0 0 0 1px rgba(251,146,60,0.1) inset',
          }}
        >
          <Flame size={18} className="shrink-0 text-orange-400" />
          <div className="hidden lg:block">
            <p className="text-xs text-orange-400/60">Стрик</p>
            <p className="text-sm font-bold text-orange-300">{streak.current} дней</p>
          </div>
          <span className="text-sm font-bold text-orange-300 lg:hidden">{streak.current}</span>
        </div>

        <Link href="/shop">
          <div
            className="flex items-center justify-center gap-3 rounded-xl px-3 py-3 lg:justify-start cursor-pointer transition-all hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, rgba(129,140,248,0.12), rgba(129,140,248,0.04))',
              boxShadow: '0 0 0 1px rgba(129,140,248,0.1) inset',
            }}
          >
            <Zap size={18} className="shrink-0 text-primary" />
            <div className="hidden lg:block min-w-0">
              <p className="text-xs text-primary/60 truncate">{rankName}</p>
              <p className="text-sm font-bold text-primary">Ур. {level} · {availableXP} XP</p>
            </div>
            <span className="text-xs font-bold text-primary lg:hidden">{level}</span>
          </div>
        </Link>
      </div>
    </aside>
  )
}
