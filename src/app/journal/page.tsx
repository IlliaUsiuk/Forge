'use client'

import { useState, useEffect, useRef } from 'react'
import { format, addDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'
import { Trash2, Lock, Brain, CheckCircle2, Loader2, MessageSquare } from 'lucide-react'
import { useStore } from '@/lib/store'

const JOURNAL_PASSWORD = '1212'
const SESSION_KEY = 'journal-unlocked'

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (input === JOURNAL_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onUnlock()
    } else {
      setError(true)
      setInput('')
      setTimeout(() => setError(false), 1500)
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(167,139,250,0.1))', boxShadow: '0 0 0 1px rgba(129,140,248,0.2) inset' }}
      >
        <Lock size={22} style={{ color: '#818cf8' }} />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">Дневник заперт</h2>
        <p className="text-sm text-white/40 mt-1">Введи пароль чтобы войти</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 w-full max-w-xs">
        <input
          type="password"
          value={input}
          onChange={e => setInput(e.target.value)}
          autoComplete="new-password"
          placeholder="Пароль"
          className="w-full rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest outline-none transition-all"
          style={{
            background: error ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: error ? '#ef4444' : 'white',
          }}
        />
        {error && <p className="text-xs text-red-400">Неверный пароль</p>}
        <button
          type="submit"
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
        >
          Войти
        </button>
      </form>
    </div>
  )
}

export default function JournalPage() {
  const { journalEntries, saveJournalEntry, deleteJournalEntry, journalProfiles, setJournalProfile } = useStore()
  const [unlocked, setUnlocked] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeMsg, setAnalyzeMsg] = useState<string | null>(null)
  const today = format(new Date(), 'yyyy-MM-dd')
  const currentMonth = today.slice(0, 7)
  const [selectedDate, setSelectedDate] = useState(today)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'pending' | 'saved'>('idle')
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') setUnlocked(true)
  }, [])

  const entry = journalEntries.find(e => e.date === selectedDate)
  const text = draft[selectedDate] ?? entry?.text ?? ''
  const isDirty = text !== (entry?.text ?? '') && text.trim().length > 0

  // Autosave: 1.5s debounce after typing stops (must be before early return)
  useEffect(() => {
    if (!unlocked || !isDirty) return
    setAutoSaveStatus('pending')
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      saveJournalEntry(selectedDate, text.trim())
      setDraft(d => { const n = { ...d }; delete n[selectedDate]; return n })
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus('idle'), 2000)
    }, 1500)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, selectedDate, unlocked])

  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = addDays(new Date(), -i)
    return format(d, 'yyyy-MM-dd')
  })

  function handleSave() {
    if (!text.trim()) return
    saveJournalEntry(selectedDate, text.trim())
    setDraft(d => { const n = { ...d }; delete n[selectedDate]; return n })
  }

  function handleChange(val: string) {
    setDraft(d => ({ ...d, [selectedDate]: val }))
  }

  function handleDelete() {
    if (entry) deleteJournalEntry(entry.id)
    setDraft(d => { const n = { ...d }; delete n[selectedDate]; return n })
  }

  async function handleAnalyze() {
    const monthEntries = journalEntries.filter(e => e.date.startsWith(currentMonth))
    if (monthEntries.length === 0) {
      setAnalyzeMsg('Нет записей за этот месяц')
      setTimeout(() => setAnalyzeMsg(null), 3000)
      return
    }
    setAnalyzing(true)
    setAnalyzeMsg(null)
    try {
      const res = await fetch('/api/journal-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: currentMonth, entries: monthEntries, existingProfiles: journalProfiles }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      setJournalProfile(currentMonth, data.profile)
      setAnalyzeMsg('База обновлена')
    } catch (e) {
      setAnalyzeMsg(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setAnalyzing(false)
      setTimeout(() => setAnalyzeMsg(null), 4000)
    }
  }

  const currentProfile = journalProfiles[currentMonth]
  const monthLabel = format(new Date(currentMonth + '-01'), 'LLLL yyyy', { locale: ru })
  const btnStyle = { background: 'rgba(167,139,250,0.1)', boxShadow: '0 0 0 1px rgba(129,140,248,0.2) inset', color: '#a78bfa' }
  const profileCount = Object.keys(journalProfiles).length

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Дневник</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Мысли, переживания, итоги дня</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all"
              style={analyzing ? { background: 'rgba(255,255,255,0.05)', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset', color: 'rgba(255,255,255,0.3)' } : btnStyle}
            >
              {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
              {analyzing ? 'Анализирую...' : 'Обновить базу'}
            </button>
            <Link
              href="/journal/profiles"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all"
              style={btnStyle}
            >
              <Brain size={14} />
              Заметки психолога{profileCount > 0 ? ` (${profileCount})` : ''}
            </Link>
            <Link
              href="/chat"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all"
              style={btnStyle}
            >
              <MessageSquare size={14} />
              Психолог
            </Link>
          </div>
          {analyzeMsg && (
            <p className="flex items-center gap-1.5 text-xs" style={{ color: analyzeMsg === 'База обновлена' ? '#34d399' : '#f87171' }}>
              {analyzeMsg === 'База обновлена' && <CheckCircle2 size={11} />}
              {analyzeMsg}
            </p>
          )}
          {currentProfile && !analyzeMsg && (
            <p className="text-xs text-white/25">
              База {monthLabel}: обновлена {format(new Date(currentProfile.updatedAt), 'd MMM, HH:mm', { locale: ru })}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">

        {/* Date list */}
        <div
          className="w-36 shrink-0 rounded-2xl overflow-y-auto flex flex-col gap-1 p-2"
          style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset', maxHeight: '70vh' }}
        >
          {days.map(date => {
            const hasEntry = journalEntries.some(e => e.date === date)
            const isToday = date === today
            const isSelected = date === selectedDate
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className="w-full rounded-xl px-3 py-2.5 text-left transition-all"
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(167,139,250,0.1))'
                    : 'transparent',
                  boxShadow: isSelected ? '0 0 0 1px rgba(129,140,248,0.2) inset' : undefined,
                }}
              >
                <p className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: isSelected ? '#818cf8' : 'rgba(255,255,255,0.3)' }}
                >
                  {isToday ? 'Сегодня' : format(new Date(date + 'T12:00:00'), 'EEE', { locale: ru })}
                </p>
                <p className="text-sm font-semibold mt-0.5"
                  style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)' }}
                >
                  {format(new Date(date + 'T12:00:00'), 'd MMM', { locale: ru })}
                </p>
                {hasEntry && (
                  <div className="mt-1 h-1 w-4 rounded-full" style={{ background: '#818cf880' }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div
            className="rounded-2xl p-1 flex-1 flex flex-col min-h-0"
            style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
          >
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-white/60">
                {format(new Date(selectedDate + 'T12:00:00'), 'd MMMM yyyy', { locale: ru })}
              </p>
              {entry && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-all hover:opacity-100 opacity-50"
                  style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}
                >
                  <Trash2 size={11} />
                  Удалить
                </button>
              )}
            </div>
            <textarea
              className="flex-1 w-full resize-none bg-transparent px-4 pb-4 text-sm leading-relaxed outline-none"
              style={{ color: 'rgba(255,255,255,0.8)', minHeight: '300px' }}
              placeholder="Как прошёл день? Что чувствуешь? Что важного произошло..."
              value={text}
              onChange={e => handleChange(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-white/25">
              {autoSaveStatus === 'pending'
                ? 'Сохранение...'
                : autoSaveStatus === 'saved'
                  ? '✓ Сохранено'
                  : entry
                    ? `Сохранено ${format(new Date(entry.updatedAt), 'd MMM, HH:mm', { locale: ru })}`
                    : 'Начни писать — сохранится автоматически'}
            </p>
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className="rounded-xl px-5 py-2 text-sm font-semibold transition-all"
              style={{
                background: isDirty
                  ? 'linear-gradient(135deg, #818cf8, #a78bfa)'
                  : 'rgba(255,255,255,0.05)',
                color: isDirty ? 'white' : 'rgba(255,255,255,0.2)',
                cursor: isDirty ? 'pointer' : 'default',
              }}
            >
              Сохранить
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
