export type Track = 'ai' | 'design' | 'selfdevelopment' | 'mediabuy' | 'english' | 'polish' | 'gym'

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
}

export type StreakState = {
  current: number
  longest: number
  lastActiveDate: string
  freezeUsedMonth: string | null
}

// Рабочие часы в маке для конкретной даты
export type DayJob = {
  date: string   // YYYY-MM-DD
  start: string  // "10:00"
  end: string    // "19:00"
  label?: string
}

export type AppState = {
  tasks: Task[]
  workDays: string[]  // дни с учебными задачами
  dayJobs: DayJob[]   // рабочие часы по датам
  streak: StreakState
  trackXP: Record<Track, number>
  onboardingDone: boolean
  chatHistory: { role: 'user' | 'assistant'; content: string }[]
  // Analytics data
  dailyXP: Record<string, Record<Track, number>>  // YYYY-MM-DD -> {track: xp}
  achievements: string[]  // list of earned achievement IDs
}

export const TRACK_COLORS: Record<Track, string> = {
  ai: '#818cf8',
  design: '#f472b6',
  selfdevelopment: '#34d399',
  mediabuy: '#fbbf24',
  english: '#60a5fa',
  polish: '#a78bfa',
  gym: '#f87171',
}

export const TRACK_LABELS: Record<Track, string> = {
  ai: 'AI',
  design: 'Дизайн',
  selfdevelopment: 'Саморазвитие',
  mediabuy: 'Медиабаинг',
  english: 'Английский',
  polish: 'Польский',
  gym: 'Зал',
}

// Polish XP handled specially: 30 for 1h, 15 for 30min
// See schedule.ts where polish tasks are generated with dynamic XP
export const TRACK_XP: Record<Track, number> = {
  ai: 30,
  design: 25,
  selfdevelopment: 20,
  mediabuy: 25,
  english: 20,
  polish: 0,  // Polish XP is dynamic — see schedule.ts (15 or 30)
  gym: 15,
}
