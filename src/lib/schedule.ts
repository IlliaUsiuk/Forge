import { parseISO, getDay } from 'date-fns'
import type { Task, Track } from './types'
import { TRACK_XP, calcXP } from './types'

// Day of week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
function getDOW(dateStr: string): number {
  return getDay(parseISO(dateStr))
}

// difficulty × durationMins → XP (1.0 difficulty + 60 min = 25 XP)
const TASK_CONFIG: Partial<Record<string, { difficulty: number; durationMins: number }>> = {
  'ai-daily':             { difficulty: 1.1, durationMins: 120 },  // 28 XP
  'design-daily':         { difficulty: 1.1, durationMins: 90  },  // 21 XP
  'mediabuy-daily':       { difficulty: 1.1, durationMins: 60  },  // 14 XP
  'english-homework':     { difficulty: 1.0, durationMins: 45  },  // 19 XP
  'english-tutor':        { difficulty: 1.0, durationMins: 60  },  // 25 XP
  'selfdevelopment-daily':{ difficulty: 1.0, durationMins: 60  },  // 25 XP
  'polish-long':          { difficulty: 1.0, durationMins: 60  },  // 25 XP
  'polish-short':         { difficulty: 1.0, durationMins: 30  },  // 13 XP
  'gym-daily':            { difficulty: 0.5, durationMins: 90  },  // 19 XP
}

function makeTask(
  title: string,
  track: Track,
  date: string,
  recurringType?: string,
  xpOverride?: number
): Task {
  const configKey = `${track}-${recurringType ?? 'daily'}`
  const cfg = TASK_CONFIG[configKey]
  const xp = xpOverride ?? (cfg ? calcXP(cfg.difficulty, cfg.durationMins) : TRACK_XP[track])
  return {
    id: `${track}-${date}-${recurringType ?? 'daily'}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    track,
    date,
    completed: false,
    skipped: false,
    isRecurring: true,
    recurringType,
    xp,
    difficulty: cfg?.difficulty,
    durationMins: cfg?.durationMins,
  }
}

// Generate all recurring tasks for a given set of work days.
// macDays — dates when Ilya has Mac job.
//
// Mac days (limited morning window ~95 min):
//   English HW + Polish short (30 min) + English tutor (Tue/Thu)
//   Gym only on Mon/Wed/Fri (fixed 18:00) — Tue/Thu Mac days skip gym
//
// Free days (unlimited time):
//   Gym (every day) + AI + Design + Mediabuy (Mon/Sat)
//   + English HW (Mon–Fri) + Selfdevelopment (Mon/Wed/Fri)
//
// Gym: Mon(1)/Wed(3)/Fri(5) — fixed at 18:00. Other days — flexible (chat sets time).
// Polish: Mon–Fri always; long (60 min, 30 XP) on free days; short (30 min, 15 XP) on Mac days.
export function generateRecurringTasks(
  workDays: string[],
  existingTasks: Task[],
  macDays?: Set<string>
): Task[] {
  const newTasks: Task[] = []

  function alreadyExists(track: Track, date: string, recurringType: string): boolean {
    return existingTasks.some(
      t => t.track === track && t.date === date && t.recurringType === recurringType && t.isRecurring
    )
  }

  const useSmart = macDays && macDays.size > 0

  for (const date of workDays) {
    const dow = getDOW(date)
    const isMacDay = useSmart && macDays!.has(date)
    const isGymDay = dow === 1 || dow === 3 || dow === 5  // Mon/Wed/Fri

    if (useSmart) {
      if (isMacDay) {
        // Mac day — limited morning window (~95 min fits Polish 30 + English HW 45)
        if (!alreadyExists('english', date, 'homework')) {
          newTasks.push(makeTask('Английский — домашнее задание', 'english', date, 'homework'))
        }
        // English tutor — Tue(2) and Thu(4), shown as "по договорённости"
        if ((dow === 2 || dow === 4) && !alreadyExists('english', date, 'tutor')) {
          newTasks.push(makeTask('Английский — урок с репетитором', 'english', date, 'tutor'))
        }
        // Gym only on Mon/Wed/Fri even on Mac days (fixed 18:00 in the evening)
        // Tue/Thu Mac days: skip gym — can't fit before work, too late after
        if (isGymDay && !alreadyExists('gym', date, 'daily')) {
          newTasks.push(makeTask('Зал', 'gym', date, 'daily'))
        }
      } else {
        // Free day — plenty of time, heavier tasks + language practice
        // Gym every day (Mon/Wed/Fri at 18:00; other days flexible)
        if (!alreadyExists('gym', date, 'daily')) {
          newTasks.push(makeTask('Зал', 'gym', date, 'daily'))
        }
        if (!alreadyExists('ai', date, 'daily')) {
          newTasks.push(makeTask('AI-обучение', 'ai', date, 'daily'))
        }
        if (!alreadyExists('design', date, 'daily')) {
          newTasks.push(makeTask('Продуктовый дизайн', 'design', date, 'daily'))
        }
        // Mediabuy — Mon(1) or Sat(6) only
        if ((dow === 1 || dow === 6) && !alreadyExists('mediabuy', date, 'daily')) {
          newTasks.push(makeTask('Медиабаинг', 'mediabuy', date, 'daily'))
        }
        // English HW on free weekdays (Mon–Fri)
        if (dow >= 1 && dow <= 5 && !alreadyExists('english', date, 'homework')) {
          newTasks.push(makeTask('Английский — домашнее задание', 'english', date, 'homework'))
        }
        // Selfdevelopment — Mon/Wed/Fri free days (enough time)
        if (isGymDay && !alreadyExists('selfdevelopment', date, 'daily')) {
          newTasks.push(makeTask('Саморазвитие', 'selfdevelopment', date, 'daily'))
        }
      }
    } else {
      // Default mode (no Mac days info) — generate all tasks every day
      // Gym every day (Mon/Wed/Fri at 18:00; other days flexible)
      if (!alreadyExists('gym', date, 'daily')) {
        newTasks.push(makeTask('Зал', 'gym', date, 'daily'))
      }
      if (!alreadyExists('ai', date, 'daily')) {
        newTasks.push(makeTask('AI-обучение', 'ai', date, 'daily'))
      }
      if (!alreadyExists('design', date, 'daily')) {
        newTasks.push(makeTask('Продуктовый дизайн', 'design', date, 'daily'))
      }
      if (dow >= 1 && dow <= 5 && !alreadyExists('english', date, 'homework')) {
        newTasks.push(makeTask('Английский — домашнее задание', 'english', date, 'homework'))
      }
      if ((dow === 2 || dow === 4) && !alreadyExists('english', date, 'tutor')) {
        newTasks.push(makeTask('Английский — урок с репетитором', 'english', date, 'tutor'))
      }
      if (dow === 1 && !alreadyExists('mediabuy', date, 'daily')) {
        newTasks.push(makeTask('Медиабаинг', 'mediabuy', date, 'daily'))
      }
      if (isGymDay && !alreadyExists('selfdevelopment', date, 'daily')) {
        newTasks.push(makeTask('Саморазвитие', 'selfdevelopment', date, 'daily'))
      }
    }

    // Polish: Mon–Fri always
    // long (60 min) on free days; short (30 min) on Mac days — XP via calcXP
    if (dow >= 1 && dow <= 5) {
      const isLong = !isMacDay
      const type = isLong ? 'long' : 'short'
      const title = isLong ? 'Польский — 1 час' : 'Польский — 30 мин'
      if (!alreadyExists('polish', date, type)) {
        newTasks.push(makeTask(title, 'polish', date, type))
      }
    }
  }

  return newTasks
}
