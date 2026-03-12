'use client'

import { useEffect } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Flame, Zap, Trophy, CheckCircle2, Circle, MessageSquare, ChevronRight, SkipForward } from 'lucide-react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { TRACK_COLORS, TRACK_LABELS } from '@/lib/types'

const TRACK_EMOJI: Record<string, string> = {
  ai: '🤖', design: '🎨', selfdevelopment: '🧠',
  mediabuy: '📈', english: '🗣️', polish: '✍️', gym: '💪',
}

const ALL_TRACKS_ORDERED = ['ai', 'design', 'selfdevelopment', 'mediabuy', 'english', 'polish', 'gym'] as Array<keyof typeof TRACK_COLORS>

const XP_PER_LEVEL = 200
const RANK_NAMES = ['Странник', 'Ученик', 'Воин', 'Рыцарь', 'Страж', 'Чемпион', 'Паладин', 'Легенда', 'Архонт']

export default function Dashboard() {
  const { tasks, dayJobs, streak, trackXP, onboardingDone, processOnOpen, completeTask, skipTask } = useStore()

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

  const trackEntries = ALL_TRACKS_ORDERED
    .map(t => [t, trackXP[t] || 0] as [keyof typeof TRACK_COLORS, number])
    .sort(([, a], [, b]) => b - a)
  const maxXP = Math.max(...trackEntries.map(([, xp]) => xp), 1)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Доброе утро'
    if (h < 18) return 'Добрый день'
    return 'Добрый вечер'
  }

  if (!onboardingDone) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl text-4xl"
          style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(167,139,250,0.1))' }}
        >
          👋
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Привет, Илья!</h1>
          <p className="mt-3 max-w-sm text-muted-foreground leading-relaxed">
            Напиши в чате свои рабочие дни этого месяца — я настрою расписание и задачи автоматически.
          </p>
        </div>
        <Link
          href="/chat"
          className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
        >
          <MessageSquare size={16} />
          Открыть чат с AI
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">

      {/* Header */}
      <div className="space-y-0.5 mb-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {format(new Date(), 'EEEE, d MMMM yyyy', { locale: ru })}
        </p>
        <h1 className="text-3xl font-bold text-foreground">
          {greeting()}, Илья <span className="gradient-text">✦</span>
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
            background: 'linear-gradient(135deg, #100f1e, #090810)',
            boxShadow: '0 8px 32px rgba(167,139,250,0.12), 0 0 0 1px rgba(167,139,250,0.08) inset',
          }}
        >
          <div className="card-shine absolute inset-0 rounded-2xl" />
          <div className="relative flex flex-col gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: 'rgba(167,139,250,0.15)' }}>
              <Trophy size={16} className="text-violet-400" />
            </div>
            <p className="text-4xl font-black text-violet-300 leading-none">{streak.longest}</p>
            <p className="text-xs text-violet-400/55 font-medium leading-tight">лучший<br />стрик</p>
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
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
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
                    background: task.completed ? `${TRACK_COLORS[task.track]}0d` : 'transparent',
                    borderLeft: `2px solid ${task.completed
                      ? TRACK_COLORS[task.track]
                      : task.skipped
                      ? 'rgba(255,255,255,0.06)'
                      : TRACK_COLORS[task.track] + '35'}`,
                  }}
                >
                  <button
                    onClick={() => !task.completed && !task.skipped && completeTask(task.id)}
                    className="shrink-0 transition-transform active:scale-90"
                    style={{ cursor: task.skipped ? 'default' : 'pointer' }}
                  >
                    {task.completed
                      ? <CheckCircle2 size={17} style={{ color: TRACK_COLORS[task.track] }} />
                      : <Circle size={17} className="text-muted-foreground" />
                    }
                  </button>

                  <span className="text-base shrink-0" style={{ opacity: task.skipped ? 0.3 : 1 }}>
                    {TRACK_EMOJI[task.track]}
                  </span>

                  <span className={`flex-1 text-sm leading-snug ${
                    task.completed || task.skipped
                      ? 'line-through text-muted-foreground'
                      : 'text-foreground'
                  }`} style={{ opacity: task.skipped ? 0.4 : 1 }}>
                    {task.title}
                  </span>

                  {task.completed && (
                    <span className="text-xs font-bold text-yellow-400 shrink-0">+{task.xp}</span>
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
          className="rounded-2xl p-5"
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

          <div className="space-y-3">
            {trackEntries.map(([track, xp]) => (
              <div
                key={track}
                className="flex items-center gap-2.5"
                style={{ opacity: xp === 0 ? 0.25 : 1, transition: 'opacity 0.3s' }}
              >
                <span className="w-5 text-center text-sm shrink-0">{TRACK_EMOJI[track]}</span>
                <span className="w-20 shrink-0 truncate text-xs text-foreground/80">
                  {TRACK_LABELS[track]}
                </span>
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(xp / maxXP) * 100}%`,
                      backgroundColor: TRACK_COLORS[track],
                      boxShadow: xp > 0 ? `0 0 6px ${TRACK_COLORS[track]}50` : undefined,
                    }}
                  />
                </div>
                <span
                  className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums"
                  style={{ color: xp > 0 ? TRACK_COLORS[track] : 'rgba(255,255,255,0.15)' }}
                >
                  {xp > 0 ? xp : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Quick chat */}
      <Link
        href="/chat"
        className="flex items-center gap-3 rounded-2xl p-4 text-sm transition-all duration-150 hover:opacity-90"
        style={{
          background: 'linear-gradient(135deg, rgba(129,140,248,0.08), rgba(167,139,250,0.04))',
          boxShadow: '0 0 0 1px rgba(129,140,248,0.12) inset',
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
        >
          <MessageSquare size={15} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">Обратиться к Психологу</p>
          <p className="text-xs text-muted-foreground">Задачи, расписание, мотивация — всё через чат</p>
        </div>
        <ChevronRight size={16} className="ml-auto shrink-0 text-muted-foreground" />
      </Link>

    </div>
  )
}
