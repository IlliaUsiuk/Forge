import { format, parseISO, addDays, isBefore, isEqual } from 'date-fns'
import type { Task, StreakState } from './types'


// Returns true if a given date had at least one completed (non-skipped) task
function hadCompletedTask(tasks: Task[], date: string): boolean {
  return tasks.some(t => t.date === date && t.completed && !t.skipped)
}

// Returns true if a given date had tasks but all were either skipped or no tasks at all
// A "skip day" = all tasks on that day were explicitly skipped (none completed)
function wasFullySkipped(tasks: Task[], date: string): boolean {
  const dayTasks = tasks.filter(t => t.date === date)
  if (dayTasks.length === 0) return false
  return dayTasks.every(t => t.skipped)
}

// Process all days from lastActiveDate up to today, updating streak
// Called on app open to handle multi-day gaps
export function processStreakOnOpen(
  streak: StreakState,
  tasks: Task[],
  today: string
): StreakState {
  if (!streak.lastActiveDate) {
    return streak
  }

  let current = { ...streak }
  let cursor = parseISO(streak.lastActiveDate)
  const todayDate = parseISO(today)

  // Walk through every day after lastActiveDate up to yesterday
  while (true) {
    const next = addDays(cursor, 1)
    if (!isBefore(next, todayDate) && !isEqual(next, todayDate)) break
    // Don't process today yet (user might still complete tasks)
    if (isEqual(next, todayDate)) break

    const dateStr = format(next, 'yyyy-MM-dd')
    const hasCompleted = hadCompletedTask(tasks, dateStr)
    const allSkipped = wasFullySkipped(tasks, dateStr)

    if (hasCompleted) {
      current.current += 1
      current.lastActiveDate = dateStr
      if (current.current > current.longest) {
        current.longest = current.current
      }
    } else if (allSkipped) {
      // Consciously skipped = neutral, streak doesn't break or grow
    } else {
      // Forgot — no action taken
      const currentMonth = dateStr.slice(0, 7)
      if (current.freezeUsedMonth !== currentMonth) {
        // Use freeze
        current.freezeUsedMonth = currentMonth
        // Streak preserved, but lastActiveDate doesn't advance
      } else {
        // No freeze available — streak resets
        current.current = 0
      }
    }

    cursor = next
  }

  return current
}
