'use client'

import { useState } from 'react'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Check, SkipForward } from 'lucide-react'
import { useStore } from '@/lib/store'
import { TRACK_COLORS, TRACK_LABELS, type Track } from '@/lib/types'

const ALL_TRACKS: Track[] = ['ai', 'design', 'selfdevelopment', 'mediabuy', 'english', 'polish', 'gym']

const TRACK_EMOJI: Record<string, string> = {
  ai: '🤖', design: '🎨', selfdevelopment: '🧠',
  mediabuy: '📈', english: '🗣️', polish: '✍️', gym: '💪',
}

const TRACK_TIPS: Record<string, string[]> = {
  ai: [
    'Тот, кто понимает AI сегодня — управляет миром завтра.',
    'Каждый урок приближает тебя к тем, кто строит будущее.',
    'AI — это суперсила. Ты её прокачиваешь прямо сейчас.',
    'Сегодняшнее обучение = завтрашнее конкурентное преимущество.',
  ],
  design: [
    'Хороший дизайн — это не красота. Это решение.',
    'Каждый разобранный кейс делает глаз острее.',
    'Дизайн — язык, которым говорят лучшие продукты в мире.',
    'Ты учишься думать глазами пользователя. Это редкий навык.',
  ],
  selfdevelopment: [
    'Самый ценный актив, в который ты вкладываешь — это ты сам.',
    'Маленький шаг сегодня — огромный разрыв через год.',
    'Люди, которые растут — не стоят на месте никогда.',
    'Инвестиция в себя даёт самый высокий процент возврата.',
  ],
  mediabuy: [
    'Данные — это деньги. Умей их читать правильно.',
    'Каждая кампания учит больше, чем любой курс.',
    'Медиабаинг — это наука превращать внимание в прибыль.',
    'Сильный байер видит паттерны, которые другие не замечают.',
  ],
  english: [
    'Английский — это доступ к 90% лучшего контента мира.',
    'Каждое новое слово открывает новую дверь.',
    'Fluency — это просто много маленьких шагов каждый день.',
    'Ты уже говоришь лучше, чем вчера. Серьёзно.',
  ],
  polish: [
    'Третий язык в голове — это уже особый уровень.',
    'Польский открывает двери в Европу и новые возможности.',
    'Ещё один язык — ещё одна версия тебя.',
    'Możesz to zrobić. И ты уже делаешь.',
  ],
  gym: [
    'Тело — фундамент всего остального в жизни.',
    'Дисциплина в зале переносится на всё остальное.',
    'Каждая тренировка — это голос за лучшую версию себя.',
    'Сильное тело держит сильный ум. Это не метафора.',
  ],
}

function getTip(track: string, taskId: string): string {
  const tips = TRACK_TIPS[track] ?? ['Сделай это. Просто сделай.']
  const idx = taskId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % tips.length
  return tips[idx]
}

export default function TasksPage() {
  const { tasks, completeTask, uncompleteTask, skipTask } = useStore()
  const [tab, setTab] = useState<'current' | 'history'>('current')
  const [filter, setFilter] = useState<'active' | 'done' | 'all'>('active')
  const [selectedTrack, setSelectedTrack] = useState<Track | 'all'>('all')

  const today = format(new Date(), 'yyyy-MM-dd')

  const filtered = tasks.filter(t => {
    const isPast = t.date < today
    if (tab === 'current' && isPast) return false
    if (tab === 'history' && !isPast) return false
    if (selectedTrack !== 'all' && t.track !== selectedTrack) return false
    if (filter === 'active') return !t.completed && !t.skipped
    if (filter === 'done') return t.completed
    return true
  })

  const grouped = filtered.reduce<Record<string, typeof tasks>>((acc, task) => {
    if (!acc[task.date]) acc[task.date] = []
    acc[task.date].push(task)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort(
    tab === 'history' ? (a, b) => b.localeCompare(a) : (a, b) => a.localeCompare(b)
  )

  const labelDate = (dateStr: string) => {
    const d = parseISO(dateStr)
    if (isToday(d)) return 'Сегодня'
    if (isTomorrow(d)) return 'Завтра'
    return format(d, 'd MMMM · EEEE', { locale: ru })
  }

  const totalActive = tasks.filter(t => !t.completed && !t.skipped && t.date >= today).length
  const totalDone = tasks.filter(t => t.completed).length

  return (
    <div className="min-h-full p-4 sm:p-6 pb-12" style={{ background: '#07070d' }}>
      <div className="space-y-7">

        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-2xl font-bold text-white">Задания</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              <span className="font-bold text-white">{totalActive}</span> активных
            </span>
            <span className="h-3 w-px bg-white/10" />
            <span className="text-muted-foreground">
              <span className="font-bold" style={{ color: '#818cf8' }}>{totalDone}</span> выполнено
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1.5">
          {([['current', '📋 Задания'], ['history', '🕰 История']] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="rounded-xl px-4 py-2 text-xs font-bold transition-all duration-150"
              style={tab === t ? {
                background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(129,140,248,0.3)',
              } : {
                background: '#12121e',
                color: '#475569',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Status */}
          <div className="flex gap-1.5">
            {(['active', 'done', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="rounded-xl px-4 py-2 text-xs font-bold transition-all duration-150"
                style={filter === f ? {
                  background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(129,140,248,0.3)',
                } : {
                  background: '#12121e',
                  color: '#475569',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset',
                }}
              >
                {f === 'active' ? '⚡ Активные' : f === 'done' ? '✓ Выполненные' : '· Все'}
              </button>
            ))}
          </div>

          {/* Tracks */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedTrack('all')}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
              style={selectedTrack === 'all' ? {
                background: 'rgba(129,140,248,0.18)', color: '#818cf8',
                boxShadow: '0 0 0 1px rgba(129,140,248,0.25) inset',
              } : { background: '#12121e', color: '#475569', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
            >
              Все треки
            </button>
            {ALL_TRACKS.map(track => {
              const active = selectedTrack === track
              const c = TRACK_COLORS[track]
              return (
                <button
                  key={track}
                  onClick={() => setSelectedTrack(active ? 'all' : track)}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
                  style={active ? {
                    background: c + '22', color: c,
                    boxShadow: `0 0 0 1px ${c}40 inset, 0 4px 12px ${c}18`,
                  } : { background: '#12121e', color: '#475569', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
                >
                  {TRACK_EMOJI[track]} {TRACK_LABELS[track]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Task groups */}
        {sortedDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="text-5xl">✨</span>
            <p className="text-muted-foreground text-sm">Задач нет</p>
          </div>
        ) : (
          sortedDates.map(dateStr => {
            const dateTasks = grouped[dateStr]
            const isCurrentDay = isToday(parseISO(dateStr))
            const isPast = dateStr < today && !isCurrentDay
            const doneCount = dateTasks.filter(t => t.completed).length
            const allDone = doneCount === dateTasks.length && dateTasks.length > 0

            return (
              <div key={dateStr} className="space-y-3">

                {/* Date header */}
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 ${isCurrentDay ? '' : ''}`}>
                    {isCurrentDay && (
                      <span className="flex h-2 w-2 rounded-full" style={{ background: '#818cf8', boxShadow: '0 0 6px #818cf8' }} />
                    )}
                    <span className={`text-xs font-bold uppercase tracking-[0.12em] ${
                      isCurrentDay ? 'text-white' : isPast ? 'text-white/20' : 'text-white/40'
                    }`}>
                      {labelDate(dateStr)}
                    </span>
                  </div>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  <span className="text-xs font-bold" style={{
                    color: allDone ? '#818cf8' : 'rgba(255,255,255,0.2)'
                  }}>
                    {allDone ? '🎉' : `${doneCount}/${dateTasks.length}`}
                  </span>
                </div>

                {/* Task cards */}
                <div className="grid gap-3">
                  {dateTasks.map(task => {
                    const c = TRACK_COLORS[task.track]
                    const done = task.completed
                    const skipped = task.skipped
                    const tip = getTip(task.track, task.id)

                    return (
                      <div
                        key={task.id}
                        className="relative overflow-hidden rounded-2xl transition-all duration-300"
                        style={{
                          background: done
                            ? `linear-gradient(160deg, ${c}1a 0%, #12121e 55%)`
                            : '#12121e',
                          boxShadow: done
                            ? `0 0 0 1px ${c}35 inset, 0 8px 40px ${c}12`
                            : skipped
                            ? '0 0 0 1px rgba(255,255,255,0.04) inset'
                            : '0 0 0 1px rgba(255,255,255,0.09) inset, 0 8px 32px rgba(0,0,0,0.4)',
                          opacity: skipped ? 0.4 : 1,
                        }}
                      >
                        {/* Colored top border line */}
                        <div
                          className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl"
                          style={{
                            background: done
                              ? `linear-gradient(90deg, ${c}, ${c}80)`
                              : `linear-gradient(90deg, ${c}60, transparent)`,
                            boxShadow: done ? `0 0 12px ${c}60` : undefined,
                          }}
                        />

                        {/* Background glow */}
                        <div
                          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full"
                          style={{ background: c, opacity: done ? 0.07 : 0.03, filter: 'blur(30px)' }}
                        />

                        <div className="relative p-5">
                          {/* Top: emoji icon + track + XP */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {/* Emoji block */}
                              <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                                style={{
                                  background: `linear-gradient(135deg, ${c}28, ${c}12)`,
                                  boxShadow: `0 0 0 1px ${c}25 inset`,
                                }}
                              >
                                {TRACK_EMOJI[task.track]}
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: c }}>
                                  {TRACK_LABELS[task.track]}
                                </p>
                                <p className={`mt-0.5 text-base font-bold leading-snug ${
                                  done || skipped ? 'text-white/30 line-through' : 'text-white'
                                }`}>
                                  {task.title}
                                </p>
                              </div>
                            </div>

                            {/* XP badge */}
                            <div
                              className="shrink-0 flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-black"
                              style={done ? {
                                background: 'rgba(251,191,36,0.15)',
                                color: '#fbbf24',
                                boxShadow: '0 0 12px rgba(251,191,36,0.15)',
                              } : {
                                background: 'rgba(255,255,255,0.04)',
                                color: 'rgba(255,255,255,0.25)',
                              }}
                            >
                              {done ? '⚡' : '+'}{task.xp}
                            </div>
                          </div>

                          {/* Tip */}
                          {!skipped && (
                            <div
                              className="mb-4 rounded-xl px-4 py-3"
                              style={{
                                background: `linear-gradient(135deg, ${c}0d, transparent)`,
                                borderLeft: `2px solid ${c}50`,
                              }}
                            >
                              <p className="text-xs italic leading-relaxed" style={{ color: `${c}b0` }}>
                                «{tip}»
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          {!done && !skipped && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => completeTask(task.id)}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-150 active:scale-95"
                                style={{
                                  background: `${c}18`,
                                  color: c,
                                  boxShadow: `0 0 0 1px ${c}35 inset`,
                                }}
                              >
                                <Check size={15} strokeWidth={3} />
                                Выполнено
                              </button>
                              <button
                                onClick={() => skipTask(task.id)}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all hover:bg-white/5"
                                style={{ color: 'rgba(255,255,255,0.2)' }}
                                title="Пропустить"
                              >
                                <SkipForward size={15} />
                              </button>
                            </div>
                          )}

                          {done && (
                            <button
                              onClick={() => uncompleteTask(task.id)}
                              className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 transition-all hover:opacity-75"
                              style={{ background: `${c}14` }}
                              title="Нажми чтобы отменить"
                            >
                              <Check size={14} strokeWidth={3} style={{ color: c }} />
                              <span className="text-xs font-semibold" style={{ color: c }}>
                                Выполнено · +{task.xp} XP заработано
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
