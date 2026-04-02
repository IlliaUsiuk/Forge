'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Flame, Zap, CheckCircle2, Circle, ChevronRight, SkipForward, CalendarDays, Layers, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { catColor, catLabel, catEmoji } from '@/lib/types'
import { ALL_ACHIEVEMENTS, TIER_COLORS } from '@/lib/achievements'

const TIER_CONFIG = {
  easy:   { label: 'Лёгкие',  color: TIER_COLORS.easy.color,   bg: 'rgba(52,211,153,0.08)',   border: 'rgba(52,211,153,0.2)' },
  medium: { label: 'Средние', color: TIER_COLORS.medium.color, bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.2)' },
  hard:   { label: 'Тяжёлые', color: TIER_COLORS.hard.color,   bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
}

const LEGACY_TRACKS = ['ai', 'design', 'selfdevelopment', 'mediabuy', 'english', 'polish', 'gym']

function AchievementIcon({ ach, done, cfg }: { ach: { id: string; emoji: string; label: string; desc: string }; done: boolean; cfg: { color: string; bg: string; border: string } }) {
  return (
    <div className="relative group">
      <div
        className="flex flex-col items-center gap-1 rounded-xl p-2.5 w-14 cursor-default transition-all"
        style={{
          background: done ? cfg.bg : 'rgba(255,255,255,0.03)',
          border: `1px solid ${done ? cfg.border : 'rgba(255,255,255,0.05)'}`,
          opacity: done ? 1 : 0.3,
        }}
      >
        <span className="text-xl leading-none" style={{ filter: done ? 'none' : 'grayscale(1)' }}>{ach.emoji}</span>
        <span className="text-[9px] font-medium text-center leading-tight" style={{ color: done ? cfg.color : 'rgba(255,255,255,0.2)' }}>
          {ach.label}
        </span>
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover:block pointer-events-none">
        <div className="rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
          {ach.desc}{done && <span className="ml-1.5" style={{ color: cfg.color }}>✓</span>}
        </div>
      </div>
    </div>
  )
}

function AchievementsBlock({ achievements }: { achievements: string[] }) {
  const [showAll, setShowAll] = useState(false)
  const tiers = ['easy', 'medium', 'hard'] as const
  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-foreground">Достижения</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{achievements.length} / {ALL_ACHIEVEMENTS.length}</p>
        </div>
        <button
          onClick={() => setShowAll(v => !v)}
          className="text-xs font-semibold rounded-lg px-2.5 py-1 transition-all shrink-0"
          style={{
            background: showAll ? 'rgba(129,140,248,0.08)' : 'rgba(129,140,248,0.12)',
            color: '#818cf8',
            border: '1px solid rgba(129,140,248,0.25)',
          }}
        >
          {showAll ? 'Скрыть' : 'Показать все'}
        </button>
      </div>
      {tiers.map(tier => {
        const cfg = TIER_CONFIG[tier]
        const tierAchievements = ALL_ACHIEVEMENTS.filter(a => a.tier === tier)
        const earned = tierAchievements.filter(a => achievements.includes(a.id))
        const unearned = tierAchievements.filter(a => !achievements.includes(a.id))
        if (earned.length === 0 && !showAll) return null
        return (
          <div key={tier}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
              <span className="text-xs text-muted-foreground">{earned.length}/{tierAchievements.length}</span>
              <div className="flex-1 h-px" style={{ background: cfg.border }} />
            </div>
            <div className="flex flex-wrap gap-2">
              {earned.map(ach => <AchievementIcon key={ach.id} ach={ach} done cfg={cfg} />)}
              {showAll && unearned.map(ach => <AchievementIcon key={ach.id} ach={ach} done={false} cfg={cfg} />)}
            </div>
          </div>
        )
      })}
      {achievements.length === 0 && !showAll && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Выполни задачи чтобы получить первые достижения
        </p>
      )}
    </div>
  )
}

const XP_PER_LEVEL = 200
const RANK_NAMES = ['Новичок', 'Стажёр', 'Специалист', 'Профи', 'Эксперт', 'Мастер', 'Гуру', 'Легенда', 'Элита']

export default function Dashboard() {
  const { tasks, dayJobs, streak, trackXP, onboardingDone, processOnOpen, completeTask, skipTask, userName, categories, achievements } = useStore()

  useEffect(() => { processOnOpen() }, [processOnOpen])

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayJob = dayJobs.find(j => j.date === today)
  const todayTasks = tasks.filter(t => t.date === today && !(todayJob && t.track === 'gym'))
  const doneTodayCount = todayTasks.filter(t => t.completed).length
  const totalXP = Object.values(trackXP).reduce((a, b) => a + b, 0)
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1
  const xpInLevel = totalXP % XP_PER_LEVEL
  const levelProgress = (xpInLevel / XP_PER_LEVEL) * 100
  const rankIndex = Math.min(Math.floor((level - 1) / 3), RANK_NAMES.length - 1)
  const rankName = RANK_NAMES[rankIndex]

  // Merge user categories + legacy tracks (for users with old data), deduplicate by label
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

  const [greeting, setGreeting] = useState('')
  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting('Доброе утро')
    else if (h < 18) setGreeting('Добрый день')
    else setGreeting('Добрый вечер')
  }, [])

  const hasData = tasks.length > 0 || dayJobs.length > 0 || categories.length > 0
  if (!onboardingDone && !hasData) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 p-8 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl text-4xl"
          style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(167,139,250,0.1))' }}
        >
          <span style={{ display: 'inline-block', animation: 'wave 2s ease-in-out infinite', transformOrigin: '70% 70%' }}>👋</span>
        </div>
        <style>{`@keyframes wave{0%,100%{transform:rotate(0deg)}20%{transform:rotate(-15deg)}40%{transform:rotate(15deg)}60%{transform:rotate(-10deg)}80%{transform:rotate(10deg)}}`}</style>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Привет, {userName}!</h1>
          <p className="mt-3 max-w-sm text-muted-foreground leading-relaxed">
            Два шага — и твоё расписание готово.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Link
            href="/pool"
            className="flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)' }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
              style={{ background: 'rgba(129,140,248,0.15)' }}>
              <Layers size={18} style={{ color: '#818cf8' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">1. Добавь свои активности</p>
              <p className="text-xs text-muted-foreground mt-0.5">Зал, учёба, языки — с иконкой, сложностью и временем</p>
            </div>
            <ChevronRight size={16} className="ml-auto shrink-0 text-muted-foreground" />
          </Link>

          <Link
            href="/chat"
            className="flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)' }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
              style={{ background: 'rgba(129,140,248,0.15)' }}>
              <MessageSquare size={18} style={{ color: '#818cf8' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">2. Настрой расписание</p>
              <p className="text-xs text-muted-foreground mt-0.5">Скажи помощнику когда работаешь — он всё разложит</p>
            </div>
            <ChevronRight size={16} className="ml-auto shrink-0 text-muted-foreground" />
          </Link>

          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-xs text-muted-foreground">или</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <Link
            href="/schedule"
            className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <CalendarDays size={15} />
            Добавить задачи в ручную
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">

      {/* Header */}
      <div className="space-y-0.5 mb-2">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {format(new Date(), 'EEEE, d MMMM yyyy', { locale: ru })}
        </p>
        <h1 className="text-3xl font-bold text-foreground">
          {greeting}, {userName} <span className="gradient-text">✦</span>
        </h1>
      </div>

      {/* Stats — 3 cards (responsive) */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 md:gap-3">

        <div
          className="glow-orange relative overflow-hidden rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, #1c0e08, #130b06)' }}
        >
          <div className="card-shine absolute inset-0 rounded-2xl" />
          <div className="relative flex flex-col gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: 'rgba(251,146,60,0.15)' }}>
              <Flame size={16} className="text-orange-400" />
            </div>
            <p className="text-4xl font-black text-orange-300 leading-none">{streak.current}</p>
            <p className="text-xs text-orange-400/55 font-medium leading-tight">дней<br />стрик</p>
          </div>
        </div>

        <div
          className="glow-purple relative overflow-hidden rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, #0d0d1c, #08080f)' }}
        >
          <div className="card-shine absolute inset-0 rounded-2xl" />
          <div className="relative flex flex-col gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: 'rgba(129,140,248,0.15)' }}>
              <Zap size={16} className="text-primary" />
            </div>
            <p className="text-4xl font-black text-primary leading-none">{totalXP}</p>
            <p className="text-xs text-primary/55 font-medium leading-tight">очков<br />опыта</p>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, #0b1a12, #060e0a)',
            boxShadow: '0 8px 32px rgba(52,211,153,0.10), 0 0 0 1px rgba(52,211,153,0.08) inset',
          }}
        >
          <div className="card-shine absolute inset-0 rounded-2xl" />
          <div className="relative flex flex-col gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: 'rgba(52,211,153,0.15)' }}>
              <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <p className="text-4xl font-black text-emerald-300 leading-none">{doneTodayCount}<span className="text-lg text-emerald-400/40 font-bold">/{todayTasks.length}</span></p>
            <p className="text-xs text-emerald-400/55 font-medium leading-tight">задач<br />сегодня</p>
          </div>
        </div>

      </div>

      {/* Level progress bar */}
      <div
        className="rounded-2xl px-5 py-4"
        style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black text-white"
              style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
            >
              {level}
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">{rankName}</span>
              <span className="ml-1.5 text-xs text-muted-foreground">· ур. {level}</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">{xpInLevel} / {XP_PER_LEVEL} XP</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${levelProgress}%`,
              background: 'linear-gradient(90deg, #818cf8, #a78bfa)',
              boxShadow: '0 0 10px rgba(129,140,248,0.5)',
            }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-right" style={{ color: 'rgba(255,255,255,0.2)' }}>
          ещё {XP_PER_LEVEL - xpInLevel} XP до уровня {level + 1}
        </p>
      </div>

      {/* Main grid */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">

        {/* Today tasks */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Сегодня</h2>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-medium text-muted-foreground tabular-nums">
                {doneTodayCount}/{todayTasks.length}
              </span>
              {todayTasks.length > 0 && (
                <div className="h-1.5 w-14 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${todayTasks.length > 0 ? (doneTodayCount / todayTasks.length) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #818cf8, #a78bfa)',
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {todayTasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Задач нет — заслуженный отдых 🎉
            </p>
          ) : (
            <div className="space-y-1">
              {todayTasks.map(task => (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150"
                  style={{
                    background: task.completed ? `${catColor(task.track, categories)}0d` : 'transparent',
                    borderLeft: `2px solid ${task.completed
                      ? catColor(task.track, categories)
                      : task.skipped
                      ? 'rgba(255,255,255,0.06)'
                      : catColor(task.track, categories) + '35'}`,
                  }}
                >
                  <button
                    onClick={() => !task.completed && !task.skipped && completeTask(task.id)}
                    className="shrink-0 transition-transform active:scale-90"
                    style={{ cursor: task.skipped ? 'default' : 'pointer' }}
                  >
                    {task.completed
                      ? <CheckCircle2 size={17} style={{ color: catColor(task.track, categories) }} />
                      : <Circle size={17} className="text-muted-foreground" />
                    }
                  </button>

                  <span className="text-base shrink-0" style={{ opacity: task.skipped ? 0.3 : 1 }}>
                    {catEmoji(task.track, categories)}
                  </span>

                  <span className={`flex-1 text-base leading-snug ${
                    task.completed || task.skipped
                      ? 'line-through text-muted-foreground'
                      : 'text-foreground'
                  }`} style={{ opacity: task.skipped ? 0.4 : 1 }}>
                    {task.title}
                  </span>

                  {task.completed && (
                    <span className="text-sm font-bold text-yellow-400 shrink-0">+{task.xp}</span>
                  )}
                  {!task.completed && !task.skipped && (
                    <button
                      onClick={() => skipTask(task.id)}
                      className="hidden shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground group-hover:flex"
                      title="Пропустить"
                    >
                      <SkipForward size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Track progress — compact single-line per track */}
        <div
          className="rounded-2xl p-5 self-start"
          style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Прогресс</h2>
            <Link
              href="/stats"
              className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Все треки
              <ChevronRight size={12} />
            </Link>
          </div>

          {trackEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <span className="text-2xl">📊</span>
              <p className="text-sm text-muted-foreground">Пока нет активностей с XP</p>
              <Link href="/pool" className="text-xs text-primary hover:underline">Добавить активности →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {trackEntries.map(([track, xp]) => (
                <div key={track} className="flex items-center gap-2.5">
                  <span className="w-5 text-center text-sm shrink-0">{catEmoji(track, categories)}</span>
                  <span className="w-24 shrink-0 truncate text-sm text-foreground/80">
                    {catLabel(track, categories)}
                  </span>
                  <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(xp / maxXP) * 100}%`,
                        backgroundColor: catColor(track, categories),
                        boxShadow: `0 0 6px ${catColor(track, categories)}50`,
                      }}
                    />
                  </div>
                  <span
                    className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums"
                    style={{ color: catColor(track, categories) }}
                  >
                    {xp}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Achievements */}
      <AchievementsBlock achievements={achievements} />

    </div>
  )
}
