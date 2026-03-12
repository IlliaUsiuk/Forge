'use client'

import { format, subDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ArrowLeft, Check, SkipForward, Trash2, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { TRACK_COLORS, TRACK_LABELS } from '@/lib/types'

const TRACK_EMOJI: Record<string, string> = {
  ai: '🤖', design: '🎨', selfdevelopment: '🧠',
  mediabuy: '📈', english: '🗣️', polish: '✍️', gym: '💪',
}

const TRACK_ORDER: Record<string, number> = {
  english: 1, polish: 2, selfdevelopment: 3,
  ai: 4, design: 5, mediabuy: 6, gym: 7,
}

export default function HistoryPage() {
  const { tasks, dayJobs, deleteTask, completeTask, uncompleteTask, skipTask } = useStore()

  // Last 60 days excluding today, only days that have tasks or jobs
  const days = Array.from({ length: 60 }, (_, i) => {
    const d = subDays(new Date(), i + 1)
    return format(d, 'yyyy-MM-dd')
  }).filter(date => {
    const hasTasks = tasks.some(t => t.date === date)
    const job = dayJobs.find(j => j.date === date)
    return hasTasks || job
  })

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/schedule"
          className="flex items-center justify-center h-9 w-9 rounded-xl transition-all shrink-0"
          style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset', color: 'rgba(255,255,255,0.5)' }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">История</h1>
          <p className="text-sm text-white/40 mt-0.5">Прошедшие дни — можно отмечать задачи задним числом</p>
        </div>
      </div>

      {days.length === 0 ? (
        <div
          className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
          style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
        >
          <p className="text-3xl">📅</p>
          <p className="text-sm text-white/40">История пустая — выполняй задачи и они появятся здесь</p>
        </div>
      ) : (
        <div className="space-y-3">
          {days.map(date => {
            const job = dayJobs.find(j => j.date === date)
            const dayTasks = tasks
              .filter(t => t.date === date)
              .sort((a, b) => (TRACK_ORDER[a.track] ?? 9) - (TRACK_ORDER[b.track] ?? 9))
            const completed = dayTasks.filter(t => t.completed).length
            const skipped = dayTasks.filter(t => t.skipped).length
            const total = dayTasks.length
            const allDone = total > 0 && completed === total
            const pending = total - completed - skipped

            return (
              <div
                key={date}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: '#0f0f1a',
                  boxShadow: allDone
                    ? '0 0 0 1px rgba(129,140,248,0.2) inset'
                    : '0 0 0 1px rgba(255,255,255,0.06) inset',
                }}
              >
                {/* Day header */}
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-white/25">
                      {format(new Date(date + 'T12:00:00'), 'EEEE', { locale: ru })}
                    </span>
                    <p className="text-sm font-bold text-white/70 mt-0.5">
                      {format(new Date(date + 'T12:00:00'), 'd MMMM yyyy', { locale: ru })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {job && (
                      <span className="text-[10px] font-semibold text-white/25 rounded-lg px-2 py-1"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        🖥 {job.start}–{job.end}
                      </span>
                    )}
                    {total > 0 && (
                      <span
                        className="text-xs font-bold rounded-lg px-2.5 py-1"
                        style={{
                          background: allDone ? 'rgba(129,140,248,0.15)' : pending > 0 ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.05)',
                          color: allDone ? '#818cf8' : pending > 0 ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                        }}
                      >
                        {allDone ? '✓ Всё' : `${completed}/${total}`}
                        {pending > 0 ? ` · ${pending} не отмечено` : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tasks */}
                {dayTasks.length > 0 && (
                  <div className="p-3 flex flex-col gap-1.5">
                    {dayTasks.map(task => {
                      const color = TRACK_COLORS[task.track as keyof typeof TRACK_COLORS]
                      const isPending = !task.completed && !task.skipped
                      return (
                        <div
                          key={task.id}
                          className="group flex items-center gap-3 rounded-xl px-3 py-2.5"
                          style={{
                            background: task.completed
                              ? `linear-gradient(135deg, ${color}18, ${color}08)`
                              : task.skipped ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.03)',
                            boxShadow: task.completed
                              ? `0 0 0 1px ${color}25 inset`
                              : isPending
                                ? '0 0 0 1px rgba(251,191,36,0.15) inset'
                                : '0 0 0 1px rgba(255,255,255,0.05) inset',
                            opacity: task.skipped ? 0.45 : 1,
                          }}
                        >
                          <span className="text-base shrink-0">{TRACK_EMOJI[task.track]}</span>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                              style={{ color: task.completed ? color : 'rgba(255,255,255,0.25)' }}
                            >
                              {TRACK_LABELS[task.track as keyof typeof TRACK_LABELS]}
                            </p>
                            <p
                              className="text-sm font-semibold leading-snug truncate"
                              style={{
                                color: task.skipped ? 'rgba(255,255,255,0.25)' : isPending ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)',
                                textDecoration: task.completed || task.skipped ? 'line-through' : 'none',
                              }}
                            >
                              {task.title}
                            </p>
                          </div>
                          <div className="shrink-0 flex items-center gap-1.5">
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="flex h-5 w-5 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                            >
                              <Trash2 size={10} />
                            </button>
                            <span className="text-xs font-bold" style={{ color: task.completed ? '#fbbf24' : 'rgba(255,255,255,0.15)' }}>
                              {task.completed ? `⚡${task.xp}` : `+${task.xp}`}
                            </span>

                            {/* Action buttons */}
                            {isPending ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => skipTask(task.id)}
                                  className="flex h-6 w-6 items-center justify-center rounded-full transition-all opacity-0 group-hover:opacity-100"
                                  style={{ background: 'rgba(255,255,255,0.06)' }}
                                  title="Пропустить"
                                >
                                  <SkipForward size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
                                </button>
                                <button
                                  onClick={() => completeTask(task.id)}
                                  className="flex h-6 w-6 items-center justify-center rounded-full transition-all"
                                  style={{ background: `${color}30` }}
                                  title="Выполнено"
                                >
                                  <Check size={10} strokeWidth={3} style={{ color }} />
                                </button>
                              </div>
                            ) : task.completed ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => uncompleteTask(task.id)}
                                  className="flex h-5 w-5 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}
                                  title="Отменить"
                                >
                                  <RotateCcw size={9} />
                                </button>
                                <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: `${color}30` }}>
                                  <Check size={10} strokeWidth={3} style={{ color }} />
                                </div>
                              </div>
                            ) : (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <SkipForward size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
