import { create } from 'zustand'
import { format } from 'date-fns'
import type { Task, Track, AppState, StreakState, DayJob, JournalEntry, Category, TemplateTask, Plan, PlanStep } from './types'
import { calcXP, DEFAULT_SCHEDULE_SETTINGS } from './types'
import { generateRecurringTasks } from './schedule'
import { processStreakOnOpen } from './streak'
import { useNotificationStore } from './notifications'

function applyAchievementRules(state: AppState, add: (id: string) => void) {
  const done = state.tasks.filter(t => t.completed).length
  if (done >= 1)    add('first-task')
  if (done >= 5)    add('tasks-5')
  if (done >= 10)   add('tasks-10')
  if (done >= 20)   add('tasks-20')
  if (done >= 30)   add('tasks-30')
  if (done >= 50)   add('tasks-50')
  if (done >= 75)   add('tasks-75')
  if (done >= 100)  add('tasks-100')
  if (done >= 150)  add('tasks-150')
  if (done >= 250)  add('tasks-250')
  if (done >= 500)  add('tasks-500')
  if (done >= 1000) add('tasks-1000')

  const sc = state.streak.current
  if (sc >= 3)   add('streak-3')
  if (sc >= 7)   add('streak-7')
  if (sc >= 14)  add('streak-14')
  if (sc >= 21)  add('streak-21')
  if (sc >= 30)  add('streak-30')
  if (sc >= 60)  add('streak-60')
  if (sc >= 100) add('streak-100')
  if (sc >= 200) add('streak-200')
  if (sc >= 365) add('streak-365')

  const sl = state.streak.longest
  if (sl >= 7)   add('longest-7')
  if (sl >= 30)  add('longest-30')
  if (sl >= 100) add('longest-100')

  const totalXP = Object.values(state.trackXP).reduce((s, v) => s + v, 0)
  if (totalXP >= 100)   add('total-100')
  if (totalXP >= 250)   add('total-250')
  if (totalXP >= 500)   add('total-500')
  if (totalXP >= 1000)  add('total-1000')
  if (totalXP >= 2000)  add('total-2000')
  if (totalXP >= 5000)  add('total-5000')
  if (totalXP >= 10000) add('total-10000')
  if (totalXP >= 20000) add('total-20000')
  if (totalXP >= 50000) add('total-50000')

  const getXP = (key: string) => Object.entries(state.trackXP).find(([k]) => k.includes(key))?.[1] ?? 0
  if (getXP('sport') >= 100)  add('xp-sport-100')
  if (getXP('sport') >= 500)  add('xp-sport-500')
  if (getXP('study') >= 100)  add('xp-study-100')
  if (getXP('study') >= 500)  add('xp-study-500')
  if (getXP('financ') >= 200) add('xp-finance-200')
  const tracksOver1000 = Object.values(state.trackXP).filter(v => v >= 1000).length
  if (tracksOver1000 >= 3) add('xp-all-1000')
  const tracksWithXP = Object.values(state.trackXP).filter(v => v > 0).length
  if (tracksWithXP >= 5) add('all-tracks')

  const jc = state.journalEntries.length
  if (jc >= 1)   add('journal-1')
  if (jc >= 5)   add('journal-5')
  if (jc >= 10)  add('journal-10')
  if (jc >= 25)  add('journal-25')
  if (jc >= 50)  add('journal-50')
  if (jc >= 100) add('journal-100')
  if (Object.keys(state.journalProfiles).length >= 1) add('journal-profile')

  if (state.templateTasks.length >= 1)  add('pool-first')
  if (state.templateTasks.length >= 3)  add('pool-3')
  if (state.templateTasks.length >= 5)  add('pool-5')
  if (state.templateTasks.length >= 10) add('pool-10')
  if (state.templateTasks.length >= 20) add('pool-20')
  if (state.templateTasks.length >= 50) add('pool-50')
  if (state.categories.length >= 1) add('category-first')
  if (state.categories.length >= 3) add('categories-3')
  if (state.categories.length >= 5) add('categories-5')
  if (state.categories.length >= 8) add('categories-8')

  if (state.dayJobs.length >= 1)     add('schedule-setup')
  if (state.chatHistory.length >= 1)  add('chat-first')
  if (state.chatHistory.length >= 10) add('chat-10')
}

// Pure computation — no side effects. Returns merged achievement list.
export function computeAchievements(state: AppState, existing: string[]): string[] {
  const a = [...existing]
  const add = (id: string) => { if (!a.includes(id)) a.push(id) }
  applyAchievementRules(state, add)
  return a
}

// Interactive version — shows toasts for newly unlocked achievements.
function checkAchievements(state: AppState, newAchievements: string[]): string[] {
  const a = [...newAchievements]
  const add = (id: string) => {
    if (!a.includes(id)) {
      a.push(id)
      useNotificationStore.getState().showAchievement(id)
    }
  }
  applyAchievementRules(state, add)
  return a
}

const initialStreak: StreakState = {
  current: 0,
  longest: 0,
  lastActiveDate: '',
  freezeUsedMonth: null,
}

type Store = AppState & {
  setUserName: (name: string) => void
  setPassword: (password: string) => void
  setAvatarUrl: (url: string) => void
  setApiKey: (key: string) => void
  setScheduleSettings: (s: Partial<import('./types').ScheduleSettings>) => void
  addCategory: (cat: Omit<Category, 'id'>) => void
  updateCategory: (id: string, changes: Partial<Omit<Category, 'id'>>) => void
  deleteCategory: (id: string) => void
  addTemplateTask: (t: Omit<TemplateTask, 'id'>) => void
  updateTemplateTask: (id: string, changes: Partial<Omit<TemplateTask, 'id'>>) => void
  deleteTemplateTask: (id: string) => void
  completeTask: (taskId: string) => void
  uncompleteTask: (taskId: string) => void
  skipTask: (taskId: string) => void
  deleteTask: (taskId: string) => void
  updateTaskTime: (taskId: string, timeStart: string | undefined) => void
  updateTaskDuration: (taskId: string, durationMins: number | undefined) => void
  updateTaskTitle: (taskId: string, title: string) => void
  moveTaskTo: (taskId: string, targetTaskId: string) => void
  patchTask: (taskId: string, changes: Partial<Task>) => void
  addTask: (task: Omit<Task, 'id' | 'completed' | 'skipped'>) => void
  updateSchedule: (month: string, workDays: string[]) => void
  setDayJobs: (jobs: DayJob[]) => void
  setOnboardingDone: () => void
  processOnOpen: () => void
  saveJournalEntry: (date: string, text: string) => void
  deleteJournalEntry: (id: string) => void
  setJournalProfile: (month: string, text: string) => void
  deleteJournalProfile: (month: string) => void
  addChatMessage: (msg: { role: 'user' | 'assistant'; content: string }) => void
  clearChatHistory: () => void
  createPlan: () => void
  addPlanStep: (planId: string, text: string) => void
  updatePlanStep: (planId: string, stepId: string, text: string) => void
  togglePlanStepPin: (planId: string, stepId: string) => void
  deletePlanStep: (planId: string, stepId: string) => void
  completePlan: (planId: string) => void
  deletePlan: (planId: string) => void
}

const STORED_PASSWORD_KEY = 'forge-lock-password'
const STORED_API_KEY = 'forge-api-key'

export const useStore = create<Store>()((set, get) => ({
      userName: '',
      password: typeof window !== 'undefined' ? (localStorage.getItem(STORED_PASSWORD_KEY) ?? '') : '',
      avatarUrl: '',
      apiKey: typeof window !== 'undefined' ? (localStorage.getItem(STORED_API_KEY) ?? '') : '',
      tasks: [],
      workDays: [],
      dayJobs: [],
      streak: initialStreak,
      trackXP: {},
      onboardingDone: false,
      chatHistory: [],
      dailyXP: {},
      achievements: [],
      journalEntries: [],
      journalProfiles: {},
      categories: [],
      templateTasks: [],
      scheduleSettings: DEFAULT_SCHEDULE_SETTINGS,
      plans: [],

      setUserName: (name) => set({ userName: name.trim() || 'User' }),
      setPassword: (password) => {
        if (typeof window !== 'undefined') {
          if (password) localStorage.setItem(STORED_PASSWORD_KEY, password)
          else localStorage.removeItem(STORED_PASSWORD_KEY)
        }
        set({ password })
      },
      setAvatarUrl: (url) => set({ avatarUrl: url }),
      setApiKey: (key) => {
        const trimmed = key.trim()
        if (typeof window !== 'undefined') {
          if (trimmed) localStorage.setItem(STORED_API_KEY, trimmed)
          else localStorage.removeItem(STORED_API_KEY)
        }
        set({ apiKey: trimmed })
      },
      setScheduleSettings: (s) => set(state => ({ scheduleSettings: { ...state.scheduleSettings, ...s } })),

      addCategory: (cat) => {
        const id = cat.label.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
        set(s => {
          const next = [...s.categories, { ...cat, id }]
          return { categories: next, achievements: checkAchievements({ ...s, categories: next }, s.achievements) }
        })
      },
      updateCategory: (id, changes) => {
        set(s => ({ categories: s.categories.map(c => c.id === id ? { ...c, ...changes } : c) }))
      },
      deleteCategory: (id) => {
        set(s => ({ categories: s.categories.filter(c => c.id !== id), templateTasks: s.templateTasks.filter(t => t.categoryId !== id) }))
      },
      addTemplateTask: (t) => {
        const id = `tmpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        set(s => {
          const next = [...s.templateTasks, { ...t, id }]
          return { templateTasks: next, achievements: checkAchievements({ ...s, templateTasks: next }, s.achievements) }
        })
      },
      updateTemplateTask: (id, changes) => {
        set(s => ({ templateTasks: s.templateTasks.map(t => t.id === id ? { ...t, ...changes } : t) }))
      },
      deleteTemplateTask: (id) => {
        set(s => ({ templateTasks: s.templateTasks.filter(t => t.id !== id) }))
      },
      patchTask: (taskId: string, changes: Partial<Task>) => {
        set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? { ...t, ...changes } : t) }))
      },

      completeTask: (taskId) => {
        const state = get()
        const task = state.tasks.find(t => t.id === taskId)
        if (!task || task.completed || task.skipped) return
        const today = format(new Date(), 'yyyy-MM-dd')
        set(s => {
          const updatedTasks = s.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t)
          const newTrackXP = { ...s.trackXP }
          newTrackXP[task.track] = (newTrackXP[task.track] || 0) + task.xp
          let newStreak = { ...s.streak }
          if (task.date === today) {
            const hadCompletedBefore = s.tasks.some(t => t.id !== taskId && t.date === today && t.completed && !t.skipped)
            if (!hadCompletedBefore) {
              const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')
              if (newStreak.lastActiveDate === yesterday || newStreak.lastActiveDate === today || newStreak.lastActiveDate === '') {
                if (newStreak.lastActiveDate !== today) {
                  newStreak.current += 1
                  newStreak.lastActiveDate = today
                  if (newStreak.current > newStreak.longest) newStreak.longest = newStreak.current
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
              [today]: { ...(s.dailyXP[today] || {}), [task.track]: ((s.dailyXP[today]?.[task.track] || 0) + task.xp) },
            },
            achievements: checkAchievements({ ...s, trackXP: newTrackXP, streak: newStreak }, s.achievements),
          }
        })
      },

      uncompleteTask: (taskId) => {
        const state = get()
        const task = state.tasks.find(t => t.id === taskId)
        if (!task || !task.completed) return
        const today = format(new Date(), 'yyyy-MM-dd')
        set(s => {
          const updatedTasks = s.tasks.map(t => t.id === taskId ? { ...t, completed: false } : t)
          const newTrackXP = { ...s.trackXP }
          newTrackXP[task.track] = Math.max(0, (newTrackXP[task.track] || 0) - task.xp)
          return {
            tasks: updatedTasks,
            trackXP: newTrackXP,
            dailyXP: task.date === today ? {
              ...s.dailyXP,
              [today]: { ...(s.dailyXP[today] || {}), [task.track]: Math.max(0, (s.dailyXP[today]?.[task.track] || 0) - task.xp) },
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

      updateTaskDuration: (taskId, durationMins) => {
        set(s => ({
          tasks: s.tasks.map(t => {
            if (t.id !== taskId) return t
            const newDuration = durationMins ?? t.durationMins
            const xp = newDuration ? calcXP(t.difficulty ?? 1.0, newDuration) : t.xp
            return { ...t, durationMins, xp }
          })
        }))
      },
      updateTaskTitle: (taskId, title) => {
        set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? { ...t, title } : t) }))
      },
      updateTaskTime: (taskId, timeStart) => {
        set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? { ...t, timeStart } : t) }))
      },

      moveTaskTo: (taskId, targetTaskId) => {
        set(s => {
          const task = s.tasks.find(t => t.id === taskId)
          if (!task) return s
          const dayTasks = s.tasks.filter(t => t.date === task.date).sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
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
          const keptTasks = s.tasks.filter(t => !(t.isRecurring && t.date.startsWith(month) && !t.completed && !t.skipped))
          const otherWorkDays = s.workDays.filter(d => !d.startsWith(month))
          const allWorkDays = [...otherWorkDays, ...newWorkDays]
          const macDays = new Set(s.dayJobs.map(j => j.date))
          const macDaysInMonth = [...macDays].filter(d => d.startsWith(month))
          const allDaysForGen = [...new Set([...newWorkDays, ...macDaysInMonth])]
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
          const affectedMonths = new Set([...dates].map(d => d.slice(0, 7)))
          let tasks = s.tasks
          for (const month of affectedMonths) {
            const monthWorkDays = s.workDays.filter(d => d.startsWith(month))
            if (monthWorkDays.length === 0) continue
            const keptTasks = tasks.filter(t => !(t.isRecurring && t.date.startsWith(month)) || t.completed || t.skipped)
            const macDaysInMonth = [...newMacDays].filter(d => d.startsWith(month))
            const allDaysForGen = [...new Set([...monthWorkDays, ...macDaysInMonth])]
            const generated = generateRecurringTasks(allDaysForGen, keptTasks, newMacDays)
            tasks = [...keptTasks, ...generated]
          }
          return { dayJobs: newDayJobs, tasks, onboardingDone: true }
        })
      },

      setOnboardingDone: () => set({ onboardingDone: true }),

      saveJournalEntry: (date, text) => {
        set(s => {
          const existing = s.journalEntries.find(e => e.date === date)
          if (existing) {
            return { journalEntries: s.journalEntries.map(e => e.id === existing.id ? { ...e, text, updatedAt: new Date().toISOString() } : e) }
          }
          const entry: JournalEntry = { id: `journal-${date}`, date, text, updatedAt: new Date().toISOString() }
          const next = [...s.journalEntries, entry]
          return { journalEntries: next, achievements: checkAchievements({ ...s, journalEntries: next }, s.achievements) }
        })
      },
      deleteJournalEntry: (id) => {
        set(s => ({ journalEntries: s.journalEntries.filter(e => e.id !== id) }))
      },

      setJournalProfile: (month, text) => {
        set(s => ({
          journalProfiles: { ...s.journalProfiles, [month]: { text, updatedAt: new Date().toISOString() } },
        }))
      },
      deleteJournalProfile: (month) => {
        set(s => {
          const updated = { ...s.journalProfiles }
          delete updated[month]
          return { journalProfiles: updated }
        })
      },

      addChatMessage: (msg) => {
        set(s => {
          const next = [...s.chatHistory, msg]
          return { chatHistory: next, achievements: checkAchievements({ ...s, chatHistory: next }, s.achievements) }
        })
      },
      clearChatHistory: () => set({ chatHistory: [] }),

      createPlan: () => {
        const today = format(new Date(), 'yyyy-MM-dd')
        const plan: Plan = {
          id: `plan-${Date.now()}`,
          steps: [],
          startDate: today,
          completed: false,
          createdAt: new Date().toISOString(),
        }
        set(s => ({ plans: [...s.plans, plan] }))
      },
      addPlanStep: (planId, text) => {
        const step: PlanStep = {
          id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text,
          pinned: true,
        }
        set(s => ({ plans: s.plans.map(p => p.id === planId ? { ...p, steps: [...p.steps, step] } : p) }))
      },
      updatePlanStep: (planId, stepId, text) => {
        set(s => ({
          plans: s.plans.map(p => p.id === planId
            ? { ...p, steps: p.steps.map(step => step.id === stepId ? { ...step, text } : step) }
            : p),
        }))
      },
      togglePlanStepPin: (planId, stepId) => {
        set(s => ({
          plans: s.plans.map(p => p.id === planId
            ? { ...p, steps: p.steps.map(step => step.id === stepId ? { ...step, pinned: !step.pinned } : step) }
            : p),
        }))
      },
      deletePlanStep: (planId, stepId) => {
        set(s => ({
          plans: s.plans.map(p => p.id === planId
            ? { ...p, steps: p.steps.filter(step => step.id !== stepId) }
            : p),
        }))
      },
      completePlan: (planId) => {
        const today = format(new Date(), 'yyyy-MM-dd')
        set(s => ({
          plans: s.plans.map(p => p.id === planId ? { ...p, completed: true, endDate: today } : p),
        }))
      },
      deletePlan: (planId) => {
        set(s => ({ plans: s.plans.filter(p => p.id !== planId) }))
      },

      processOnOpen: () => {
        const state = get()
        const today = format(new Date(), 'yyyy-MM-dd')
        if (!state.streak.lastActiveDate) return
        const newStreak = processStreakOnOpen(state.streak, state.tasks, today)
        if (newStreak.current !== state.streak.current || newStreak.longest !== state.streak.longest || newStreak.freezeUsedMonth !== state.streak.freezeUsedMonth) {
          set({ streak: newStreak })
        }
      },
    }),
)
