import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Task, AppState } from './types'

/**
 * Export tasks to CSV format
 */
export function exportToCSV(tasks: Task[], filename = 'tasks.csv'): void {
  const headers = ['Дата', 'Название', 'Трек', 'Статус', 'XP', 'Повторяющаяся']
  const rows = tasks.map(t => [
    t.date,
    t.title,
    t.track,
    t.completed ? 'Выполнено' : t.skipped ? 'Пропущено' : 'Активно',
    t.xp,
    t.isRecurring ? 'Да' : 'Нет',
  ])

  const csv = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(r => r.map(v => `"${v}"`).join(',')),
  ].join('\n')

  downloadFile(csv, `${filename}`, 'text/csv;charset=utf-8;')
}

/**
 * Export tasks to iCalendar (ICS) format
 */
export function exportToICS(tasks: Task[], filename = 'schedule.ics'): void {
  const events = tasks
    .filter(t => !t.completed && !t.skipped)  // Only include incomplete tasks
    .map(t => {
      const date = t.date
      const startDate = formatICSDate(date)
      // All-day event
      return `BEGIN:VEVENT
DTSTART;VALUE=DATE:${startDate}
DTEND;VALUE=DATE:${getNextDay(date)}
SUMMARY:${escapeICS(t.title)}
DESCRIPTION:${escapeICS(`Track: ${t.track}, XP: ${t.xp}`)}
UID:${t.id}@personaldashboard.local
CREATED:${formatICSDateTime(new Date().toISOString())}
LAST-MODIFIED:${formatICSDateTime(new Date().toISOString())}
END:VEVENT`
    })
    .join('\n')

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Personal Dashboard//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Learning Schedule
X-WR-TIMEZONE:UTC
X-WR-CALDESC:Learning tasks and schedule
${events}
END:VCALENDAR`

  downloadFile(ics, filename, 'text/calendar;charset=utf-8;')
}

/**
 * Export full state to JSON
 */
export function exportToJSON(state: Partial<AppState>, filename = 'dashboard-backup.json'): void {
  const json = JSON.stringify(state, null, 2)
  downloadFile(json, filename, 'application/json;')
}

/**
 * Helper: download file to client
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format date for ICS (YYYYMMDD)
 */
function formatICSDate(date: string): string {
  return date.replace(/-/g, '')
}

/**
 * Format datetime for ICS (YYYYMMDDTHHmmssZ)
 */
function formatICSDateTime(iso: string): string {
  const d = new Date(iso)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const hours = String(d.getUTCHours()).padStart(2, '0')
  const minutes = String(d.getUTCMinutes()).padStart(2, '0')
  const seconds = String(d.getUTCSeconds()).padStart(2, '0')
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

/**
 * Get next day for ICS end date
 */
function getNextDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + 1)
  return format(d, 'yyyy-MM-dd').replace(/-/g, '')
}

/**
 * Escape special characters for ICS
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
}
