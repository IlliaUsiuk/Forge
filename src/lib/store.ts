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

  return achievements
}
import type { Task, Track, AppState, StreakState, DayJob } from './types'
import { TRACK_XP } from './types'
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
  addTask: (task: Omit<Task, 'id' | 'completed' | 'skipped'>) => void
  updateSchedule: (month: string, workDays: string[]) => void
  setDayJobs: (jobs: DayJob[]) => void
  deleteRecurringSeries: (track: Track) => void
  addChatMessage: (msg: ChatMessage) => void
  clearChatHistory: () => void
  setOnboardingDone: () => void
  processOnOpen: () => void
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
    { name: 'personal-dashboard-storage' }
  )
)
