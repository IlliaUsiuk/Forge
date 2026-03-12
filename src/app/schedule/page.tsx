'use client'

import { useState } from 'react'
import { format, addDays, isToday } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Monitor, Check, Sun, AlarmClock, Home, Pencil, Trash2, History, Copy, GripVertical } from 'lucide-react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { TRACK_COLORS, TRACK_LABELS, calcXP } from '@/lib/types'

const TRACK_EMOJI: Record<string, string> = {
  ai: '🤖', design: '🎨', selfdevelopment: '🧠',
  mediabuy: '📈', english: '🗣️', polish: '✍️', gym: '💪',
}

// How long each track's session takes (minutes).
// Polish: long=60 (free days), short=30 (Mac days). English: tutor=75 (1h15), hw=45.
const TASK_DURATION: Record<string, number> = {
  gym: 150, ai: 90, design: 90,
  english: 45, 'english-tutor': 75, 'english-self': 60, polish: 30, 'polish-long': 60, 'polish-course': 60, 'polish-chat': 30,
  selfdevelopment: 45, mediabuy: 60,
}

// Display order within a block (gym last — it's an evening activity at 18:00)
const TRACK_ORDER: Record<string, number> = {
  english: 1, polish: 2, selfdevelopment: 3,
  ai: 4, design: 5, mediabuy: 6, gym: 7,
}

const COMMUTE_TO_WORK_MIN = 40  // 40 min commute to work
const COMMUTE_HOME_MIN = 60     // 1 hour commute home
const PREP_MIN = 90             // 1.5 hours: cook + dress + eat
const DEPART_BUF = 15           // minutes buffer to get out the door
const GAP = 15                  // minutes gap between tasks
const BED_TIME = '01:00'        // Target bedtime every day (01:00)
const RITUAL_TIME = '00:00'     // Sleep ritual starts at midnight
const WAKE_TIME = '09:00'       // BED_TIME + 8h sleep

// Times before DAY_ANCHOR belong to "next day" — needed for midnight crossover comparisons
const DAY_ANCHOR = 6 * 60  // 06:00

function normMin(m: number): number {
  return m < DAY_ANCHOR ? m + 24 * 60 : m
}

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minToTime(total: number): string {
  // Handle midnight crossover (e.g. 00:30)
  const v = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
  const h = Math.floor(v / 60)
  const m = v % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// Compute task start times.
// wakeUp   = fixed WAKE_TIME (09:00 every day = BED_TIME 01:00 + 8h)
// prepEnd  = wakeUp + 1.5h prep
// departure= job.start − 40 min commute − 15 min buffer
// Tasks that don't fit before departure get time = null
// Gym: Mon(1)/Wed(3)/Fri(5) fixed at 18:00; other days flows in schedule
function computeTimes(
  tasks: Array<{ id: string; track: string; recurringType?: string; timeStart?: string; duration?: number; sortOrder?: number }>,
  job: { start: string; end: string } | undefined,
  dateStr: string
): {
  taskTimes: Record<string, string | null>
  wakeUp: string
  prepEnd: string
  departureTime: string | null
  fitsBeforeWork: boolean
} {
  const taskTimes: Record<string, string | null> = {}

  const wakeMin = timeToMin(WAKE_TIME)  // 09:00 = 540
  const prepEndMin = wakeMin + PREP_MIN // 10:30 = 630

  // Must leave home this many minutes before job starts
  const departureMin = job ? timeToMin(job.start) - COMMUTE_TO_WORK_MIN - DEPART_BUF : null

  // Day of week for gym fixed-time logic (0=Sun, 1=Mon…6=Sat)
  const dow = new Date(dateStr + 'T12:00:00').getDay()
  const gym18 = 18 * 60  // 18:00 in minutes
  const gymConflictsWork = job !== undefined &&
    timeToMin(job.start) <= gym18 && gym18 < timeToMin(job.end)
  const gymFixed = (dow === 1 || dow === 3 || dow === 5) && !gymConflictsWork

  // Assign fixed times first: user-set timeStart or gym on Mon/Wed/Fri
  // User-set times are always respected — no conflict check
  for (const task of tasks) {
    if (task.timeStart) {
      taskTimes[task.id] = task.timeStart
    } else if (task.track === 'gym' && gymFixed) {
      taskTimes[task.id] = '18:00'
    }
  }

  // Flex tasks: those without a fixed time, sorted by track order
  const flexTasks = tasks
    .filter(t => taskTimes[t.id] === undefined)
    .sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) return a.sortOrder - b.sortOrder
      if (a.sortOrder !== undefined) return -1
      if (b.sortOrder !== undefined) return 1
      return (TRACK_ORDER[a.track] ?? 9) - (TRACK_ORDER[b.track] ?? 9)
    })

  // Build intervals for all pinned tasks so flex tasks skip over them
  const pinnedIntervals = (Object.entries(taskTimes) as [string, string][])
    .map(([id, t]) => {
      const task = tasks.find(tk => tk.id === id)!
      const durKey = task.recurringType === 'long' ? `${task.track}-long` : task.recurringType === 'tutor' ? `${task.track}-tutor` : task.recurringType === 'self' ? `${task.track}-self` : task.recurringType === 'course' ? `${task.track}-course` : task.recurringType === 'chat' ? `${task.track}-chat` : task.track
      const dur = task.duration ?? TASK_DURATION[durKey] ?? TASK_DURATION[task.track] ?? 45
      const start = timeToMin(t)
      return { start, end: start + dur }
    })
    .sort((a, b) => a.start - b.start)

  let cursor = prepEndMin
  for (const task of flexTasks) {
    const durKey = task.recurringType === 'long' ? `${task.track}-long` : task.recurringType === 'tutor' ? `${task.track}-tutor` : task.recurringType === 'self' ? `${task.track}-self` : task.track
    const dur = task.duration ?? TASK_DURATION[durKey] ?? TASK_DURATION[task.track] ?? 45
    // Advance cursor past any pinned slots that would overlap
    let moved = true
    while (moved) {
      moved = false
      for (const iv of pinnedIntervals) {
        if (cursor < iv.end && cursor + dur > iv.start) {
          cursor = iv.end + GAP
          moved = true
          break
        }
      }
    }
    if (departureMin === null || cursor + dur <= departureMin) {
      taskTimes[task.id] = minToTime(cursor)
    } else {
      taskTimes[task.id] = null // no window before departure
    }
    cursor += dur + GAP
  }

  const fitsBeforeWork = flexTasks.every(t => taskTimes[t.id] !== null)

  return {
    taskTimes,
    wakeUp: WAKE_TIME,
    prepEnd: minToTime(prepEndMin),
    departureTime: departureMin !== null ? minToTime(departureMin) : null,
    fitsBeforeWork,
  }
}

// Sleep times: ritual 00:00, bed 01:00 every day.
// If home arrival is after ritual start — show actual times from arrival.
// Uses normMin for midnight-aware comparison (23:30 < 00:00 in "same night" sense).
function getSleepTimes(job?: { end: string }): { sleepRitual: string; bedtime: string; lateArrival: boolean; arrivalTime: string | null } {
  const ritualMin = timeToMin(RITUAL_TIME)  // 0 (00:00)

  if (!job) {
    return { sleepRitual: RITUAL_TIME, bedtime: BED_TIME, lateArrival: false, arrivalTime: null }
  }

  const homeMin = timeToMin(job.end) + COMMUTE_HOME_MIN
  // normMin: times before 06:00 are treated as "after midnight" (add 24h) for comparison
  const lateArrival = normMin(homeMin) > normMin(ritualMin)

  if (lateArrival) {
    // Ritual starts on arrival, bed 60 min later
    return {
      sleepRitual: minToTime(homeMin),
      bedtime: minToTime(homeMin + 60),
      lateArrival: true,
      arrivalTime: minToTime(homeMin),
    }
  }

  return {
    sleepRitual: RITUAL_TIME,
    bedtime: BED_TIME,
    lateArrival: false,
    arrivalTime: minToTime(homeMin),
  }
}

export default function SchedulePage() {
  const { tasks, dayJobs, completeTask, uncompleteTask, updateTaskTime, updateTaskDuration, updateTaskTitle, updateTaskRecurringType, addTask, deleteTask, moveTaskTo } = useStore()
  const [addingDay, setAddingDay] = useState<string | null>(null)
  const [copiedDay, setCopiedDay] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  function copyDaySummary(dateStr: string, dayTasks: typeof tasks, job: typeof dayJobs[0] | undefined) {
    const dateLabel = format(new Date(dateStr + 'T12:00:00'), 'd MMMM yyyy (EEEE)', { locale: ru })
    const done = dayTasks.filter(t => t.completed)
    const skipped = dayTasks.filter(t => t.skipped)
    const notDone = dayTasks.filter(t => !t.completed && !t.skipped)
    const xp = done.reduce((s, t) => s + t.xp, 0)

    const lines = [
      `📅 ${dateLabel}`,
      ...(job ? [`🖥 Работа: ${job.start}–${job.end}`] : []),
      ``,
      ...(done.length > 0 ? [`✅ Выполнено (${done.length}):`, ...done.map(t => `  ${TRACK_EMOJI[t.track]} ${t.title} +${t.xp} XP`)] : []),
      ...(skipped.length > 0 ? [`⏭ Пропущено (${skipped.length}):`, ...skipped.map(t => `  ${TRACK_EMOJI[t.track]} ${t.title}`)] : []),
      ...(notDone.length > 0 ? [`○ Не выполнено (${notDone.length}):`, ...notDone.map(t => `  ${TRACK_EMOJI[t.track]} ${t.title}`)] : []),
      ``,
      `⚡ XP за день: ${xp}`,
    ]

    navigator.clipboard.writeText(lines.join('\n'))
    setCopiedDay(dateStr)
    setTimeout(() => setCopiedDay(null), 2000)
  }

  function handleDrop(targetId: string) {
    if (dragId && dragId !== targetId) moveTaskTo(dragId, targetId)
    setDragId(null)
    setDragOverId(null)
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Хроники</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(), 'd MMM', { locale: ru })} — {format(addDays(new Date(), 6), 'd MMM yyyy', { locale: ru })}
          </p>
        </div>
        <Link
          href="/schedule/history"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:text-foreground"
          style={{ background: '#12121e', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
        >
          <History size={13} />
          История
        </Link>
      </div>

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayTasks = tasks.filter(t => t.date === dateStr)
          const doneCount = dayTasks.filter(t => t.completed).length
          const isTodayDay = isToday(day)
          const hasJob = dayJobs.some(j => j.date === dateStr)

          return (
            <div
              key={dateStr}
              className="flex flex-col items-center gap-1.5 rounded-xl p-2.5"
              style={{
                background: isTodayDay ? 'linear-gradient(160deg, #16163a, #0f0f25)' : '#0f0f1a',
                boxShadow: isTodayDay
                  ? '0 0 0 1px rgba(129,140,248,0.3) inset'
                  : '0 0 0 1px rgba(255,255,255,0.05) inset',
              }}
            >
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isTodayDay ? 'text-primary' : 'text-white/30'}`}>
                {format(day, 'EEE', { locale: ru })}
              </p>
              <p className={`text-base font-black leading-none ${isTodayDay ? 'text-white' : 'text-white/50'}`}>
                {format(day, 'd')}
              </p>
              {hasJob && <div className="h-1 w-1 rounded-full bg-white/20" title="Работа в маке" />}
              {dayTasks.length > 0 && (
                <>
                  <div className="flex flex-wrap justify-center gap-0.5 max-w-full">
                    {dayTasks.slice(0, 6).map(t => (
                      <div
                        key={t.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: t.completed
                            ? TRACK_COLORS[t.track as keyof typeof TRACK_COLORS]
                            : 'rgba(255,255,255,0.12)',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[9px] text-white/20 font-medium">{doneCount}/{dayTasks.length}</p>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Day sections */}
      <div className="space-y-4">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayTasks = tasks.filter(t => t.date === dateStr)
          const job = dayJobs.find(j => j.date === dateStr)
          const isTodayDay = isToday(day)
          const doneCount = dayTasks.filter(t => t.completed).length

          if (dayTasks.length === 0 && !job) return null

          // On Mac work days, gym cant happen — hide it
          const visibleTasks = job ? dayTasks.filter(t => t.track !== 'gym') : dayTasks
          // Compute times only for visible tasks (gym excluded on Mac days so it doesn't affect fitsBeforeWork)
          const { taskTimes, wakeUp, prepEnd, departureTime, fitsBeforeWork } = computeTimes(visibleTasks, job, dateStr)
          // Sort tasks by their final display time for rendering
          const allSorted = [...visibleTasks].sort((a, b) => {
            const ta = taskTimes[a.id]
            const tb = taskTimes[b.id]
            if (ta === null && tb === null) return 0
            if (ta === null) return 1
            if (tb === null) return -1
            return normMin(timeToMin(ta)) - normMin(timeToMin(tb))
          })
          const homeArrivalMin = job ? timeToMin(job.end) + COMMUTE_HOME_MIN : null
          // Split: tasks after home arrival go below work block
          const displayTasks = job
            ? allSorted.filter(t => {
                const tm = taskTimes[t.id]
                return !tm || homeArrivalMin === null || normMin(timeToMin(tm)) < normMin(homeArrivalMin)
              })
            : allSorted
          const afterWorkTasks = job
            ? allSorted.filter(t => {
                const tm = taskTimes[t.id]
                return tm && homeArrivalMin !== null && normMin(timeToMin(tm)) >= normMin(homeArrivalMin)
              })
            : []
          const { sleepRitual, bedtime, lateArrival, arrivalTime } = getSleepTimes(job)

          return (
            <div
              key={dateStr}
              className="rounded-2xl overflow-hidden"
              style={{
                background: isTodayDay ? 'linear-gradient(160deg, #13132e, #0d0d20)' : '#0f0f1a',
                boxShadow: isTodayDay
                  ? '0 0 0 1px rgba(129,140,248,0.2) inset, 0 8px 32px rgba(129,140,248,0.06)'
                  : '0 0 0 1px rgba(255,255,255,0.06) inset',
              }}
            >
              {/* Day header */}
              <div className="px-5 pt-5 pb-3 flex items-start justify-between">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest ${isTodayDay ? 'text-primary' : 'text-white/30'}`}>
                    {format(day, 'EEEE', { locale: ru })}
                  </p>
                  <p className={`text-xl font-black mt-0.5 ${isTodayDay ? 'text-white' : 'text-white/60'}`}>
                    {format(day, 'd MMMM', { locale: ru })}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {dayTasks.length > 0 && (
                    <div
                      className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
                      style={{
                        background: doneCount === dayTasks.length
                          ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.04)',
                        color: doneCount === dayTasks.length ? '#818cf8' : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {doneCount === dayTasks.length ? '🎉 Готово' : `${doneCount} / ${dayTasks.length}`}
                    </div>
                  )}
                  <button
                    onClick={() => copyDaySummary(dateStr, visibleTasks, job)}
                    className="flex items-center justify-center h-7 w-7 rounded-xl transition-all"
                    style={{
                      background: copiedDay === dateStr ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
                      color: copiedDay === dateStr ? '#34d399' : 'rgba(255,255,255,0.25)',
                    }}
                    title="Скопировать итоги дня"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>

              {/* Wake up row */}
              <div className="flex items-center gap-2.5 px-5 pb-3">
                <AlarmClock size={13} style={{ color: 'rgba(251,191,36,0.55)', flexShrink: 0 }} />
                <span className="text-xs font-bold" style={{ color: 'rgba(251,191,36,0.55)' }}>
                  Подъём {wakeUp}
                </span>
                <span
                  className="text-[10px] font-bold rounded-md px-1.5 py-0.5"
                  style={{ color: 'rgba(52,211,153,0.7)', background: 'rgba(52,211,153,0.08)' }}
                >
                  💤 8ч
                </span>
              </div>

              {/* Morning prep block */}
              <div
                className="mx-5 mb-4 rounded-xl px-4 py-3 flex items-center gap-3"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.05) inset',
                }}
              >
                <span className="text-base shrink-0">☕</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white/35">Готовка, завтрак, сборы</p>
                  <p className="text-[11px] text-white/20 mt-0.5">{wakeUp} — {prepEnd}</p>
                </div>
                <span className="text-xs font-bold text-white/25">1.5ч</span>
              </div>

              {/* Warning if tasks don't fit before work */}
              {!fitsBeforeWork && job && displayTasks.length > 0 && (
                <div className="px-5 pb-3">
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{
                      background: 'rgba(251,191,36,0.05)',
                      boxShadow: '0 0 0 1px rgba(251,191,36,0.15) inset',
                    }}
                  >
                    <span className="text-sm shrink-0">⚠️</span>
                    <p className="text-[11px]" style={{ color: 'rgba(251,191,36,0.65)' }}>
                      Не все задачи успеть до работы — перенеси лишние через чат
                    </p>
                  </div>
                </div>
              )}

              {/* Morning tasks — all tasks on Mac days go here */}
              {displayTasks.length > 0 && (
                <div className="px-5 pb-4 space-y-2">
                  {job && (
                    <div className="flex items-center gap-2 mb-3">
                      <Sun size={12} style={{ color: 'rgba(251,191,36,0.45)' }} />
                      <span className="text-[11px] font-semibold text-white/25 uppercase tracking-widest">
                        До работы
                      </span>
                    </div>
                  )}
                  {displayTasks.map(task => (
                    <ScheduleTaskCard
                      key={task.id}
                      task={task}
                      time={taskTimes[task.id]}
                      onComplete={completeTask}
                      onUncomplete={uncompleteTask}
                      onUpdateTime={updateTaskTime}
                      onUpdateDuration={updateTaskDuration}
                      onUpdateTitle={updateTaskTitle}
                      onUpdateRecurringType={updateTaskRecurringType}
                      onDelete={deleteTask}
                      isDragging={dragId === task.id}
                      isDragOver={dragOverId === task.id}
                      onDragStart={() => setDragId(task.id)}
                      onDragOver={() => setDragOverId(task.id)}
                      onDrop={() => handleDrop(task.id)}
                      onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                    />
                  ))}
                </div>
              )}

              {/* Departure row */}
              {departureTime && (
                <div className="flex items-center gap-2.5 px-5 pb-3">
                  <span style={{ fontSize: '13px', flexShrink: 0 }}>🚌</span>
                  <span className="text-xs font-bold text-white/30">
                    Выезд {departureTime}
                  </span>
                  <span className="text-[10px] text-white/15 ml-1">(40 мин до работы)</span>
                </div>
              )}

              {/* Work block */}
              {job && (
                <div
                  className="mx-5 mb-4 rounded-xl px-4 py-3.5 flex items-center gap-4"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset',
                  }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <Monitor size={16} className="text-white/30" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white/55">{job.label ?? 'Работа в маке'}</p>
                    <p className="text-xs text-white/25 mt-0.5">{job.start} — {job.end}</p>
                  </div>
                  <span className="text-sm font-black text-white/20">{job.start}</span>
                </div>
              )}

              {/* Home arrival row */}
              {job && (
                <div className="flex items-center gap-2.5 px-5 pb-4">
                  <Home size={13} style={{ color: 'rgba(255,255,255,0.18)', flexShrink: 0 }} />
                  <span className="text-xs font-medium text-white/18">
                    Дома в {arrivalTime ?? minToTime(timeToMin(job.end) + COMMUTE_HOME_MIN)}
                  </span>
                </div>
              )}

              {/* After-work tasks */}
              {afterWorkTasks.length > 0 && (
                <div className="px-5 pb-4 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Home size={12} style={{ color: 'rgba(255,255,255,0.25)' }} />
                    <span className="text-[11px] font-semibold text-white/25 uppercase tracking-widest">
                      После работы
                    </span>
                  </div>
                  {afterWorkTasks.map(task => (
                    <ScheduleTaskCard
                      key={task.id}
                      task={task}
                      time={taskTimes[task.id]}
                      onComplete={completeTask}
                      onUncomplete={uncompleteTask}
                      onUpdateTime={updateTaskTime}
                      onUpdateDuration={updateTaskDuration}
                      onUpdateTitle={updateTaskTitle}
                      onUpdateRecurringType={updateTaskRecurringType}
                      onDelete={deleteTask}
                      isDragging={dragId === task.id}
                      isDragOver={dragOverId === task.id}
                      onDragStart={() => setDragId(task.id)}
                      onDragOver={() => setDragOverId(task.id)}
                      onDrop={() => handleDrop(task.id)}
                      onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                    />
                  ))}
                </div>
              )}

              {/* Late arrival warning — arrives home after target bedtime */}
              {lateArrival && arrivalTime && (
                <div className="px-5 pb-3">
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{
                      background: 'rgba(248,113,113,0.05)',
                      boxShadow: '0 0 0 1px rgba(248,113,113,0.15) inset',
                    }}
                  >
                    <span className="text-sm shrink-0">⚠️</span>
                    <p className="text-[11px]" style={{ color: 'rgba(248,113,113,0.65)' }}>
                      Домой в {arrivalTime} — позже целевого отбоя, сон сдвинется
                    </p>
                  </div>
                </div>
              )}

              {/* Add task */}
              <div className="px-5 pb-3">
                {addingDay === dateStr ? (
                  <div
                    className="rounded-xl p-3"
                    style={{ background: 'rgba(255,255,255,0.03)', boxShadow: '0 0 0 1px rgba(255,255,255,0.07) inset' }}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Добавить задачу</span>
                      <button
                        onClick={() => setAddingDay(null)}
                        className="text-[11px] text-white/25 hover:text-white/50 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ADD_PRESETS.map(preset => {
                        const color = TRACK_COLORS[preset.track]
                        return (
                          <button
                            key={preset.track}
                            onClick={() => {
                              addTask({ title: preset.title, track: preset.track, date: dateStr, isRecurring: false, xp: preset.xp })
                              setAddingDay(null)
                            }}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all hover:brightness-125"
                            style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                          >
                            <span>{TRACK_EMOJI[preset.track]}</span>
                            {preset.title}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingDay(dateStr)}
                    className="w-full rounded-xl py-2 text-xs font-semibold text-white/25 hover:text-white/50 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
                  >
                    + Добавить задачу
                  </button>
                )}
              </div>

              {/* Sleep ritual */}
              <div className="px-5 pb-5">
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.05) inset',
                  }}
                >
                  <span className="text-base shrink-0">🌙</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white/35">Ритуал перед сном</p>
                    <p className="text-[11px] text-white/20 mt-0.5">Отбой {bedtime}</p>
                  </div>
                  <span className="text-xs font-black text-white/25">{sleepRitual}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {dayJobs.length === 0 && tasks.length === 0 && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
        >
          <p className="text-2xl mb-3">📅</p>
          <p className="text-sm text-muted-foreground mb-4">
            Расписание не настроено. Напиши в чате когда ты работаешь и когда хочешь учиться.
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
          >
            Настроить в чате
          </Link>
        </div>
      )}
    </div>
  )
}

const DURATION_PRESETS: Partial<Record<string, number[]>> = {
  ai:     [120, 240, 360],
  design: [120, 240, 360],
}

const ADD_PRESETS = [
  { track: 'ai'              as const, title: 'AI-обучение',     xp: 30 },
  { track: 'design'          as const, title: 'Продакт-дизайн',  xp: 25 },
  { track: 'mediabuy'        as const, title: 'Медиабаинг',      xp: 25 },
  { track: 'selfdevelopment' as const, title: 'Саморазвитие',    xp: 20 },
  { track: 'english'         as const, title: 'Английский',      xp: 20 },
  { track: 'polish'          as const, title: 'Польский',        xp: 15 },
  { track: 'gym'             as const, title: 'Зал',             xp: 15 },
]

function ScheduleTaskCard({
  task,
  time,
  onComplete,
  onUncomplete,
  onUpdateTime,
  onUpdateDuration,
  onUpdateTitle,
  onUpdateRecurringType,
  onDelete,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  task: { id: string; track: string; title: string; completed: boolean; skipped: boolean; xp: number; difficulty?: number; recurringType?: string; timeStart?: string; duration?: number }
  time?: string | null
  onComplete: (id: string) => void
  onUncomplete: (id: string) => void
  onUpdateTime: (taskId: string, t: string | undefined) => void
  onUpdateDuration: (taskId: string, duration: number | undefined) => void
  onUpdateTitle: (taskId: string, title: string) => void
  onUpdateRecurringType: (taskId: string, recurringType: string | undefined) => void
  onDelete: (id: string) => void
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: () => void
  onDragOver?: () => void
  onDrop?: () => void
  onDragEnd?: () => void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [localTitle, setLocalTitle] = useState(task.title)
  const color = TRACK_COLORS[task.track as keyof typeof TRACK_COLORS]
  const displayTime = time
  const isPinned = task.timeStart !== undefined && time === task.timeStart

  const durKey = task.recurringType === 'long' ? `${task.track}-long`
    : task.recurringType === 'tutor' ? `${task.track}-tutor`
    : task.recurringType === 'self' ? `${task.track}-self`
    : task.recurringType === 'course' ? `${task.track}-course`
    : task.recurringType === 'chat' ? `${task.track}-chat`
    : task.track
  const dur = task.duration ?? TASK_DURATION[durKey] ?? TASK_DURATION[task.track] ?? 45
  const endTime = displayTime ? minToTime(timeToMin(displayTime) + dur) : null

  function handleEmojiClick(e: React.MouseEvent) {
    e.stopPropagation()
    setLocalTitle(task.title)
    setEditOpen(v => !v)
  }

  function saveTitle() {
    const trimmed = localTitle.trim()
    if (trimmed && trimmed !== task.title) onUpdateTitle(task.id, trimmed)
  }

  function handleEndTimeChange(val: string) {
    if (!val || !displayTime) return
    const startMin = timeToMin(displayTime)
    const endMin = timeToMin(val)
    // handle midnight crossover
    const diff = normMin(endMin) - normMin(startMin)
    if (diff > 0) onUpdateDuration(task.id, diff)
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: task.completed
          ? `linear-gradient(135deg, ${color}18, ${color}08)`
          : task.skipped ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
        boxShadow: isDragOver
          ? `0 0 0 2px ${color}60 inset`
          : task.completed
            ? `0 0 0 1px ${color}30 inset`
            : task.skipped ? '0 0 0 1px rgba(255,255,255,0.04) inset' : '0 0 0 1px rgba(255,255,255,0.08) inset',
        opacity: isDragging ? 0.35 : task.skipped ? 0.4 : 1,
      }}
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart?.() }}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver?.() }}
      onDrop={e => { e.preventDefault(); onDrop?.() }}
      onDragEnd={onDragEnd}
    >
      {/* Main row */}
      <div
        className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-all hover:brightness-110"
        style={{ cursor: task.skipped ? 'default' : 'grab' }}
        onClick={() => {
          if (task.skipped || editOpen) return
          if (task.completed) onUncomplete(task.id)
          else onComplete(task.id)
        }}
      >
        {/* Drag handle */}
        <GripVertical size={13} className="shrink-0 text-white/15 group-hover:text-white/30 transition-colors -ml-1 cursor-grab" />

        {/* Emoji — clickable to open edit panel */}
        <button
          onClick={handleEmojiClick}
          className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg text-base transition-all hover:brightness-125"
          style={{
            background: editOpen ? `${color}35` : task.completed ? `${color}25` : 'rgba(255,255,255,0.05)',
            boxShadow: editOpen ? `0 0 0 1px ${color}50 inset` : task.completed ? `0 0 8px ${color}30` : undefined,
          }}
          title="Редактировать задачу"
        >
          {TRACK_EMOJI[task.track]}
        </button>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: task.completed ? color : 'rgba(255,255,255,0.3)' }}
            >
              {TRACK_LABELS[task.track as keyof typeof TRACK_LABELS]}
            </p>

            {/* Time pill */}
            <button
              onClick={e => { e.stopPropagation(); setLocalTitle(task.title); setEditOpen(true) }}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-all hover:opacity-100"
              style={{
                background: isPinned ? `${color}20` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isPinned ? color + '40' : 'rgba(255,255,255,0.08)'}`,
                color: isPinned ? color : 'rgba(255,255,255,0.35)',
                opacity: displayTime === null ? 0.5 : 1,
              }}
              title="Изменить время"
            >
              <span className="text-[11px] font-bold tabular-nums">
                {displayTime === null ? 'нет окна' : displayTime ? `${displayTime} — ${endTime}` : '+ время'}
              </span>
              <Pencil size={9} />
            </button>
          </div>
          <p
            className="text-sm font-semibold leading-snug truncate"
            style={{
              color: task.completed || task.skipped ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)',
              textDecoration: task.completed || task.skipped ? 'line-through' : 'none',
            }}
          >
            {task.title}
          </p>

          {/* English type selector */}
          {task.track === 'english' && !task.skipped && (
            <div className="flex gap-1 mt-1.5" onClick={e => e.stopPropagation()}>
              {([
                { type: 'tutor', label: 'Репетитор' },
                { type: undefined, label: 'ДЗ' },
                { type: 'self', label: 'Самообучение' },
              ] as { type: string | undefined; label: string }[]).map(({ type, label }) => {
                const active = task.recurringType === type
                return (
                  <button
                    key={label}
                    onClick={e => { e.stopPropagation(); onUpdateRecurringType(task.id, active ? undefined : type) }}
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold transition-all"
                    style={{
                      background: active ? `${color}30` : 'rgba(255,255,255,0.05)',
                      color: active ? color : 'rgba(255,255,255,0.3)',
                      border: `1px solid ${active ? color + '50' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Polish type selector */}
          {task.track === 'polish' && !task.skipped && (
            <div className="flex gap-1 mt-1.5" onClick={e => e.stopPropagation()}>
              {([
                { type: 'course', label: 'Курс' },
                { type: 'chat', label: 'Чат' },
              ] as { type: string; label: string }[]).map(({ type, label }) => {
                const active = task.recurringType === type
                return (
                  <button
                    key={label}
                    onClick={e => { e.stopPropagation(); onUpdateRecurringType(task.id, active ? undefined : type) }}
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold transition-all"
                    style={{
                      background: active ? `${color}30` : 'rgba(255,255,255,0.05)',
                      color: active ? color : 'rgba(255,255,255,0.3)',
                      border: `1px solid ${active ? color + '50' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Duration presets for ai/design */}
          {DURATION_PRESETS[task.track] && !task.skipped && (
            <div className="flex gap-1 mt-1.5" onClick={e => e.stopPropagation()}>
              {DURATION_PRESETS[task.track]!.map(mins => {
                const active = task.duration === mins
                return (
                  <button
                    key={mins}
                    onClick={e => { e.stopPropagation(); onUpdateDuration(task.id, active ? undefined : mins) }}
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold transition-all"
                    style={{
                      background: active ? `${color}30` : 'rgba(255,255,255,0.05)',
                      color: active ? color : 'rgba(255,255,255,0.3)',
                      border: `1px solid ${active ? color + '50' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    {mins / 60}ч
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={e => { e.stopPropagation(); onDelete(task.id) }}
          className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
          title="Удалить задачу"
        >
          <Trash2 size={11} />
        </button>

        {/* XP + check */}
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: task.completed ? '#fbbf24' : 'rgba(255,255,255,0.2)' }}>
            {task.completed ? '⚡' : '+'}{calcXP(task.difficulty ?? 1.0, dur)}
          </span>
          {task.completed ? (
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: `${color}30` }}
              title="Нажми чтобы отменить"
            >
              <Check size={11} strokeWidth={3} style={{ color }} />
            </div>
          ) : (
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <div className="h-2 w-2 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>
          )}
        </div>
      </div>

      {/* Edit panel */}
      {editOpen && (
        <div
          className="px-4 pb-3 space-y-2 border-t"
          style={{ borderColor: `${color}20` }}
          onClick={e => e.stopPropagation()}
        >
          {/* Title */}
          <div className="pt-2">
            <label className="text-[10px] font-semibold uppercase tracking-wide block mb-1" style={{ color: `${color}80` }}>Название задачи</label>
            <input
              value={localTitle}
              onChange={e => setLocalTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditOpen(false) }}
              className="w-full rounded-lg px-2.5 py-2 text-sm outline-none text-white placeholder:text-white/25"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}30` }}
              placeholder="Название задачи..."
            />
          </div>

          {/* Start + End time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide block mb-1" style={{ color: `${color}80` }}>Начало</label>
              <input
                type="time"
                defaultValue={displayTime ?? ''}
                className="w-full rounded-lg px-2.5 py-2 text-sm font-bold tabular-nums outline-none text-white"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}30`, colorScheme: 'dark' }}
                onBlur={e => onUpdateTime(task.id, e.target.value || undefined)}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide block mb-1" style={{ color: `${color}80` }}>Конец</label>
              <input
                type="time"
                defaultValue={endTime ?? ''}
                className="w-full rounded-lg px-2.5 py-2 text-sm font-bold tabular-nums outline-none text-white"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}30`, colorScheme: 'dark' }}
                onBlur={e => handleEndTimeChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

