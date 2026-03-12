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
  difficulty?: number  // multiplier: 0.5=easy, 1.0=average, 1.5=hard
  durationMins?: number // planned duration in minutes
  timeStart?: string // user-set override, e.g. "14:00"
  sortOrder?: number  // user-set position within the day
  duration?: number   // user-set duration override in minutes (ai/design: 120/240/360)
}

// XP = round(difficulty × durationMins × 25 / 120)
// difficulty=1.0 + 60min = ~13 XP (calibration target)
export function calcXP(difficulty: number, durationMins: number): number {
  return Math.round(difficulty * durationMins * 25 / 120)
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

export type JournalEntry = {
  id: string
  date: string    // YYYY-MM-DD
  text: string
  updatedAt: string  // ISO timestamp
}

export type VacancyStatus = 'saved' | 'applied' | 'replied' | 'interview' | 'offer' | 'rejected'

export type Vacancy = {
  id: string
  company: string
  position: string
  sphere: string    // e.g. "Дизайн", "AI"
  color: string     // hex color for sphere
  status: VacancyStatus
  url?: string
  salary?: string
  cvId?: string     // ID of CVTemplate used
  coverLetter?: string
  appliedAt?: string  // YYYY-MM-DD
  notes?: string
  feedback?: string
  lessons?: string    // what could be improved / mistake made
  createdAt: string   // ISO timestamp
}

export type CVTemplate = {
  id: string
  title: string     // e.g. "CV Продакт-дизайнер v2"
  content: string   // full CV / cover letter text
  createdAt: string
}

export type Purchase = {
  id: string
  itemId: string
  itemTitle: string
  price: number
  purchasedAt: string  // ISO
  usedAt?: string      // ISO, set when used
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
  journalEntries: JournalEntry[]
  journalProfiles: Record<string, { text: string; updatedAt: string }>
  vacancies: Vacancy[]
  cvTemplates: CVTemplate[]
  purchases: Purchase[]
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

// Legacy fallback XP (used only if difficulty/durationMins not set)
export const TRACK_XP: Record<Track, number> = {
  ai: 28,
  design: 21,
  selfdevelopment: 13,
  mediabuy: 14,
  english: 9,
  polish: 0,  // Polish XP is dynamic — see schedule.ts
  gym: 9,
}
