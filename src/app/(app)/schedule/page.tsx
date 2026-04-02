'use client'

import { useState } from 'react'
import { playTaskComplete, playClick } from '@/lib/sounds'
import { format, addDays, isToday } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Monitor, Check, Sun, Home, Pencil, Trash2, Copy, Layers, X, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { calcXP, catColor, catLabel, catEmoji, type Category } from '@/lib/types'
import { Portal } from '@/components/Portal'

const PRESETS = [
  { key: 'sport',    label: 'Спорт',      color: '#f87171', emoji: '🏃', emojis: ['🏋️','🏃','⚽','🎯','🏊','🚴','🥊','🧘','🏆','🤸','🎽','🏅','🏄','🥅','🎾','🛹'] },
  { key: 'study',    label: 'Учёба',      color: '#60a5fa', emoji: '📚', emojis: ['📚','📖','✏️','🎓','🔬','💡','📝','🧮','🖊️','📐','🔭','📓','🧪','🗺️','🖥️','📑'] },
  { key: 'work',     label: 'Работа',     color: '#818cf8', emoji: '💻', emojis: ['💼','💻','📊','📈','🖥️','📋','✉️','🤝','🏢','⚙️','📌','🗂️','🖨️','📞','⌨️','🗃️'] },
  { key: 'rest',     label: 'Отдых',      color: '#34d399', emoji: '🛋️', emojis: ['🛋️','🎮','🎬','🍵','🎵','🌙','😴','🏖️','🧸','🎭','🍕','🌊','🎈','🧩','🌸','📱'] },
  { key: 'creative', label: 'Творчество', color: '#f472b6', emoji: '🎨', emojis: ['🎨','🖌️','✍️','🎸','📷','🎭','🎬','🖼️','🎤','💃','🎻','🪄','🖋️','🎹','🎙️','🧶'] },
  { key: 'finance',  label: 'Финансы',    color: '#fbbf24', emoji: '💰', emojis: ['💰','📊','💳','🏦','💵','📈','🪙','💎','🤑','📉','🧾','💹','💱','🏧','📑','🗓️'] },
  { key: 'health',   label: 'Здоровье',   color: '#4ade80', emoji: '🥗', emojis: ['🥗','🧘','💊','🏥','🌿','🥦','💪','🩺','🧬','🌱','🍎','🥕','🧴','🫀','🫁','🍵'] },
  { key: 'other',    label: 'Другое',     color: '#94a3b8', emoji: '📋', emojis: ['📋','⭐','🎯','🔑','💫','🗒️','📌','🔔','✅','🎲','🔧','🌟','🔮','🧩','💬','🎁'] },
] as const
type Preset = typeof PRESETS[number]

const DIFFICULTY_LABELS = ['', 'Легко', 'Нормально', 'Сложно', 'Хардкор', 'Легенда']
const DIFFICULTY_COEF   = [0,  0.75,   1.0,         1.25,    1.5,       2.0]

function AddTaskModal({ dateStr, onClose, onAdd }: {
  dateStr: string
  onClose: () => void
  onAdd: (task: { title: string; emoji: string; track: string; xp: number; durationMins: number; timeStart?: string }) => void
}) {
  const { categories, addCategory, templateTasks } = useStore()
  const [step, setStep] = useState<'source' | 'pool' | 'category' | 'details'>('source')
  const [preset, setPreset] = useState<Preset | null>(null)
  const [cat, setCat] = useState<Category | null>(null)
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState(2)
  const [timeStart, setTimeStart] = useState('')
  const [durationMins, setDurationMins] = useState(60)

  const emoji = selectedEmoji ?? preset?.emoji ?? '📋'
  const color = preset?.color ?? '#818cf8'
  const xp = calcXP(DIFFICULTY_COEF[difficulty], durationMins)

  function pickPreset(p: Preset) {
    setPreset(p)
    setSelectedEmoji(null)
    let found = categories.find(c => c.label === p.label && c.color === p.color)
    if (!found) {
      addCategory({ label: p.label, color: p.color, emoji: p.emoji, mottos: [] })
      found = useStore.getState().categories.find(c => c.label === p.label && c.color === p.color)!
    }
    setCat(found)
    setStep('details')
  }

  function pickFromPool(tmpl: { title: string; emoji: string; xp: number; durationMins: number; categoryId: string }) {
    const poolCat = categories.find(c => c.id === tmpl.categoryId)
    onAdd({ title: tmpl.title, emoji: tmpl.emoji, track: tmpl.categoryId, xp: tmpl.xp, durationMins: tmpl.durationMins })
    onClose()
  }

  function handleSave() {
    if (!title.trim() || !cat) return
    onAdd({ title: title.trim(), emoji, track: cat.id, xp, durationMins, timeStart: timeStart || undefined })
    onClose()
  }

  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl p-5 space-y-4"
        style={{ background: '#0d0b18', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {step === 'source' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-foreground">Добавить задачу</p>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStep('pool')}
                className="flex flex-col items-center gap-3 rounded-2xl px-4 py-5 transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.25)' }}
              >
                <span className="text-3xl">📦</span>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Из пула</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Готовые карточки</p>
                </div>
              </button>
              <button
                onClick={() => setStep('category')}
                className="flex flex-col items-center gap-3 rounded-2xl px-4 py-5 transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)' }}
              >
                <span className="text-3xl">✏️</span>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Своя задача</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Создать с нуля</p>
                </div>
              </button>
            </div>
          </>
        )}

        {step === 'pool' && (
          <>
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('source')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={14} /> Назад
              </button>
              <p className="text-base font-semibold text-foreground">Из пула</p>
              <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
            </div>
            {templateTasks.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-3xl">📭</p>
                <p className="text-sm text-muted-foreground">Пул пустой — сначала добавь карточки в разделе Пул</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {templateTasks.map(tmpl => {
                  const tmplCat = categories.find(c => c.id === tmpl.categoryId)
                  const tmplColor = tmplCat?.color ?? '#818cf8'
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => pickFromPool({ ...tmpl, emoji: tmpl.emoji ?? tmplCat?.emoji ?? '📋' })}
                      className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover:brightness-125"
                      style={{ background: `${tmplColor}10`, border: `1px solid ${tmplColor}30` }}
                    >
                      <span className="text-xl shrink-0">{tmpl.emoji || tmplCat?.emoji || '📋'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{tmpl.title}</p>
                        <p className="text-xs text-muted-foreground">{tmplCat?.label ?? ''} · {tmpl.durationMins < 60 ? `${tmpl.durationMins}м` : `${tmpl.durationMins/60}ч`} · +{tmpl.xp} XP</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {step === 'category' && (
          <>
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('source')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={14} /> Назад
              </button>
              <p className="text-base font-semibold text-foreground">Выбери категорию</p>
              <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.key}
                  onClick={() => pickPreset(p)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover:scale-[1.02]"
                  style={{ background: `${p.color}12`, border: `1px solid ${p.color}35` }}
                >
                  <span className="text-2xl shrink-0">{p.emoji}</span>
                  <span className="text-sm font-medium text-foreground">{p.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'details' && (
          <>
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('category')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={14} /> Назад
              </button>
              <div className="flex items-center gap-2 rounded-xl px-3 py-1" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <span className="text-base">{emoji}</span>
                <span className="text-sm font-medium" style={{ color }}>{preset!.label}</span>
              </div>
              <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
            </div>

            {/* Emoji */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Иконка</p>
              <div className="grid grid-cols-8 gap-1.5">
                {preset!.emojis.map(e => (
                  <button key={e} onClick={() => setSelectedEmoji(e)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-all hover:bg-white/10"
                    style={{ background: emoji === e ? `${color}25` : 'transparent', outline: emoji === e ? `2px solid ${color}70` : 'none' }}
                  >{e}</button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Название</p>
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                placeholder="Например: Утренняя пробежка"
                maxLength={60}
                className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* Difficulty */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Сложность</p>
                <span className="rounded-lg px-2 py-0.5 text-xs font-bold" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>+{xp} XP</span>
              </div>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(d => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className="flex-1 rounded-xl py-2 text-xs font-semibold transition-all"
                    style={{ background: difficulty === d ? `${color}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${difficulty === d ? color + '50' : 'rgba(255,255,255,0.08)'}`, color: difficulty === d ? color : 'rgba(255,255,255,0.35)' }}
                  >{DIFFICULTY_LABELS[d]}</button>
                ))}
              </div>
            </div>

            {/* Time + Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Время начала</p>
                <input type="time" value={timeStart} onChange={e => setTimeStart(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Длительность</p>
                <div className="flex flex-wrap gap-1">
                  {[30,45,60,90,120].map(m => (
                    <button key={m} onClick={() => setDurationMins(m)}
                      className="rounded-lg px-2 py-1 text-xs font-semibold transition-all"
                      style={{ background: durationMins === m ? `${color}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${durationMins === m ? color + '50' : 'rgba(255,255,255,0.08)'}`, color: durationMins === m ? color : 'rgba(255,255,255,0.35)' }}
                    >{m < 60 ? `${m}м` : `${m/60}ч`}</button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
            >
              Добавить задачу
            </button>
          </>
        )}
      </div>
    </div>
    </Portal>
  )
}

const DEFAULT_DURATION = 45 // fallback task duration in minutes

const GAP = 15                  // minutes gap between tasks
const BED_TIME = '23:00'        // Default bedtime
const RITUAL_TIME = '22:45'     // Sleep ritual

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

function computeTimes(
  tasks: Array<{ id: string; track: string; timeStart?: string; durationMins?: number; sortOrder?: number }>,
  job: { start: string; end: string } | undefined,
  settings: import('@/lib/types').ScheduleSettings
): {
  taskTimes: Record<string, string | null>
  wakeUp: string
  prepEnd: string
  departureTime: string | null
  fitsBeforeWork: boolean
} {
  const taskTimes: Record<string, string | null> = {}

  const wakeMin = timeToMin(settings.wakeTime)
  const prepEndMin = wakeMin + settings.prepMin

  // Must leave home this many minutes before job starts
  const departureMin = job ? timeToMin(job.start) - settings.commuteToWorkMin - settings.departBufMin : null

  // Assign fixed times: user-set timeStart is always respected
  for (const task of tasks) {
    if (task.timeStart) {
      taskTimes[task.id] = task.timeStart
    }
  }

  // Flex tasks: those without a fixed time, sorted by track order
  const flexTasks = tasks
    .filter(t => taskTimes[t.id] === undefined)
    .sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) return a.sortOrder - b.sortOrder
      if (a.sortOrder !== undefined) return -1
      if (b.sortOrder !== undefined) return 1
      return 0
    })

  // Build intervals for all pinned tasks so flex tasks skip over them
  const pinnedIntervals = (Object.entries(taskTimes) as [string, string][])
    .map(([id, t]) => {
      const task = tasks.find(tk => tk.id === id)!
      const dur = task.durationMins ?? DEFAULT_DURATION
      const start = timeToMin(t)
      return { start, end: start + dur }
    })
    .sort((a, b) => a.start - b.start)

  const homeArrivalMin = job ? timeToMin(job.end) + 60 : null

  let cursor = prepEndMin
  let afterCursor = homeArrivalMin ?? prepEndMin
  let fitsBeforeWork = true

  for (const task of flexTasks) {
    const dur = task.durationMins ?? DEFAULT_DURATION

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
      cursor += dur + GAP
    } else {
      // Doesn't fit before work — schedule after home arrival
      fitsBeforeWork = false
      taskTimes[task.id] = minToTime(afterCursor)
      afterCursor += dur + GAP
    }
  }

  return {
    taskTimes,
    wakeUp: settings.wakeTime,
    prepEnd: minToTime(prepEndMin),
    departureTime: departureMin !== null ? minToTime(departureMin) : null,
    fitsBeforeWork,
  }
}

// If home arrival is after ritual start — show lateArrival warning.
function getSleepTimes(job?: { end: string }): { sleepRitual: string; bedtime: string; lateArrival: boolean; arrivalTime: string | null } {
  const ritualMin = timeToMin(RITUAL_TIME)

  if (!job) {
    return { sleepRitual: RITUAL_TIME, bedtime: BED_TIME, lateArrival: false, arrivalTime: null }
  }

  const homeMin = timeToMin(job.end) + 60 // 60 min commute home (average)
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
  const { tasks, dayJobs, categories, scheduleSettings, completeTask, uncompleteTask, updateTaskTime, updateTaskDuration, updateTaskTitle, addTask, deleteTask, moveTaskTo } = useStore()
  const [addingDay, setAddingDay] = useState<string | null>(null)
  const [copiedDay, setCopiedDay] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [weekOffset, setWeekOffset] = useState(0)

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
      ...(done.length > 0 ? [`✅ Выполнено (${done.length}):`, ...done.map(t => `  ${t.emoji ?? ''} ${t.title} +${t.xp} XP`)] : []),
      ...(skipped.length > 0 ? [`⏭ Пропущено (${skipped.length}):`, ...skipped.map(t => `  ${t.emoji ?? ''} ${t.title}`)] : []),
      ...(notDone.length > 0 ? [`○ Не выполнено (${notDone.length}):`, ...notDone.map(t => `  ${t.emoji ?? ''} ${t.title}`)] : []),
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

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i + weekOffset))

  // Mobile: 3 days centered on selectedDate
  const selectedDayObj = new Date(selectedDate + 'T12:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  const mobileDays = [-1, 0, 1].map(offset => addDays(selectedDayObj, offset))
  function mobileNavDay(dir: -1 | 1) {
    const next = addDays(selectedDayObj, dir)
    if (dir === -1 && next < today) return
    setSelectedDate(format(next, 'yyyy-MM-dd'))
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {addingDay && (
        <AddTaskModal
          dateStr={addingDay}
          onClose={() => setAddingDay(null)}
          onAdd={({ title, emoji, track, xp, durationMins, timeStart }) => {
            addTask({ title, emoji, track: track as Parameters<typeof addTask>[0]['track'], date: addingDay, isRecurring: false, xp, durationMins, timeStart })
            setAddingDay(null)
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Расписание</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(selectedDate + 'T12:00:00'), 'd MMMM yyyy, EEEE', { locale: ru })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/pool"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:text-foreground"
            style={{ background: '#12121e', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
          >
            <Layers size={13} />
            <span className="hidden sm:inline">Активности</span>
          </Link>
        </div>
      </div>

      {/* Week strip — mobile: 3 days, desktop: 7 days */}
      <div className="flex items-center gap-2">
        {/* Left arrow */}
        <button
          onClick={() => mobileNavDay(-1)}
          className="sm:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-20"
          disabled={selectedDate === format(new Date(), 'yyyy-MM-dd')}
          style={{ background: '#12121e', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset', color: 'rgba(255,255,255,0.4)' }}
        >
          <ArrowLeft size={14} />
        </button>
        <button
          onClick={() => setWeekOffset(o => Math.max(0, o - 7))}
          disabled={weekOffset === 0}
          className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-20"
          style={{ background: '#12121e', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset', color: 'rgba(255,255,255,0.4)' }}
        >
          <ArrowLeft size={14} />
        </button>

        {/* Mobile: 3 days */}
        <div className="sm:hidden grid grid-cols-3 gap-1.5 flex-1">
          {mobileDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayTasks = tasks.filter(t => t.date === dateStr)
            const isTodayDay = isToday(day)
            const isSelected = dateStr === selectedDate
            const isPast = dateStr < format(new Date(), 'yyyy-MM-dd')
            return (
              <button
                key={dateStr}
                onClick={() => !isPast && setSelectedDate(dateStr)}
                disabled={isPast}
                className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-3 w-full transition-all disabled:cursor-not-allowed"
                style={{
                  background: isSelected ? 'linear-gradient(160deg, #16163a, #0f0f25)' : '#0f0f1a',
                  boxShadow: isSelected ? '0 0 0 1px rgba(129,140,248,0.4) inset' : '0 0 0 1px rgba(255,255,255,0.05) inset',
                  opacity: isPast ? 0.3 : 1,
                }}
              >
                <p className={`text-[9px] font-bold uppercase tracking-wider leading-none ${isSelected ? 'text-primary' : isTodayDay ? 'text-primary/50' : 'text-white/25'}`}>
                  {format(day, 'EEE', { locale: ru })}
                </p>
                <p className={`text-lg font-black leading-tight ${isSelected ? 'text-white' : 'text-white/50'}`}>
                  {format(day, 'd')}
                </p>
                {dayTasks.length > 0 && (
                  <div className="h-1 w-1 rounded-full mt-0.5" style={{ background: isSelected ? '#818cf8' : 'rgba(255,255,255,0.2)' }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Desktop: 7 days */}
        <div className="hidden sm:grid grid-cols-7 gap-1.5 flex-1">
          {weekDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayTasks = tasks.filter(t => t.date === dateStr)
            const isTodayDay = isToday(day)
            const isSelected = dateStr === selectedDate
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-3 w-full transition-all"
                style={{
                  background: isSelected ? 'linear-gradient(160deg, #16163a, #0f0f25)' : '#0f0f1a',
                  boxShadow: isSelected ? '0 0 0 1px rgba(129,140,248,0.4) inset' : '0 0 0 1px rgba(255,255,255,0.05) inset',
                }}
              >
                <p className={`text-[9px] font-bold uppercase tracking-wider leading-none ${isSelected ? 'text-primary' : isTodayDay ? 'text-primary/50' : 'text-white/25'}`}>
                  {format(day, 'EEE', { locale: ru })}
                </p>
                <p className={`text-lg font-black leading-tight ${isSelected ? 'text-white' : 'text-white/50'}`}>
                  {format(day, 'd')}
                </p>
                {dayTasks.length > 0 && (
                  <div className="h-1 w-1 rounded-full mt-0.5" style={{ background: isSelected ? '#818cf8' : 'rgba(255,255,255,0.2)' }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => mobileNavDay(1)}
          className="sm:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all"
          style={{ background: '#12121e', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset', color: 'rgba(255,255,255,0.4)' }}
        >
          <ArrowRight size={14} />
        </button>
        <button
          onClick={() => setWeekOffset(o => o + 7)}
          className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all"
          style={{ background: '#12121e', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset', color: 'rgba(255,255,255,0.4)' }}
        >
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Day section — always show selected day */}
      <div className="space-y-4">
        {[selectedDate].map((dateStr) => {
          const day = new Date(dateStr + 'T12:00:00')
          const dayTasks = tasks.filter(t => t.date === dateStr)
          const job = dayJobs.find(j => j.date === dateStr)
          const isTodayDay = isToday(day)
          const doneCount = dayTasks.filter(t => t.completed).length

          // Never return null for selected day — always show add button

          const { taskTimes, departureTime, fitsBeforeWork } = computeTimes(dayTasks, job, scheduleSettings)
          const visibleTasks = dayTasks
          // Sort tasks by their final display time for rendering
          const homeArrivalMin = job ? timeToMin(job.end) + 60 : null
          const allSorted = [...visibleTasks].sort((a, b) => {
            const ta = taskTimes[a.id]
            const tb = taskTimes[b.id]
            if (!ta && !tb) return 0
            if (!ta) return 1
            if (!tb) return -1
            return normMin(timeToMin(ta)) - normMin(timeToMin(tb))
          })
          // Split: tasks at/after home arrival go below work block
          const displayTasks = job
            ? allSorted.filter(t => {
                const tm = taskTimes[t.id]
                return !tm || homeArrivalMin === null || normMin(timeToMin(tm)) < normMin(homeArrivalMin)
              })
            : allSorted
          const afterWorkTasks = job
            ? allSorted.filter(t => {
                const tm = taskTimes[t.id]
                return !!tm && homeArrivalMin !== null && normMin(timeToMin(tm)) >= normMin(homeArrivalMin)
              })
            : []
          const { lateArrival, arrivalTime } = getSleepTimes(job)

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
              <div className="px-5 pb-4">
                {job && (displayTasks.length > 0) && (
                  <div className="flex items-center gap-2 mb-3">
                    <Sun size={12} style={{ color: 'rgba(251,191,36,0.45)' }} />
                    <span className="text-[11px] font-semibold text-white/25 uppercase tracking-widest">
                      До работы
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {displayTasks.map(task => (
                    <ScheduleTaskCard
                      key={task.id}
                      task={task}
                      categories={categories}
                      time={taskTimes[task.id]}
                      onComplete={completeTask}
                      onUncomplete={uncompleteTask}
                      onUpdateTime={updateTaskTime}
                      onUpdateDuration={updateTaskDuration}
                      onUpdateTitle={updateTaskTitle}

                      onDelete={deleteTask}
                      isDragging={dragId === task.id}
                      isDragOver={dragOverId === task.id}
                      onDragStart={() => setDragId(task.id)}
                      onDragOver={() => setDragOverId(task.id)}
                      onDrop={() => handleDrop(task.id)}
                      onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                    />
                  ))}
                  {!job && (
                    <button
                      onClick={() => setAddingDay(dateStr)}
                      className="rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] group"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px dashed rgba(255,255,255,0.08)',
                        minHeight: '160px',
                      }}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>+</span>
                      <span className="text-xs font-semibold text-white/20 group-hover:text-white/40 transition-colors">Добавить</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Departure row */}
              {departureTime && (
                <div className="flex items-center gap-2.5 px-5 pb-3">
                  <span style={{ fontSize: '13px', flexShrink: 0 }}>🚌</span>
                  <span className="text-xs font-bold text-white/30">
                    Выезд {departureTime}
                  </span>
                  <span className="text-[10px] text-white/15 ml-1">({scheduleSettings.commuteToWorkMin} мин до работы)</span>
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
                    Дома в {arrivalTime ?? minToTime(timeToMin(job.end) + 60)}
                  </span>
                </div>
              )}

              {/* After-work tasks */}
              {job && (
                <div className="px-5 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Home size={12} style={{ color: 'rgba(255,255,255,0.25)' }} />
                    <span className="text-[11px] font-semibold text-white/25 uppercase tracking-widest">
                      После работы
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {afterWorkTasks.map(task => (
                      <ScheduleTaskCard
                        key={task.id}
                        task={task}
                        categories={categories}
                        time={taskTimes[task.id]}
                        onComplete={completeTask}
                        onUncomplete={uncompleteTask}
                        onUpdateTime={updateTaskTime}
                        onUpdateDuration={updateTaskDuration}
                        onUpdateTitle={updateTaskTitle}
  
                        onDelete={deleteTask}
                        isDragging={dragId === task.id}
                        isDragOver={dragOverId === task.id}
                        onDragStart={() => setDragId(task.id)}
                        onDragOver={() => setDragOverId(task.id)}
                        onDrop={() => handleDrop(task.id)}
                        onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                      />
                    ))}
                    <button
                      onClick={() => setAddingDay(dateStr)}
                      className="rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] group"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px dashed rgba(255,255,255,0.08)',
                        minHeight: '160px',
                      }}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>+</span>
                      <span className="text-xs font-semibold text-white/20 group-hover:text-white/40 transition-colors">Добавить</span>
                    </button>
                  </div>
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


            </div>
          )
        })}
      </div>

      {/* Empty state hint */}
      {dayJobs.length === 0 && tasks.length === 0 && (
        <div className="rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.12)' }}
        >
          <span className="text-lg">💡</span>
          <p className="text-sm text-muted-foreground">
            Добавь задачи вручную ниже или{' '}
            <Link href="/chat" className="text-primary hover:opacity-80 transition-opacity">настрой через помощника</Link>
            {' '}— он разложит всё по времени сам.
          </p>
        </div>
      )}
    </div>
  )
}



function ScheduleTaskCard({
  task,
  categories,
  time,
  onComplete,
  onUncomplete,
  onUpdateTime,
  onUpdateDuration,
  onUpdateTitle,
  onDelete,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  task: { id: string; track: string; title: string; completed: boolean; skipped: boolean; xp: number; difficulty?: number; timeStart?: string; durationMins?: number; emoji?: string }
  categories: Category[]
  time?: string | null
  onComplete: (id: string) => void
  onUncomplete: (id: string) => void
  onUpdateTime: (taskId: string, t: string | undefined) => void
  onUpdateDuration: (taskId: string, duration: number | undefined) => void
  onUpdateTitle: (taskId: string, title: string) => void
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
  const color = catColor(task.track, categories)
  const displayTime = time
  const dur = task.durationMins ?? DEFAULT_DURATION
  const endTime = displayTime ? minToTime(timeToMin(displayTime) + dur) : null

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
      className="group relative rounded-2xl overflow-hidden flex flex-col transition-all"
      style={{
        background: task.completed ? `linear-gradient(135deg, ${color}18, ${color}08)` : `${color}0d`,
        border: `1px solid ${task.completed ? color + '40' : isDragOver ? color + '60' : color + '25'}`,
        boxShadow: task.completed ? `0 0 16px ${color}15` : undefined,
        opacity: isDragging ? 0.35 : task.skipped ? 0.4 : 1,
      }}
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart?.() }}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver?.() }}
      onDrop={e => { e.preventDefault(); onDrop?.() }}
      onDragEnd={onDragEnd}
    >
      {/* Top row: emoji + actions */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '2rem', lineHeight: 1 }}>
            {task.emoji || catEmoji(task.track, categories)}
          </span>
          <span
            className="rounded-lg px-2 py-0.5 text-xs font-semibold"
            style={{ background: `${color}20`, color }}
          >
            {catLabel(task.track, categories)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Edit */}
          <button
            onClick={e => { e.stopPropagation(); setLocalTitle(task.title); setEditOpen(v => !v) }}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <Pencil size={12} />
          </button>
          {/* Delete */}
          <button
            onClick={e => { e.stopPropagation(); onDelete(task.id) }}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Title */}
      <p
        className="px-4 text-sm font-semibold leading-snug"
        style={{
          color: task.completed || task.skipped ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.85)',
          textDecoration: task.completed || task.skipped ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </p>

      {/* Tags row */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 pt-2 pb-3">
        {/* Time */}
        {displayTime && (
          <span className="rounded-lg px-2 py-0.5 text-xs font-bold tabular-nums" style={{ background: `${color}15`, color }}>
            {displayTime} — {endTime}
          </span>
        )}
        {/* XP */}
        <span className="rounded-lg px-2 py-0.5 text-xs font-bold" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
          {task.completed ? '⚡' : '+'}{calcXP(task.difficulty ?? 1.0, dur)} XP
        </span>
        {/* Duration */}
        {dur > 0 && (
          <span className="rounded-lg px-2 py-0.5 text-xs font-medium" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            {dur < 60 ? `${dur}м` : `${dur / 60}ч`}
          </span>
        )}
      </div>

      {/* Complete button */}
      <div className="px-4 pb-4">
        <button
          onClick={() => {
            if (task.skipped) return
            if (task.completed) { playClick(); onUncomplete(task.id) }
            else { playTaskComplete(); onComplete(task.id) }
          }}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all"
          style={{
            background: task.completed ? `${color}25` : 'rgba(255,255,255,0.05)',
            border: `1px solid ${task.completed ? color + '40' : 'rgba(255,255,255,0.08)'}`,
            color: task.completed ? color : 'rgba(255,255,255,0.35)',
          }}
        >
          {task.completed
            ? <><Check size={12} strokeWidth={3} /> Выполнено</>
            : <><div className="h-2 w-2 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} /> Отметить</>
          }
        </button>
      </div>

      {/* Edit panel */}
      {editOpen && (
        <div
          className="px-4 pb-4 space-y-2 border-t"
          style={{ borderColor: `${color}20` }}
          onClick={e => e.stopPropagation()}
        >
          <div className="pt-2">
            <label className="text-[10px] font-semibold uppercase tracking-wide block mb-1" style={{ color: `${color}80` }}>Название</label>
            <input
              value={localTitle}
              onChange={e => setLocalTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditOpen(false) }}
              className="w-full rounded-lg px-2.5 py-2 text-sm outline-none text-white"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}30` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide block mb-1" style={{ color: `${color}80` }}>Начало</label>
              <input type="time" defaultValue={displayTime ?? ''}
                className="w-full rounded-lg px-2.5 py-2 text-sm font-bold tabular-nums outline-none text-white"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}30`, colorScheme: 'dark' }}
                onBlur={e => onUpdateTime(task.id, e.target.value || undefined)}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide block mb-1" style={{ color: `${color}80` }}>Конец</label>
              <input type="time" defaultValue={endTime ?? ''}
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

