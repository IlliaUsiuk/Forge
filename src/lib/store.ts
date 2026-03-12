import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'

// Check for new achievements
function checkAchievements(state: AppState, newAchievements: string[]): string[] {
  const achievements = [...newAchievements]

  // Streak milestones
  if (state.streak.current === 7 && !achievements.includes('streak-7')) achievements.push('streak-7')
  if (state.streak.current === 30 && !achievements.includes('streak-30')) achievements.push('streak-30')
  if (state.streak.current === 100 && !achievements.includes('streak-100')) achievements.push('streak-100')
  if (state.streak.longest === 365 && !achievements.includes('streak-365')) achievements.push('streak-365')

  // Track milestones
  Object.entries(state.trackXP).forEach(([track, xp]) => {
    if (xp >= 100 && !achievements.includes(`${track}-100`)) achievements.push(`${track}-100`)
    if (xp >= 1000 && !achievements.includes(`${track}-1000`)) achievements.push(`${track}-1000`)
  })

  // Total XP milestones
  const totalXP = Object.values(state.trackXP).reduce((a, b) => a + b, 0)
  if (totalXP >= 500 && !achievements.includes('total-500')) achievements.push('total-500')
  if (totalXP >= 5000 && !achievements.includes('total-5000')) achievements.push('total-5000')
  if (totalXP >= 10000 && !achievements.includes('total-10000')) achievements.push('total-10000')

  // Task completion milestones
  const completedCount = state.tasks.filter(t => t.completed).length
  if (completedCount >= 1 && !achievements.includes('first-task')) achievements.push('first-task')
  if (completedCount >= 100 && !achievements.includes('tasks-100')) achievements.push('tasks-100')
  if (completedCount >= 500 && !achievements.includes('tasks-500')) achievements.push('tasks-500')

  // All tracks milestone
  const tracksWithXP = Object.values(state.trackXP).filter(xp => xp > 0).length
  if (tracksWithXP === 7 && !achievements.includes('all-tracks')) achievements.push('all-tracks')

  return achievements
}
import type { Task, Track, AppState, StreakState, DayJob, JournalEntry, Vacancy, CVTemplate, Purchase } from './types'
import { TRACK_XP, calcXP } from './types'
import { generateRecurringTasks } from './schedule'
import { processStreakOnOpen } from './streak'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

const initialStreak: StreakState = {
  current: 0,
  longest: 0,
  lastActiveDate: '',
  freezeUsedMonth: null,
}

const initialTrackXP: Record<Track, number> = {
  ai: 0, design: 0, selfdevelopment: 0,
  mediabuy: 0, english: 0, polish: 0, gym: 0,
}

type Store = AppState & {
  completeTask: (taskId: string) => void
  uncompleteTask: (taskId: string) => void
  skipTask: (taskId: string) => void
  deleteTask: (taskId: string) => void
  updateTaskTime: (taskId: string, timeStart: string | undefined) => void
  updateTaskDuration: (taskId: string, duration: number | undefined) => void
  updateTaskTitle: (taskId: string, title: string) => void
  updateTaskRecurringType: (taskId: string, recurringType: string | undefined) => void
  reorderTask: (taskId: string, direction: 'up' | 'down') => void
  moveTaskTo: (taskId: string, targetTaskId: string) => void
  addTask: (task: Omit<Task, 'id' | 'completed' | 'skipped'>) => void
  updateSchedule: (month: string, workDays: string[]) => void
  setDayJobs: (jobs: DayJob[]) => void
  deleteRecurringSeries: (track: Track) => void
  addChatMessage: (msg: ChatMessage) => void
  clearChatHistory: () => void
  setOnboardingDone: () => void
  processOnOpen: () => void
  clearOldTasks: (beforeDate: string) => void
  saveJournalEntry: (date: string, text: string) => void
  deleteJournalEntry: (id: string) => void
  setJournalProfile: (month: string, text: string) => void
  addVacancy: (v: Omit<Vacancy, 'id' | 'createdAt'>) => void
  updateVacancy: (id: string, changes: Partial<Vacancy>) => void
  deleteVacancy: (id: string) => void
  addCVTemplate: (t: Omit<CVTemplate, 'id' | 'createdAt'>) => void
  updateCVTemplate: (id: string, changes: Partial<CVTemplate>) => void
  deleteCVTemplate: (id: string) => void
  buyItem: (item: { id: string; title: string; price: number }) => boolean
  useItem: (purchaseId: string) => void
  sellItem: (purchaseId: string) => void
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      tasks: [],
      workDays: [],
      dayJobs: [],
      streak: initialStreak,
      trackXP: { ...initialTrackXP },
      onboardingDone: false,
      chatHistory: [],
      dailyXP: {},
      achievements: [],
      journalEntries: [],
      journalProfiles: {},
      vacancies: [],
      cvTemplates: [],
      purchases: [],

      completeTask: (taskId) => {
        const state = get()
        const task = state.tasks.find(t => t.id === taskId)
        if (!task || task.completed || task.skipped) return
        const today = format(new Date(), 'yyyy-MM-dd')
        set(s => {
          const updatedTasks = s.tasks.map(t =>
            t.id === taskId ? { ...t, completed: true } : t
          )
          const newTrackXP = { ...s.trackXP }
          // Use task.xp directly (handles dynamic XP for polish)
          newTrackXP[task.track] = (newTrackXP[task.track] || 0) + task.xp
          let newStreak = { ...s.streak }
          if (task.date === today) {
            const hadCompletedBefore = s.tasks.some(
              t => t.id !== taskId && t.date === today && t.completed && !t.skipped
            )
            if (!hadCompletedBefore) {
              const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')
              if (
                newStreak.lastActiveDate === yesterday ||
                newStreak.lastActiveDate === today ||
                newStreak.lastActiveDate === ''
              ) {
                if (newStreak.lastActiveDate !== today) {
                  newStreak.current += 1
                  newStreak.lastActiveDate = today
                  if (newStreak.current > newStreak.longest) {
                    newStreak.longest = newStreak.current
                  }
                }
              }
            }
          }
          return {
            tasks: updatedTasks,
            trackXP: newTrackXP,
            streak: newStreak,
            dailyXP: {
              ...s.dailyXP,
              [today]: {
                ...(s.dailyXP[today] || {}),
                [task.track]: ((s.dailyXP[today]?.[task.track] || 0) + task.xp),
              },
            },
            achievements: checkAchievements({
              ...s,
              trackXP: newTrackXP,
              streak: newStreak,
            }, s.achievements),
          }
        })
      },

      uncompleteTask: (taskId) => {
        const state = get()
        const task = state.tasks.find(t => t.id === taskId)
        if (!task || !task.completed) return
        const today = format(new Date(), 'yyyy-MM-dd')
        set(s => {
          const updatedTasks = s.tasks.map(t =>
            t.id === taskId ? { ...t, completed: false } : t
          )
          const newTrackXP = { ...s.trackXP }
          // Use task.xp directly (handles dynamic XP for polish)
          newTrackXP[task.track] = Math.max(0, (newTrackXP[task.track] || 0) - task.xp)
          return {
            tasks: updatedTasks,
            trackXP: newTrackXP,
            dailyXP: task.date === today ? {
              ...s.dailyXP,
              [today]: {
                ...(s.dailyXP[today] || {}),
                [task.track]: Math.max(0, (s.dailyXP[today]?.[task.track] || 0) - task.xp),
              },
            } : s.dailyXP,
          }
        })
      },

      skipTask: (taskId) => {
        set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? { ...t, skipped: true } : t) }))
      },

      deleteTask: (taskId) => {
        set(s => ({ tasks: s.tasks.filter(t => t.id !== taskId) }))
      },

      updateTaskDuration: (taskId, duration) => {
        set(s => ({
          tasks: s.tasks.map(t => {
            if (t.id !== taskId) return t
            const newDuration = duration ?? t.durationMins
            const xp = newDuration ? calcXP(t.difficulty ?? 1.0, newDuration) : t.xp
            return { ...t, duration, xp }
          })
        }))
      },
      updateTaskTitle: (taskId, title) => {
        set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? { ...t, title } : t) }))
      },
      updateTaskRecurringType: (taskId, recurringType) => {
        set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? { ...t, recurringType } : t) }))
      },
      updateTaskTime: (taskId, timeStart) => {
        set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? { ...t, timeStart } : t) }))
      },

      reorderTask: (taskId, direction) => {
        set(s => {
          const task = s.tasks.find(t => t.id === taskId)
          if (!task) return s
          // Get all tasks for the same day, sorted by current order
          const TRACK_ORDER: Record<string, number> = {
            english: 1, polish: 2, selfdevelopment: 3, ai: 4, design: 5, mediabuy: 6, gym: 7,
          }
          const dayTasks = s.tasks
            .filter(t => t.date === task.date)
            .sort((a, b) => (a.sortOrder ?? TRACK_ORDER[a.track] ?? 99) - (b.sortOrder ?? TRACK_ORDER[b.track] ?? 99))
          const idx = dayTasks.findIndex(t => t.id === taskId)
          const swapIdx = direction === 'up' ? idx - 1 : idx + 1
          if (swapIdx < 0 || swapIdx >= dayTasks.length) return s
          // Assign sequential sortOrder to all day tasks, then swap
          const ordered = dayTasks.map((t, i) => ({ ...t, sortOrder: i }))
          ordered[idx].sortOrder = swapIdx
          ordered[swapIdx].sortOrder = idx
          const updatedMap = Object.fromEntries(ordered.map(t => [t.id, t.sortOrder]))
          return { tasks: s.tasks.map(t => t.date === task.date ? { ...t, sortOrder: updatedMap[t.id] ?? t.sortOrder } : t) }
        })
      },

      moveTaskTo: (taskId, targetTaskId) => {
        set(s => {
          const task = s.tasks.find(t => t.id === taskId)
          if (!task) return s
          const TRACK_ORD: Record<string, number> = { english: 1, polish: 2, selfdevelopment: 3, ai: 4, design: 5, mediabuy: 6, gym: 7 }
          const dayTasks = s.tasks
            .filter(t => t.date === task.date)
            .sort((a, b) => (a.sortOrder ?? TRACK_ORD[a.track] ?? 99) - (b.sortOrder ?? TRACK_ORD[b.track] ?? 99))
          const fromIdx = dayTasks.findIndex(t => t.id === taskId)
          const toIdx = dayTasks.findIndex(t => t.id === targetTaskId)
          if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return s
          const reordered = [...dayTasks]
          const [moved] = reordered.splice(fromIdx, 1)
          reordered.splice(toIdx, 0, moved)
          const updatedMap = Object.fromEntries(reordered.map((t, i) => [t.id, i]))
          return { tasks: s.tasks.map(t => t.date === task.date ? { ...t, sortOrder: updatedMap[t.id] ?? t.sortOrder } : t) }
        })
      },

      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          completed: false,
          skipped: false,
        }
        set(s => ({ tasks: [...s.tasks, newTask] }))
      },

      updateSchedule: (month, newWorkDays) => {
        set(s => {
          // Keep non-recurring tasks AND already completed/skipped recurring tasks from this month
          // so that execution history is not lost when schedule is regenerated
          const keptTasks = s.tasks.filter(t =>
            !(t.isRecurring && t.date.startsWith(month)) ||
            t.completed || t.skipped
          )
          const otherWorkDays = s.workDays.filter(d => !d.startsWith(month))
          const allWorkDays = [...otherWorkDays, ...newWorkDays]
          const macDays = new Set(s.dayJobs.map(j => j.date))
          const macDaysInMonth = [...macDays].filter(d => d.startsWith(month))
          const allDaysForGen = [...new Set([...newWorkDays, ...macDaysInMonth])]
          // keptTasks includes completed recurring tasks — alreadyExists() will skip them
          const generated = generateRecurringTasks(allDaysForGen, keptTasks, macDays)
          return { workDays: allWorkDays, tasks: [...keptTasks, ...generated], onboardingDone: true }
        })
      },

      setDayJobs: (jobs) => {
        set(s => {
          const dates = new Set(jobs.map(j => j.date))
          const kept = s.dayJobs.filter(j => !dates.has(j.date))
          const newDayJobs = [...kept, ...jobs]
          const newMacDays = new Set(newDayJobs.map(j => j.date))

          // Regenerate recurring tasks for affected months
          const affectedMonths = new Set([...dates].map(d => d.slice(0, 7)))
          let tasks = s.tasks
          for (const month of affectedMonths) {
            const monthWorkDays = s.workDays.filter(d => d.startsWith(month))
            if (monthWorkDays.length === 0) continue
            // Keep completed/skipped recurring tasks — don't lose execution history
            const keptTasks = tasks.filter(t =>
              !(t.isRecurring && t.date.startsWith(month)) ||
              t.completed || t.skipped
            )
            const macDaysInMonth = [...newMacDays].filter(d => d.startsWith(month))
            const allDaysForGen = [...new Set([...monthWorkDays, ...macDaysInMonth])]
            const generated = generateRecurringTasks(allDaysForGen, keptTasks, newMacDays)
            tasks = [...keptTasks, ...generated]
          }

          return { dayJobs: newDayJobs, tasks, onboardingDone: true }
        })
      },

      deleteRecurringSeries: (track) => {
        set(s => ({ tasks: s.tasks.filter(t => !(t.isRecurring && t.track === track)) }))
      },

      addChatMessage: (msg) => {
        set(s => ({ chatHistory: [...s.chatHistory, msg] }))
      },

      clearChatHistory: () => set({ chatHistory: [] }),
      setOnboardingDone: () => set({ onboardingDone: true }),

      clearOldTasks: (beforeDate) => {
        set(s => ({
          tasks: s.tasks.filter(t => t.date >= beforeDate),
          workDays: s.workDays.filter(d => d >= beforeDate),
          dayJobs: s.dayJobs.filter(j => j.date >= beforeDate),
        }))
      },

      saveJournalEntry: (date, text) => {
        set(s => {
          const existing = s.journalEntries.find(e => e.date === date)
          if (existing) {
            return { journalEntries: s.journalEntries.map(e => e.id === existing.id ? { ...e, text, updatedAt: new Date().toISOString() } : e) }
          }
          const entry: JournalEntry = { id: `journal-${date}`, date, text, updatedAt: new Date().toISOString() }
          return { journalEntries: [...s.journalEntries, entry] }
        })
      },
      deleteJournalEntry: (id) => {
        set(s => ({ journalEntries: s.journalEntries.filter(e => e.id !== id) }))
      },

      setJournalProfile: (month, text) => {
        set(s => ({
          journalProfiles: {
            ...s.journalProfiles,
            [month]: { text, updatedAt: new Date().toISOString() },
          },
        }))
      },

      addVacancy: (v) => {
        const vacancy: Vacancy = { ...v, id: `vac-${Date.now()}`, createdAt: new Date().toISOString() }
        set(s => ({ vacancies: [...s.vacancies, vacancy] }))
      },
      updateVacancy: (id, changes) => {
        set(s => ({ vacancies: s.vacancies.map(v => v.id === id ? { ...v, ...changes } : v) }))
      },
      deleteVacancy: (id) => {
        set(s => ({ vacancies: s.vacancies.filter(v => v.id !== id) }))
      },
      addCVTemplate: (t) => {
        const cv: CVTemplate = { ...t, id: `cv-${Date.now()}`, createdAt: new Date().toISOString() }
        set(s => ({ cvTemplates: [...s.cvTemplates, cv] }))
      },
      updateCVTemplate: (id, changes) => {
        set(s => ({ cvTemplates: s.cvTemplates.map(c => c.id === id ? { ...c, ...changes } : c) }))
      },
      deleteCVTemplate: (id) => {
        set(s => ({ cvTemplates: s.cvTemplates.filter(c => c.id !== id) }))
      },

      buyItem: (item) => {
        const state = get()
        const totalXP = Object.values(state.trackXP).reduce((a, b) => a + b, 0)
        const spentXP = state.purchases.reduce((s, p) => s + p.price, 0)
        if (totalXP - spentXP < item.price) return false
        const purchase: Purchase = {
          id: `purchase-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          itemId: item.id,
          itemTitle: item.title,
          price: item.price,
          purchasedAt: new Date().toISOString(),
        }
        set(s => ({ purchases: [...s.purchases, purchase] }))
        return true
      },

      useItem: (purchaseId) => {
        set(s => ({
          purchases: s.purchases.map(p =>
            p.id === purchaseId ? { ...p, usedAt: new Date().toISOString() } : p
          ),
        }))
      },

      sellItem: (purchaseId) => {
        set(s => ({ purchases: s.purchases.filter(p => p.id !== purchaseId) }))
      },

      processOnOpen: () => {
        const state = get()
        const today = format(new Date(), 'yyyy-MM-dd')
        if (!state.streak.lastActiveDate) return
        const newStreak = processStreakOnOpen(state.streak, state.tasks, today)
        if (
          newStreak.current !== state.streak.current ||
          newStreak.longest !== state.streak.longest ||
          newStreak.freezeUsedMonth !== state.streak.freezeUsedMonth
        ) {
          set({ streak: newStreak })
        }
      },
    }),
    {
      name: 'personal-dashboard-storage',
      version: 3,
      migrate: (persisted: unknown, fromVersion: number) => {
        let state = persisted as AppState & { purchases?: Purchase[] }
        if (fromVersion < 2) {
          // Migrate to new XP formula: difficulty × durationMins × 25/120
          const XP_MAP: Record<string, { difficulty: number; durationMins: number }> = {
            'ai-daily':              { difficulty: 1.1, durationMins: 120 },
            'design-daily':          { difficulty: 1.1, durationMins: 90  },
            'mediabuy-daily':        { difficulty: 1.1, durationMins: 60  },
            'english-homework':      { difficulty: 1.0, durationMins: 45  },
            'english-tutor':         { difficulty: 1.0, durationMins: 60  },
            'selfdevelopment-daily': { difficulty: 1.0, durationMins: 60  },
            'polish-long':           { difficulty: 1.0, durationMins: 60  },
            'polish-short':          { difficulty: 1.0, durationMins: 30  },
            'gym-daily':             { difficulty: 0.5, durationMins: 90  },
          }
          const migratedTasks = state.tasks.map(t => {
            if (t.completed) return t  // don't touch earned XP
            const key = `${t.track}-${t.recurringType ?? 'daily'}`
            const cfg = XP_MAP[key]
            if (!cfg) return t
            const dur = t.duration ?? cfg.durationMins
            const xp = Math.round(cfg.difficulty * dur * 25 / 120)
            return { ...t, xp, difficulty: cfg.difficulty, durationMins: cfg.durationMins }
          })
          state = { ...state, tasks: migratedTasks }
        }
        if (fromVersion < 3) {
          if (!state.purchases) state = { ...state, purchases: [] }
        }
        return state
      },
    }
  )
)
