// Track is now a free string — no longer a closed union
export type Track = string

export type Category = {
  id: string      // used as task.track value
  label: string
  color: string   // hex
  emoji: string
  mottos?: string[] // motivating messages shown in task cards
}

export type TemplateTask = {
  id: string
  title: string
  categoryId: string
  durationMins: number
  xp: number
  emoji?: string
  weeklyFrequency?: number   // 1–7 days per week
  defaultTimeStart?: string  // "HH:MM"
}

export type Task = {
  id: string
  title: string
  track: Track
  date: string // YYYY-MM-DD
  completed: boolean
  skipped: boolean
  isRecurring: boolean
  recurringType?: string
  xp: number
  difficulty?: number
  durationMins?: number
  timeStart?: string
  sortOrder?: number
  emoji?: string
}

// XP = round(difficulty × durationMins × 25 / 60)
export function calcXP(difficulty: number, durationMins: number): number {
  return Math.round(difficulty * durationMins * 25 / 60)
}

export type StreakState = {
  current: number
  longest: number
  lastActiveDate: string
  freezeUsedMonth: string | null
}

export type DayJob = {
  date: string
  start: string
  end: string
  label?: string
}

export type JournalEntry = {
  id: string
  date: string
  text: string
  updatedAt: string
}

export type ScheduleSettings = {
  wakeTime: string          // "HH:MM", default "07:00"
  commuteToWorkMin: number  // minutes to get to work, default 30
  prepMin: number           // morning prep time in minutes, default 60
  departBufMin: number      // buffer before departure, default 10
}

export const DEFAULT_SCHEDULE_SETTINGS: ScheduleSettings = {
  wakeTime: '07:00',
  commuteToWorkMin: 30,
  prepMin: 60,
  departBufMin: 10,
}

export type PlanStep = {
  id: string
  text: string
  pinned: boolean
}

export type Plan = {
  id: string
  steps: PlanStep[]
  startDate: string   // YYYY-MM-DD
  endDate?: string
  completed: boolean
  createdAt: string
}

export type AppState = {
  userName: string
  password: string
  avatarUrl: string
  apiKey: string
  scheduleSettings: ScheduleSettings
  tasks: Task[]
  workDays: string[]
  dayJobs: DayJob[]
  streak: StreakState
  trackXP: Record<string, number>
  onboardingDone: boolean
  chatHistory: { role: 'user' | 'assistant'; content: string }[]
  dailyXP: Record<string, Record<string, number>>
  achievements: string[]
  journalEntries: JournalEntry[]
  journalProfiles: Record<string, { text: string; updatedAt: string }>
  categories: Category[]
  templateTasks: TemplateTask[]
  plans: Plan[]
}

// ── Legacy fallbacks (for users who have old data with hardcoded tracks) ──
export const TRACK_COLORS: Record<string, string> = {
  ai: '#818cf8',
  design: '#f472b6',
  selfdevelopment: '#34d399',
  mediabuy: '#fbbf24',
  english: '#60a5fa',
  polish: '#a78bfa',
  gym: '#f87171',
}

export const TRACK_LABELS: Record<string, string> = {
  ai: 'AI',
  design: 'Design',
  selfdevelopment: 'Self-development',
  mediabuy: 'Media buying',
  english: 'English',
  polish: 'Polish',
  gym: 'Gym',
}

// ── Preset label translations (labels are stored in Russian in state) ──
const PRESET_LABEL_TRANSLATIONS: Record<string, { en: string; uk: string }> = {
  'Спорт':      { en: 'Sport',    uk: 'Спорт' },
  'Учёба':      { en: 'Study',    uk: 'Навчання' },
  'Работа':     { en: 'Work',     uk: 'Робота' },
  'Отдых':      { en: 'Rest',     uk: 'Відпочинок' },
  'Творчество': { en: 'Creative', uk: 'Творчість' },
  'Финансы':    { en: 'Finance',  uk: 'Фінанси' },
  'Здоровье':   { en: 'Health',   uk: 'Здоров\'я' },
  'Другое':     { en: 'Other',    uk: 'Інше' },
}

export function translateCatLabel(label: string, lang: string): string {
  const tr = PRESET_LABEL_TRANSLATIONS[label]
  if (!tr) return label
  return lang === 'uk' ? tr.uk : tr.en
}

// ── Dynamic helpers — check user categories first, fall back to legacy ──
export function catColor(track: string, categories: Category[]): string {
  return categories.find(c => c.id === track)?.color ?? TRACK_COLORS[track] ?? '#818cf8'
}

export function catLabel(track: string, categories: Category[]): string {
  return categories.find(c => c.id === track)?.label ?? TRACK_LABELS[track] ?? track
}

export function catEmoji(track: string, categories: Category[]): string {
  const LEGACY_EMOJI: Record<string, string> = {
    ai: '🤖', design: '🎨', selfdevelopment: '🧠',
    mediabuy: '📈', english: '🗣️', polish: '✍️', gym: '💪',
  }
  return categories.find(c => c.id === track)?.emoji ?? LEGACY_EMOJI[track] ?? '📋'
}
