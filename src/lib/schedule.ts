import type { Task } from './types'

// Recurring task generation — users add their own tasks via Pool or manually.
// No hardcoded personal tasks are generated.
export function generateRecurringTasks(
  _workDays: string[],
  _existingTasks: Task[],
  _macDays?: Set<string>
): Task[] {
  return []
}
