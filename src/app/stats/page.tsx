'use client'

import { format, subDays, parseISO, startOfWeek, addDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Download } from 'lucide-react'
import { useStore } from '@/lib/store'
import { TRACK_COLORS, TRACK_LABELS, type Track } from '@/lib/types'
import { exportToCSV, exportToICS, exportToJSON } from '@/lib/export'
import { Flame, Zap, Trophy, Target } from 'lucide-react'

const ALL_TRACKS: Track[] = ['ai', 'design', 'selfdevelopment', 'mediabuy', 'english', 'polish', 'gym']

const TRACK_EMOJI: Record<string, string> = {
  ai: '🤖', design: '🎨', selfdevelopment: '🧠',
  mediabuy: '📈', english: '🇬🇧', polish: '🇵🇱', gym: '💪',
}

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const ACHIEVEMENT_DATA: Record<string, { label: string; icon: string; description: string }> = {
  'streak-7': { label: 'Неделя огня', icon: '🔥', description: '7 дней подряд' },
  'streak-30': { label: 'Месячный марафон', icon: '🏃', description: '30 дней подряд' },
  'streak-100': { label: 'Столетник', icon: '💯', description: '100 дней подряд' },
  'streak-365': { label: 'Чемпион года', icon: '👑', description: '365 дней подряд' },
  'total-500': { label: 'Хороший старт', icon: '🚀', description: '500 XP всего' },
  'total-5000': { label: 'Мастер', icon: '🎓', description: '5000 XP всего' },
  'ai-100': { label: 'Ученик AI', icon: '🤖', description: '100 XP в AI' },
  'ai-1000': { label: 'Профессор AI', icon: '🧠', description: '1000 XP в AI' },
}

export default function StatsPage() {
  const { tasks, streak, trackXP, achievements, dailyXP } = useStore()

  const today = format(new Date(), 'yyyy-MM-dd')
  const totalXP = Object.values(trackXP).reduce((a, b) => a + b, 0)
  const level = Math.floor(totalXP / 100) + 1
  const xpToNext = 100 - (totalXP % 100)

  // GitHub-style heatmap: 5 weeks in a 7-column grid (Mon–Sun)
  const todayDate = new Date()
  const dayOfWeekMon = (todayDate.getDay() + 6) % 7  // 0=Mon … 6=Sun
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

  const getHeatColor = (done: number, total: number, isFuture: boolean) => {
    if (isFuture) return '#0f0f1a'
    if (total === 0) return '#13131f'
    const ratio = done / total
    if (ratio === 0) return '#2a1a1a'
    if (ratio < 0.5) return '#818cf855'
    if (ratio < 1) return '#818cf8aa'
    return '#818cf8'
  }

  // Last 7 days XP graph
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    const dateStr = format(d, 'yyyy-MM-dd')
    const dayXP = Object.values(dailyXP[dateStr] || {}).reduce((a, b) => a + b, 0)
    return { date: dateStr, xp: dayXP, day: format(d, 'EEE', { locale: ru }).slice(0, 2) }
  })
  const maxDayXP = Math.max(...last7Days.map(d => d.xp), 50)

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Статистика</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => exportToCSV(tasks, `tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-foreground transition-colors"
            title="Скачать в CSV"
          >
            <Download size={14} />
            CSV
          </button>
          <button
            onClick={() => exportToICS(tasks, `schedule-${format(new Date(), 'yyyy-MM-dd')}.ics`)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-foreground transition-colors"
            title="Скачать в ICS (календарь)"
          >
            <Download size={14} />
            ICS
          </button>
          <button
            onClick={() => exportToJSON(
              { tasks, streak, trackXP, dailyXP, achievements, workDays, dayJobs },
              `backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`
            )}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-foreground transition-colors"
            title="Скачать полную копию"
          >
            <Download size={14} />
            Бэкап
          </button>
        </div>
      </div>

      {/* Top stats — styled like dashboard */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          className="glow-orange relative overflow-hidden rounded-2xl p-4"
          style={{ background: 'linear-gradient(135deg, #1a100a, #120d08)' }}
        >
          <div className="card-shine absolute inset-0 rounded-2xl" />
          <div className="relative">
            <Flame size={16} className="text-orange-400 mb-2" />
            <p className="text-2xl font-bold text-orange-300 leading-none">{streak.current}</p>
            <p className="mt-1 text-xs text-orange-400/60 font-medium">Текущий стрик</p>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, #0f0e1a, #0a0910)',
            boxShadow: '0 8px 32px rgba(167,139,250,0.12), 0 0 0 1px rgba(167,139,250,0.08) inset',
          }}
        >
          <div className="card-shine absolute inset-0 rounded-2xl" />
          <div className="relative">
            <Trophy size={16} className="text-violet-400 mb-2" />
            <p className="text-2xl font-bold text-violet-300 leading-none">{streak.longest}</p>
            <p className="mt-1 text-xs text-violet-400/60 font-medium">Рекорд</p>
          </div>
        </div>

        <div
          className="glow-purple relative overflow-hidden rounded-2xl p-4"
          style={{ background: 'linear-gradient(135deg, #0e0e1a, #0a0a14)' }}
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
            <p className="mt-1 text-xs text-emerald-400/60 font-medium">Задач выполнено</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* XP по трекам — all 7 tracks always */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
        >
          <h2 className="mb-4 font-semibold text-foreground">XP по трекам</h2>
          <div className="space-y-4">
            {ALL_TRACKS
              .map(t => [t, trackXP[t] || 0] as [Track, number])
              .sort(([, a], [, b]) => b - a)
              .map(([track, xp]) => (
                <div key={track} style={{ opacity: xp === 0 ? 0.28 : 1, transition: 'opacity 0.3s' }}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{TRACK_EMOJI[track]}</span>
                      <span className="text-sm text-foreground">{TRACK_LABELS[track]}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: xp > 0 ? TRACK_COLORS[track] : 'rgba(255,255,255,0.2)' }}>
                      {xp > 0 ? `${xp} XP` : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
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

        {/* Эта неделя — с прогресс-барами */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
        >
          <h2 className="mb-4 font-semibold text-foreground">Эта неделя</h2>
          {weekByTrack.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет задач на этой неделе</p>
          ) : (
            <div className="space-y-4">
              {weekByTrack.map(({ track, done, total, xp }) => (
                <div key={track}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-sm shrink-0">{TRACK_EMOJI[track]}</span>
                    <span className="flex-1 text-sm text-foreground">{TRACK_LABELS[track]}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{done}/{total}</span>
                    {xp > 0 && (
                      <span className="text-xs font-bold text-yellow-400">+{xp}</span>
                    )}
                  </div>
                  <div className="h-1.5 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
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

      {/* 7-day XP graph */}
      <div
        className="rounded-2xl p-5"
        style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
      >
        <h2 className="mb-4 font-semibold text-foreground">XP за 7 дней</h2>
        <div className="flex items-end gap-1.5 h-40 justify-between">
          {last7Days.map(({ day, xp }) => (
            <div
              key={day}
              className="flex-1 flex flex-col items-center gap-2"
              title={`${day}: ${xp} XP`}
            >
              <div
                className="w-full rounded-md transition-all duration-300 hover:brightness-125"
                style={{
                  height: maxDayXP > 0 ? `${(xp / maxDayXP) * 100}%` : '4px',
                  background: xp > 0 ? 'linear-gradient(180deg, #818cf8, #6366f1)' : 'rgba(255,255,255,0.05)',
                  minHeight: '4px',
                  boxShadow: xp > 0 ? '0 0 8px rgba(129,140,248,0.5)' : 'none',
                }}
              />
              <span className="text-[10px] text-muted-foreground font-medium">{day}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground text-center">
          Сегодня: {last7Days[6]?.xp || 0} XP
        </div>
      </div>

      {/* Achievements */}
      <div
        className="rounded-2xl p-5"
        style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
      >
        <h2 className="mb-4 font-semibold text-foreground">Достижения ({achievements.length})</h2>
        {achievements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Начни учиться, и первое достижение появится скоро! 🚀</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {achievements.map(id => {
              const info = ACHIEVEMENT_DATA[id]
              return (
                <div
                  key={id}
                  className="rounded-lg p-3 text-center transition-transform hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="text-3xl mb-1">{info?.icon || '🏆'}</div>
                  <p className="text-xs font-semibold text-foreground leading-tight">{info?.label || id}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{info?.description || ''}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* GitHub-style heatmap */}
      <div
        className="rounded-2xl p-5"
        style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
      >
        <h2 className="mb-4 font-semibold text-foreground">Активность за 5 недель</h2>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-[9px] font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
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

        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: '#13131f' }} />
            <span>Нет задач</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: '#818cf855' }} />
            <span>Частично</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: '#818cf8' }} />
            <span>Всё выполнено</span>
          </div>
        </div>
      </div>
    </div>
  )
}
