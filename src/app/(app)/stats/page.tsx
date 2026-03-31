'use client'

import { useMemo } from 'react'
import { format, subDays, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Flame, Zap, CheckCircle2, Trophy, TrendingUp, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { catColor, catLabel, catEmoji } from '@/lib/types'

const XP_PER_LEVEL = 200
const RANK_NAMES = ['Новичок', 'Стажёр', 'Специалист', 'Профи', 'Эксперт', 'Мастер', 'Гуру', 'Легенда', 'Элита']
const LEGACY_TRACKS = ['ai', 'design', 'selfdevelopment', 'mediabuy', 'english', 'polish', 'gym']

export default function StatsPage() {
  const { tasks, trackXP, streak, dailyXP, achievements, categories } = useStore()

  const totalXP = Object.values(trackXP).reduce((a, b) => a + b, 0)
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1
  const xpInLevel = totalXP % XP_PER_LEVEL
  const levelProgress = (xpInLevel / XP_PER_LEVEL) * 100
  const rankIndex = Math.min(Math.floor((level - 1) / 3), RANK_NAMES.length - 1)
  const rankName = RANK_NAMES[rankIndex]

  // All tracks with XP
  const allTrackIds = [...new Set([
    ...categories.map(c => c.id),
    ...LEGACY_TRACKS.filter(t => (trackXP[t] || 0) > 0),
  ])]
  const seenLabels = new Set<string>()
  const trackEntries = allTrackIds
    .map(t => [t, trackXP[t] || 0] as [string, number])
    .filter(([t]) => {
      const label = catLabel(t, categories)
      if (seenLabels.has(label)) return false
      seenLabels.add(label)
      return true
    })
    .filter(([, xp]) => xp > 0)
    .sort(([, a], [, b]) => b - a)
  const maxXP = Math.max(...trackEntries.map(([, xp]) => xp), 1)

  // Task stats
  const completedTasks = tasks.filter(t => t.completed && !t.skipped)
  const skippedTasks = tasks.filter(t => t.skipped)
  const totalTasks = tasks.filter(t => t.completed || t.skipped || (!t.completed && !t.skipped))

  // XP per track from completed tasks
  const tasksByTrack = useMemo(() => {
    const map: Record<string, number> = {}
    completedTasks.forEach(t => {
      map[t.track] = (map[t.track] || 0) + 1
    })
    return map
  }, [completedTasks])

  // Last 30 days daily XP chart
  const today = format(new Date(), 'yyyy-MM-dd')
  const last30 = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
      const dayData = dailyXP[date] || {}
      const xp = Object.values(dayData).reduce((a, b) => a + b, 0)
      return { date, xp }
    })
  }, [dailyXP])
  const maxDayXP = Math.max(...last30.map(d => d.xp), 1)

  // Best day
  const bestDay = last30.reduce((best, d) => d.xp > best.xp ? d : best, { date: '', xp: 0 })

  // Active days in last 30
  const activeDays = last30.filter(d => d.xp > 0).length

  return (
    <div className="flex-1 p-5 space-y-5 max-w-3xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">← Главная</Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm text-foreground font-medium">Статистика</span>
      </div>

      {/* Level card */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.12), rgba(167,139,250,0.06))', border: '1px solid rgba(129,140,248,0.2)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">{rankName}</p>
            <p className="text-2xl font-bold text-foreground">Уровень {level}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-0.5">Всего XP</p>
            <p className="text-2xl font-bold" style={{ color: '#818cf8' }}>{totalXP.toLocaleString()}</p>
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${levelProgress}%`, background: 'linear-gradient(90deg, #818cf8, #a78bfa)' }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">{xpInLevel} / {XP_PER_LEVEL} XP до уровня {level + 1}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Flame, label: 'Стрик', value: streak.current, sub: `рекорд ${streak.longest}`, color: '#f97316' },
          { icon: CheckCircle2, label: 'Выполнено', value: completedTasks.length, sub: `пропущено ${skippedTasks.length}`, color: '#34d399' },
          { icon: Calendar, label: 'Активных дней', value: activeDays, sub: 'за 30 дней', color: '#60a5fa' },
          { icon: Trophy, label: 'Достижений', value: achievements.length, sub: 'получено', color: '#fbbf24' },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Icon size={16} style={{ color }} className="mb-2" />
            <p className="text-xl font-bold text-foreground">{value}</p>
            <p className="text-xs font-medium text-foreground/70">{label}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Daily XP chart */}
      <div className="rounded-2xl p-5" style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} style={{ color: '#818cf8' }} />
            <h2 className="font-semibold text-foreground">XP за 30 дней</h2>
          </div>
          {bestDay.xp > 0 && (
            <p className="text-xs text-muted-foreground">
              Лучший день: <span className="text-foreground font-medium">+{bestDay.xp} XP</span>
            </p>
          )}
        </div>
        <div className="flex items-end gap-0.5 h-24">
          {last30.map(({ date, xp }) => (
            <div key={date} className="flex-1 flex items-end group relative" style={{ height: '100%' }}>
              <div
                className="w-full rounded-sm transition-all duration-300"
                style={{
                  height: xp > 0 ? `${Math.max((xp / maxDayXP) * 100, 8)}%` : '2px',
                  background: xp > 0
                    ? date === today
                      ? 'linear-gradient(180deg, #a78bfa, #818cf8)'
                      : 'rgba(129,140,248,0.5)'
                    : 'rgba(255,255,255,0.05)',
                }}
              />
              {xp > 0 && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 pointer-events-none">
                  <div className="rounded-lg px-2 py-1 text-xs whitespace-nowrap" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p className="text-foreground font-medium">+{xp} XP</p>
                    <p className="text-muted-foreground">{format(parseISO(date), 'd MMM', { locale: ru })}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-xs text-muted-foreground">{format(subDays(new Date(), 29), 'd MMM', { locale: ru })}</p>
          <p className="text-xs text-muted-foreground">Сегодня</p>
        </div>
      </div>

      {/* All tracks */}
      <div className="rounded-2xl p-5" style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} style={{ color: '#818cf8' }} />
          <h2 className="font-semibold text-foreground">Все треки</h2>
        </div>

        {trackEntries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Пока нет XP ни в одном треке</p>
            <Link href="/pool" className="text-xs text-primary hover:underline mt-2 block">Добавить активности →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {trackEntries.map(([track, xp], i) => {
              const color = catColor(track, categories)
              const emoji = catEmoji(track, categories)
              const label = catLabel(track, categories)
              const count = tasksByTrack[track] || 0
              const pct = Math.round((xp / maxXP) * 100)
              return (
                <div key={track}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-base w-6 text-center shrink-0">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{label}</span>
                          {i === 0 && <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold" style={{ background: `${color}20`, color }}>🏆 Лидер</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{count} задач</span>
                          <span className="text-sm font-bold tabular-nums" style={{ color }}>{xp} XP</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color,
                            boxShadow: `0 0 8px ${color}40`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
