'use client'

import { useState, useEffect } from 'react'
import { playError } from '@/lib/sounds'
import { format, addDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'
import { Trash2, Brain, CheckCircle2, Loader2, MessageSquare, Download } from 'lucide-react'
import { useStore } from '@/lib/store'

export default function JournalPage() {
  const { journalEntries, saveJournalEntry, deleteJournalEntry, journalProfiles, setJournalProfile, userName, apiKey } = useStore()
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeMsg, setAnalyzeMsg] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const today = format(new Date(), 'yyyy-MM-dd')
  const currentMonth = today.slice(0, 7)
  const [selectedDate, setSelectedDate] = useState(today)
  if (!mounted) return null

  const entry = journalEntries.find(e => e.date === selectedDate)
  const text = entry?.text ?? ''

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = addDays(new Date(), -i)
    return format(d, 'yyyy-MM-dd')
  })

  function handleChange(val: string) {
    if (val.trim()) saveJournalEntry(selectedDate, val)
    else if (entry) deleteJournalEntry(entry.id)
  }

  function handleDelete() {
    if (entry) deleteJournalEntry(entry.id)
  }

  function handleExport() {
    const sorted = [...journalEntries].sort((a, b) => a.date.localeCompare(b.date))
    if (sorted.length === 0) return
    const lines = sorted.map(e => {
      const label = format(new Date(e.date + 'T12:00:00'), 'd MMMM yyyy (EEEE)', { locale: ru })
      return `=== ${label} ===\n\n${e.text}\n`
    })
    const content = lines.join('\n\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `дневник-${format(new Date(), 'yyyy-MM-dd')}.txt`
    a.click()
    URL.revokeObjectURL(url)
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
        body: JSON.stringify({ month: currentMonth, entries: monthEntries, existingProfiles: journalProfiles, userName, apiKey }),
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

            <Link href="/journal/profiles" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all" style={btnStyle}>
              <Brain size={14} />
              Заметки{Object.keys(journalProfiles).length > 0 ? ` (${Object.keys(journalProfiles).length})` : ''}
            </Link>
            <Link href="/journal/psychologist" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all" style={btnStyle}>
              <MessageSquare size={14} />
              Психолог
            </Link>
            <button
              onClick={handleExport}
              disabled={journalEntries.length === 0}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all disabled:opacity-30"
              style={btnStyle}
              title="Скачать весь дневник"
            >
              <Download size={14} />
              Скачать
            </button>
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

      {/* Info banner — shown if no entries yet this month */}
      {journalEntries.filter(e => e.date.startsWith(currentMonth)).length === 0 && (
        <div className="rounded-2xl p-5 flex gap-4" style={{ background: 'rgba(129,140,248,0.07)', border: '1px solid rgba(129,140,248,0.15)' }}>
          <div className="text-2xl shrink-0">🧠</div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Как работает ИИ-психолог</p>

            <div className="space-y-1">
              <p className="text-xs font-medium" style={{ color: 'rgba(167,139,250,0.8)' }}>Пиши — когда накопится, жми «Обновить базу»</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ИИ читает все записи, сжимает их в компактный психологический портрет (~500 слов) и сохраняет. Делать это можно в любой момент — хоть после каждых 5 записей. Чем чаще обновляешь, тем точнее портрет.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium" style={{ color: 'rgba(167,139,250,0.8)' }}>Портрет идёт к Помощнику — бесплатно</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Вместо того чтобы слать боту весь дневник при каждом запросе (дорого), он получает сжатый портрет + последние 7 записей. Это экономит ~90% токенов на истории дневника.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium" style={{ color: 'rgba(167,139,250,0.8)' }}>Почему бот дешёвый в использовании</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Системный промпт кэшируется на стороне Anthropic — повторные запросы стоят на 90% меньше. История чата обрезается до последних 40 сообщений. Дай боту всё за один раз — «составь расписание на апрель, работаю пн–пт с 13:00» — вместо серии уточнений.
              </p>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <p className="text-xs" style={{ color: 'rgba(129,140,248,0.6)' }}>🔒 Всё хранится только локально</p>
              <p className="text-xs" style={{ color: 'rgba(129,140,248,0.6)' }}>⚡ Обучен по CBT, ACT и стоицизму</p>
            </div>
          </div>
        </div>
      )}

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

          <div className="flex items-center">
            <p className="text-xs text-white/25">
              {entry
                ? `Сохранено ${format(new Date(entry.updatedAt), 'd MMM, HH:mm', { locale: ru })}`
                : 'Начни писать — сохранится автоматически'}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
