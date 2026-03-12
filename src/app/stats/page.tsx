'use client'

import { useState } from 'react'
import { format, subDays, parseISO, startOfWeek, addDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useStore } from '@/lib/store'
import { TRACK_COLORS, TRACK_LABELS, type Track } from '@/lib/types'
import { Flame, Zap, Trophy, Target, Copy, Check as CheckIcon } from 'lucide-react'

const ALL_TRACKS: Track[] = ['ai', 'design', 'selfdevelopment', 'mediabuy', 'english', 'polish', 'gym']

const TRACK_EMOJI: Record<string, string> = {
  ai: '🤖', design: '🎨', selfdevelopment: '🧠',
  mediabuy: '📈', english: '🗣️', polish: '✍️', gym: '💪',
}

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function StatsPage() {
  const { tasks, streak, trackXP } = useStore()
  const [copied, setCopied] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')
  const totalXP = Object.values(trackXP).reduce((a, b) => a + b, 0)
  const level = Math.floor(totalXP / 200) + 1
  const xpToNext = 200 - (totalXP % 200)

  // GitHub-style heatmap: 5 weeks in a 7-column grid (Mon–Sun)
  const todayDate = new Date()
  const dayOfWeekMon = (todayDate.getDay() + 6) % 7
  const lastMon = subDays(todayDate, dayOfWeekMon)
  const gridStart = subDays(lastMon, 4 * 7)
  const gridDays = Array.from({ length: 35 }, (_, i) => {
    const d = format(addDays(gridStart, i), 'yyyy-MM-dd')
    const dayTasks = tasks.filter(t => t.date === d)
    const done = dayTasks.filter(t => t.completed).length
    const total = dayTasks.length
    const isFuture = d > today
    return { date: d, done, total, isFuture }
  })

  // This week tasks by track
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'))
  const weekTasks = tasks.filter(t => weekDates.includes(t.date))

  const weekByTrack = ALL_TRACKS.map(track => {
    const trackTasks = weekTasks.filter(t => t.track === track)
    const done = trackTasks.filter(t => t.completed).length
    const total = trackTasks.length
    const xp = trackTasks.filter(t => t.completed).reduce((s, t) => s + t.xp, 0)
    return { track, done, total, xp }
  }).filter(t => t.total > 0)

  const completedTotal = tasks.filter(t => t.completed).length
  const maxTrackXP = Math.max(...ALL_TRACKS.map(t => trackXP[t] || 0), 1)

  function copyWeekSummary() {
    // Only past days (before today) to avoid showing "didn't do" for future tasks
    const pastDates = weekDates.filter(d => d < today)
    const pastTasks = tasks.filter(t => pastDates.includes(t.date))
    const pastByTrack = ALL_TRACKS.map(track => {
      const tt = pastTasks.filter(t => t.track === track)
      const done = tt.filter(t => t.completed).length
      const total = tt.length
      const xp = tt.filter(t => t.completed).reduce((s, t) => s + t.xp, 0)
      return { track, done, total, xp }
    }).filter(t => t.total > 0)

    const weekDone = pastByTrack.reduce((s, t) => s + t.done, 0)
    const weekTotal = pastByTrack.reduce((s, t) => s + t.total, 0)
    const weekXP = pastByTrack.reduce((s, t) => s + t.xp, 0)
    const pastLabel = pastDates.length > 0
      ? `${format(new Date(pastDates[0] + 'T12:00:00'), 'd MMM', { locale: ru })} – ${format(new Date(pastDates[pastDates.length - 1] + 'T12:00:00'), 'd MMM yyyy', { locale: ru })}`
      : format(weekStart, 'd MMM yyyy', { locale: ru })

    const lines = [
      `📊 Итоги недели (${pastLabel})`,
      ``,
      `✅ Выполнено: ${weekDone} / ${weekTotal} задач`,
      `⚡ XP за неделю: ${weekXP}`,
      `🔥 Стрик: ${streak.current} дн (рекорд: ${streak.longest})`,
      ``,
      `По трекам:`,
      ...pastByTrack.map(t =>
        `${TRACK_EMOJI[t.track]} ${TRACK_LABELS[t.track as keyof typeof TRACK_LABELS]}: ${t.done}/${t.total} (+${t.xp} XP)`
      ),
      ``,
      `🏆 Всего XP: ${totalXP} | Уровень ${level}`,
    ]

    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getHeatColor = (done: number, total: number, isFuture: boolean) => {
    if (isFuture) return '#0d0b18'
    if (total === 0) return '#13121f'
    const ratio = done / total
    if (ratio === 0) return '#2a1520'
    if (ratio < 0.5) return '#a78bfa44'
    if (ratio < 1) return '#a78bfa99'
    return '#a78bfa'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#d8c9b0' }}>Свитки прогресса</h1>
        <button
          onClick={copyWeekSummary}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all"
          style={{ background: '#12121e', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset', color: copied ? '#34d399' : 'rgba(255,255,255,0.4)' }}
        >
          {copied ? <CheckIcon size={13} /> : <Copy size={13} />}
          {copied ? 'Скопировано!' : 'Итоги недели'}
        </button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          className="glow-orange relative overflow-hidden rounded-2xl p-4"
          style={{ background: 'linear-gradient(135deg, #1c0e08, #130b06)' }}
        >
          <div className="card-shine absolute inset-0 rounded-2xl" />
          <div className="relative">
            <Flame size={16} className="text-orange-400 mb-2" />
            <p className="text-2xl font-bold text-orange-300 leading-none">{streak.current}</p>
            <p className="mt-1 text-xs text-orange-400/60 font-medium">дней цепочки</p>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, #100f1e, #090810)',
            boxShadow: '0 8px 32px rgba(167,139,250,0.12), 0 0 0 1px rgba(167,139,250,0.08) inset',
          }}
        >
          <div className="card-shine absolute inset-0 rounded-2xl" />
          <div className="relative">
            <Trophy size={16} className="text-violet-400 mb-2" />
            <p className="text-2xl font-bold text-violet-300 leading-none">{streak.longest}</p>
            <p className="mt-1 text-xs text-violet-400/60 font-medium">рекорд</p>
          </div>
        </div>

        <div
          className="glow-purple relative overflow-hidden rounded-2xl p-4"
          style={{ background: 'linear-gradient(135deg, #0d0b18, #08060f)' }}
        >
          <div className="card-shine absolute inset-0 rounded-2xl" />
          <div className="relative">
            <Zap size={16} className="text-primary mb-2" />
            <p className="text-2xl font-bold text-primary leading-none">{totalXP}</p>
            <p className="mt-1 text-xs text-primary/60 font-medium">ур. {level} · {xpToNext} до след.</p>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, #0a1a10, #080f0a)',
            boxShadow: '0 8px 32px rgba(52,211,153,0.1), 0 0 0 1px rgba(52,211,153,0.07) inset',
          }}
        >
          <div className="card-shine absolute inset-0 rounded-2xl" />
          <div className="relative">
            <Target size={16} className="text-emerald-400 mb-2" />
            <p className="text-2xl font-bold text-emerald-300 leading-none">{completedTotal}</p>
            <p className="mt-1 text-xs text-emerald-400/60 font-medium">выполнено</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* XP по трекам */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#0d0b18', boxShadow: '0 0 0 1px rgba(167,139,250,0.08) inset' }}
        >
          <h2 className="mb-4 font-semibold" style={{ color: '#d8c9b0' }}>Навыки</h2>
          <div className="space-y-4">
            {ALL_TRACKS
              .map(t => [t, trackXP[t] || 0] as [Track, number])
              .sort(([, a], [, b]) => b - a)
              .map(([track, xp]) => (
                <div key={track} style={{ opacity: xp === 0 ? 0.25 : 1, transition: 'opacity 0.3s' }}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{TRACK_EMOJI[track]}</span>
                      <span className="text-sm" style={{ color: '#d8c9b0' }}>{TRACK_LABELS[track]}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: xp > 0 ? TRACK_COLORS[track] : 'rgba(216,201,176,0.2)' }}>
                      {xp > 0 ? `${xp} XP` : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full" style={{ background: 'rgba(167,139,250,0.07)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(xp / maxTrackXP) * 100}%`,
                        backgroundColor: TRACK_COLORS[track],
                        boxShadow: xp > 0 ? `0 0 8px ${TRACK_COLORS[track]}60` : undefined,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Эта неделя */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#0d0b18', boxShadow: '0 0 0 1px rgba(167,139,250,0.08) inset' }}
        >
          <h2 className="mb-4 font-semibold" style={{ color: '#d8c9b0' }}>Эта неделя</h2>
          {weekByTrack.length === 0 ? (
            <p className="text-sm" style={{ color: '#5a4e6e' }}>Нет задач на этой неделе</p>
          ) : (
            <div className="space-y-4">
              {weekByTrack.map(({ track, done, total, xp }) => (
                <div key={track}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-sm shrink-0">{TRACK_EMOJI[track]}</span>
                    <span className="flex-1 text-sm" style={{ color: '#d8c9b0' }}>{TRACK_LABELS[track]}</span>
                    <span className="text-xs tabular-nums" style={{ color: '#5a4e6e' }}>{done}/{total}</span>
                    {xp > 0 && (
                      <span className="text-xs font-bold text-yellow-400">+{xp}</span>
                    )}
                  </div>
                  <div className="h-1.5 w-full rounded-full" style={{ background: 'rgba(167,139,250,0.07)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: total > 0 ? `${(done / total) * 100}%` : '0%',
                        backgroundColor: TRACK_COLORS[track],
                        boxShadow: done > 0 ? `0 0 6px ${TRACK_COLORS[track]}50` : undefined,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* GitHub-style heatmap */}
      <div
        className="rounded-2xl p-5"
        style={{ background: '#0d0b18', boxShadow: '0 0 0 1px rgba(167,139,250,0.08) inset' }}
      >
        <h2 className="mb-4 font-semibold" style={{ color: '#d8c9b0' }}>Активность за 5 недель</h2>

        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-[9px] font-medium" style={{ color: 'rgba(167,139,250,0.3)' }}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {gridDays.map(({ date, done, total, isFuture }) => (
            <div
              key={date}
              title={`${format(parseISO(date), 'd MMM', { locale: ru })}: ${isFuture ? '—' : `${done}/${total}`}`}
              className="aspect-square rounded-md transition-transform hover:scale-110 cursor-default"
              style={{ backgroundColor: getHeatColor(done, total, isFuture) }}
            />
          ))}
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: '#5a4e6e' }}>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: '#13121f' }} />
            <span>Нет задач</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: '#a78bfa44' }} />
            <span>Частично</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: '#a78bfa' }} />
            <span>Всё выполнено</span>
          </div>
        </div>
      </div>
    </div>
  )
}
