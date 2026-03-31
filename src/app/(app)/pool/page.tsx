'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Pencil, Trash2, Check, CalendarPlus, ChevronDown, ArrowLeft, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import type { TemplateTask } from '@/lib/types'

// ── Preset types (used inside card creation, not as standalone entities) ──────
const PRESETS = [
  {
    key: 'sport', label: 'Спорт', color: '#f87171', emoji: '🏃',
    emojis: ['🏋️', '🏃', '⚽', '🎯', '🏊', '🚴', '🥊', '🧘', '🏆', '🤸', '🎽', '🏅', '🏄', '🥅', '🎾', '🛹'],
    mottos: ['Каждая тренировка делает тебя сильнее!', 'Движение — жизнь!', 'Твоё тело скажет спасибо!', 'Боль временна, гордость — навсегда!', 'Сила воли растёт вместе с мышцами!'],
  },
  {
    key: 'study', label: 'Учёба', color: '#60a5fa', emoji: '📚',
    emojis: ['📚', '📖', '✏️', '🎓', '🔬', '💡', '📝', '🧮', '🖊️', '📐', '🔭', '📓', '🧪', '🗺️', '🖥️', '📑'],
    mottos: ['Знание — сила!', 'Каждая страница открывает новый мир!', 'Умный человек учится всю жизнь!', 'Сегодняшний труд — завтрашний успех!', 'Инвестируй в свой разум!'],
  },
  {
    key: 'work', label: 'Работа', color: '#818cf8', emoji: '💻',
    emojis: ['💼', '💻', '📊', '📈', '🖥️', '📋', '✉️', '🤝', '🏢', '⚙️', '📌', '🗂️', '🖨️', '📞', '⌨️', '🗃️'],
    mottos: ['Успех — сумма малых усилий!', 'Продуктивный день — шаг к мечте!', 'Ты строишь своё будущее прямо сейчас!', 'Фокус и дисциплина творят чудеса!', 'Каждая задача приближает к цели!'],
  },
  {
    key: 'rest', label: 'Отдых', color: '#34d399', emoji: '🛋️',
    emojis: ['🛋️', '🎮', '🎬', '🍵', '🎵', '🌙', '😴', '🏖️', '🧸', '🎭', '🍕', '🌊', '🎈', '🧩', '🌸', '📱'],
    mottos: ['Перезарядка — часть пути к успеху!', 'Хороший отдых = лучшая продуктивность!', 'Забота о себе — это мудрость!', 'Ты заслужил этот момент покоя!'],
  },
  {
    key: 'creative', label: 'Творчество', color: '#f472b6', emoji: '🎨',
    emojis: ['🎨', '🖌️', '✍️', '🎸', '📷', '🎭', '🎬', '🖼️', '🎤', '💃', '🎻', '🪄', '🖋️', '🎹', '🎙️', '🧶'],
    mottos: ['Твори — и мир станет лучше!', 'Каждая идея может изменить всё!', 'Ты создаёшь что-то уникальное!', 'Вдохновение рождается в действии!'],
  },
  {
    key: 'finance', label: 'Финансы', color: '#fbbf24', emoji: '💰',
    emojis: ['💰', '📊', '💳', '🏦', '💵', '📈', '🪙', '💎', '🤑', '📉', '🧾', '💹', '💱', '🏧', '📑', '🗓️'],
    mottos: ['Финансовая свобода начинается здесь!', 'Каждый рубль работает на твоё будущее!', 'Контроль финансов — контроль жизни!'],
  },
  {
    key: 'health', label: 'Здоровье', color: '#4ade80', emoji: '🥗',
    emojis: ['🥗', '🧘', '💊', '🏥', '🌿', '🥦', '💪', '🩺', '🧬', '🌱', '🍎', '🥕', '🧴', '🫀', '🫁', '🍵'],
    mottos: ['Здоровье — твой главный капитал!', 'Маленький шаг к здоровью каждый день!', 'Твоё тело — твой храм!', 'Береги себя — ты бесценен!'],
  },
  {
    key: 'other', label: 'Другое', color: '#94a3b8', emoji: '📋',
    emojis: ['📋', '⭐', '🎯', '🔑', '💫', '🗒️', '📌', '🔔', '✅', '🎲', '🔧', '🌟', '🔮', '🧩', '💬', '🎁'],
    mottos: ['Каждое дело важно — ты справишься!', 'Маленькие победы ведут к большим!', 'Главное — начать!'],
  },
] as const

type Preset = typeof PRESETS[number]

// ── Add-to-date dropdown ───────────────────────────────────────────────────────
function AddToDateButton({ onAdd, color }: { onAdd: (date: string) => void; color: string }) {
  const [open, setOpen] = useState(false)
  const [customDate, setCustomDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const today = format(new Date(), 'yyyy-MM-dd')
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')
  function add(date: string) { onAdd(date); setOpen(false) }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
      >
        <CalendarPlus size={14} />
        В расписание
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-11 z-30 w-48 rounded-2xl p-2 shadow-2xl"
          style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <button onClick={() => add(today)} className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-foreground hover:bg-white/5 transition-colors">Сегодня</button>
          <button onClick={() => add(tomorrow)} className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-foreground hover:bg-white/5 transition-colors">Завтра</button>
          <div className="mt-1 border-t border-white/5 pt-2 px-2 pb-1 space-y-1.5">
            <p className="text-xs text-muted-foreground px-1">Другая дата</p>
            <input
              type="date" value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              className="w-full rounded-lg px-2 py-1.5 text-xs text-foreground outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <button
              onClick={() => add(customDate)}
              className="w-full rounded-xl py-2 text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
            >
              Добавить
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Task card creation form (2 steps) ─────────────────────────────────────────
function TaskCardForm({
  initial,
  initialPresetKey,
  onSave,
  onCancel,
}: {
  initial?: Partial<TemplateTask & { presetKey: string; emoji: string }>
  initialPresetKey?: string
  onSave: (data: { title: string; emoji: string; durationMins: number; xp: number; weeklyFrequency: number; defaultTimeStart: string; preset: Preset }) => void
  onCancel: () => void
}) {
  const startPreset = PRESETS.find(p => p.key === (initial?.presetKey ?? initialPresetKey)) ?? null
  const [step, setStep] = useState<1 | 2>(startPreset ? 2 : 1)
  const [preset, setPreset] = useState<Preset | null>(startPreset)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? startPreset?.emoji ?? '📋')
  const DIFFICULTY_COEF_INV = [0, 0.75, 1.0, 1.25, 1.5, 2.0]
  const initDifficulty = initial?.xp
    ? Math.max(1, DIFFICULTY_COEF_INV.findIndex(c => Math.round(c * 25) === initial.xp) || 2)
    : 2
  const [difficulty, setDifficulty] = useState(initDifficulty)
  const [weeklyFrequency, setWeeklyFrequency] = useState(initial?.weeklyFrequency ?? 3)
  const [defaultTimeStart, setDefaultTimeStart] = useState(initial?.defaultTimeStart ?? '')
  const [durationMins, setDurationMins] = useState(initial?.durationMins && initial.durationMins > 0 ? initial.durationMins : 60)

  const DIFFICULTY_LABELS = ['', 'Легко', 'Нормально', 'Сложно', 'Хардкор', 'Легенда']
  const DIFFICULTY_COEF =   [0,  0.75,   1.0,         1.25,    1.5,       2.0]
  const xp = Math.round(DIFFICULTY_COEF[difficulty] * 25)

  function pickPreset(p: Preset) {
    setPreset(p)
    setEmoji(p.emoji)
    setStep(2)
  }

  function handleSave() {
    if (!title.trim() || !preset) return
    onSave({ title: title.trim(), emoji, durationMins, xp, weeklyFrequency, defaultTimeStart, preset })
  }

  // Step 1: pick type
  if (step === 1) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-foreground">Выбери тип задачи</p>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => pickPreset(p)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: `${p.color}12`, border: `1px solid ${p.color}35` }}
            >
              <span className="text-2xl shrink-0">{p.emoji}</span>
              <span className="text-base font-medium text-foreground">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Step 2: fill details
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> Назад
        </button>
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-1"
          style={{ background: `${preset!.color}15`, border: `1px solid ${preset!.color}30` }}
        >
          <span className="text-base">{preset!.emoji}</span>
          <span className="text-sm font-medium" style={{ color: preset!.color }}>{preset!.label}</span>
        </div>
      </div>

      {/* Emoji picker */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Иконка</p>
        <div className="grid grid-cols-8 gap-1.5">
          {preset!.emojis.map(e => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-all hover:bg-white/10"
              style={{
                background: emoji === e ? `${preset!.color}25` : 'transparent',
                outline: emoji === e ? `2px solid ${preset!.color}70` : 'none',
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Название задачи</p>
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel() }}
          placeholder="Например: Утренняя пробежка"
          maxLength={60}
          className="w-full rounded-xl px-4 py-3 text-base text-foreground outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </div>

      {/* Difficulty */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Сложность</p>
          <span className="rounded-lg px-2.5 py-1 text-sm font-bold" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
            +{xp} <span className="font-normal opacity-50 text-xs">XP/ч</span>
          </span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className="flex-1 flex flex-col items-center gap-1.5 rounded-xl py-2.5 transition-all hover:scale-[1.04]"
              style={{
                background: difficulty === d ? `${preset!.color}20` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${difficulty === d ? preset!.color + '50' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <span className="text-lg">{'⚡'.repeat(d === 1 ? 1 : d === 2 ? 1 : d === 3 ? 2 : d === 4 ? 3 : 3)}</span>
              <span className="text-[10px] font-semibold" style={{ color: difficulty === d ? preset!.color : 'rgba(255,255,255,0.3)' }}>
                {DIFFICULTY_LABELS[d]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Time + Duration */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Обычное время</p>
          <input
            type="time"
            value={defaultTimeStart}
            onChange={e => setDefaultTimeStart(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Длительность</p>
          <div className="grid grid-cols-3 gap-1">
            {[30, 45, 60, 90, 120, 150].map(m => (
              <button
                key={m}
                onClick={() => setDurationMins(m)}
                className="rounded-xl py-2 text-xs font-semibold transition-all"
                style={{
                  background: durationMins === m ? `${preset!.color}25` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${durationMins === m ? preset!.color + '60' : 'rgba(255,255,255,0.08)'}`,
                  color: durationMins === m ? preset!.color : 'rgba(255,255,255,0.35)',
                }}
              >
                {m < 60 ? `${m}м` : `${m / 60}ч`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly frequency */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Раз в неделю</p>
          <span className="text-sm font-semibold" style={{ color: preset!.color }}>
            {weeklyFrequency === 7 ? 'каждый день' : `${weeklyFrequency}×`}
          </span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map(f => (
            <button
              key={f}
              onClick={() => setWeeklyFrequency(f)}
              className="flex-1 rounded-xl py-2 text-sm font-semibold transition-all hover:scale-[1.06]"
              style={{
                background: weeklyFrequency === f ? `${preset!.color}25` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${weeklyFrequency === f ? preset!.color + '60' : 'rgba(255,255,255,0.08)'}`,
                color: weeklyFrequency === f ? preset!.color : 'rgba(255,255,255,0.35)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex-1 rounded-xl py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${preset!.color}, ${preset!.color}99)` }}
        >
          Сохранить карточку
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl px-5 py-3 text-base text-muted-foreground hover:text-foreground transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          Отмена
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PoolPage() {
  const {
    categories, addCategory,
    templateTasks, addTemplateTask, updateTemplateTask, deleteTemplateTask,
    addTask,
  } = useStore()

  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)

  function resolveOrCreateCategory(preset: Preset) {
    let cat = categories.find(c => c.label === preset.label && c.color === preset.color)
    if (!cat) {
      addCategory({ label: preset.label, color: preset.color, emoji: preset.emoji, mottos: [...preset.mottos] })
      cat = useStore.getState().categories.find(c => c.label === preset.label && c.color === preset.color)!
    }
    return cat
  }

  function handleSave(data: { title: string; emoji: string; durationMins: number; xp: number; weeklyFrequency: number; defaultTimeStart: string; preset: Preset }) {
    const cat = resolveOrCreateCategory(data.preset)
    addTemplateTask({ title: data.title, categoryId: cat.id, durationMins: data.durationMins, xp: data.xp, weeklyFrequency: data.weeklyFrequency, defaultTimeStart: data.defaultTimeStart || undefined })
    setCreating(false)
  }

  function handleAddToDate(tmpl: TemplateTask, date: string) {
    const cat = categories.find(c => c.id === tmpl.categoryId)
    if (!cat) return
    addTask({ title: tmpl.title, track: cat.id, date, isRecurring: false, xp: tmpl.xp, durationMins: tmpl.durationMins, emoji: cat.emoji })
    setFlashId(tmpl.id)
    setTimeout(() => setFlashId(null), 1500)
  }

  // Resolve category info for a templateTask
  function resolveCard(tmpl: TemplateTask) {
    const cat = categories.find(c => c.id === tmpl.categoryId)
    const preset = PRESETS.find(p => p.label === cat?.label && p.color === cat?.color)
    return { cat, preset, color: cat?.color ?? '#818cf8' }
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (templateTasks.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-8 text-center">
        <style>{`@keyframes wave{0%,100%{transform:rotate(0deg)}20%{transform:rotate(-15deg)}40%{transform:rotate(15deg)}60%{transform:rotate(-10deg)}80%{transform:rotate(10deg)}}`}</style>
        {creating && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setCreating(false) }}
          >
            <div
              className="w-full max-w-lg rounded-2xl p-6 shadow-2xl"
              style={{ background: '#0d0b18', boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset, 0 24px 60px rgba(0,0,0,0.6)' }}
            >
              <TaskCardForm onSave={handleSave} onCancel={() => setCreating(false)} />
            </div>
          </div>
        )}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl text-4xl"
          style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(167,139,250,0.1))' }}
        >
          <span style={{ display: 'inline-block', animation: 'wave 2s ease-in-out infinite', transformOrigin: '70% 70%' }}>👋</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold text-foreground">Добавь свои активности</h2>
          <p className="mt-3 max-w-sm text-muted-foreground leading-relaxed">
            Зал, учёба, языки — создай карточку раз, и добавляй в расписание одним кликом когда угодно.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-2xl px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
        >
          <Plus size={18} /> Создать карточку
        </button>
      </div>
    )
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  const modalTask = editingId ? templateTasks.find(t => t.id === editingId) : null
  const modalPreset = modalTask ? PRESETS.find(p => p.label === categories.find(c => c.id === modalTask.categoryId)?.label) : null
  const showModal = creating || !!editingId

  return (
    <div className="p-6 space-y-6">

      {/* Modal overlay */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setCreating(false); setEditingId(null) } }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 shadow-2xl"
            style={{ background: '#0d0b18', boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset, 0 24px 60px rgba(0,0,0,0.6)' }}
          >
            <TaskCardForm
              initial={modalTask ? { ...modalTask, presetKey: modalPreset?.key } : undefined}
              initialPresetKey={modalPreset?.key}
              onSave={(data) => {
                const c = resolveOrCreateCategory(data.preset)
                if (editingId && modalTask) {
                  updateTemplateTask(editingId, { title: data.title, categoryId: c.id, durationMins: data.durationMins, xp: data.xp })
                  setEditingId(null)
                } else {
                  handleSave(data)
                }
              }}
              onCancel={() => { setCreating(false); setEditingId(null) }}
            />
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Активности</h1>
          <p className="text-base text-muted-foreground mt-1">Готовые карточки — добавляй в расписание одним кликом</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0"
          style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
        >
          <Plus size={16} /> Новая карточка
        </button>
      </div>

      {/* Task cards grid */}
      {templateTasks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templateTasks.map(tmpl => {
            const { cat, color } = resolveCard(tmpl)
            const flashed = flashId === tmpl.id

            return (
              <div
                key={tmpl.id}
                className="group relative flex flex-col gap-4 rounded-2xl p-5 transition-all"
                style={{
                  background: `${color}0d`,
                  border: `1px solid ${color}${flashed ? '60' : '25'}`,
                  boxShadow: flashed ? `0 0 20px ${color}20` : undefined,
                }}
              >
                {/* Edit / Delete */}
                <div className="absolute top-3 right-3 hidden group-hover:flex gap-1">
                  <button
                    onClick={() => setEditingId(tmpl.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => deleteTemplateTask(tmpl.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Emoji + type badge */}
                <div className="flex items-start gap-3">
                  <span className="text-4xl leading-none">{cat?.emoji ?? '📋'}</span>
                  {cat && (
                    <span
                      className="rounded-lg px-2 py-0.5 text-xs font-semibold"
                      style={{ background: `${color}20`, color }}
                    >
                      {cat.label}
                    </span>
                  )}
                </div>

                {/* Title */}
                <p className="text-base font-semibold text-foreground leading-snug">{tmpl.title}</p>

                {/* Duration + XP + Add button */}
                <div className="mt-auto space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="rounded-lg px-2.5 py-1 text-sm font-medium"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                    >
                      {['', 'Легко', 'Нормально', 'Сложно', 'Хардкор', 'Легенда'][Math.round(tmpl.xp / 25)] ?? 'Нормально'}
                    </span>
                    <span
                      className="rounded-lg px-2.5 py-1 text-sm font-bold"
                      style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}
                    >
                      +{tmpl.xp} XP
                    </span>
                    {tmpl.weeklyFrequency && (
                      <span
                        className="rounded-lg px-2.5 py-1 text-sm font-medium"
                        style={{ background: `${color}15`, color }}
                      >
                        {tmpl.weeklyFrequency === 7 ? 'каждый день' : `${tmpl.weeklyFrequency}× в нед.`}
                      </span>
                    )}
                    {tmpl.durationMins > 0 && (
                      <span className="rounded-lg px-2.5 py-1 text-sm font-medium" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                        {tmpl.durationMins < 60 ? `${tmpl.durationMins}м` : `${tmpl.durationMins / 60}ч`}
                      </span>
                    )}
                    {tmpl.defaultTimeStart && (
                      <span className="rounded-lg px-2.5 py-1 text-sm font-medium" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                        {tmpl.defaultTimeStart}
                      </span>
                    )}
                  </div>

                  {flashed ? (
                    <div
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold"
                      style={{ background: `${color}20`, color }}
                    >
                      <Check size={15} /> Добавлено в расписание!
                    </div>
                  ) : (
                    <AddToDateButton color={color} onAdd={date => handleAddToDate(tmpl, date)} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
