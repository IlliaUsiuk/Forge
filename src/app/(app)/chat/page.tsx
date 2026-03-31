'use client'

import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Send, Loader2, Bot, User, CheckCircle2, Key, ExternalLink, Settings, X } from 'lucide-react'
import { playError, playClick } from '@/lib/sounds'
import { useStore } from '@/lib/store'
import type { Track, DayJob } from '@/lib/types'

function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} className="opacity-80">{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-primary/90">{part.slice(1, -1)}</code>
    return <span key={i}>{part}</span>
  })
}

function renderMessage(content: string): React.ReactNode {
  return content.split('\n').map((line, i) => {
    if (line.trim() === '---')
      return <hr key={i} className="my-2 border-white/10" />
    const h2 = line.match(/^##\s+(.*)/)
    if (h2)
      return <p key={i} className="font-bold text-white/90 mt-2 mb-0.5">{parseInline(h2[1])}</p>
    const h3 = line.match(/^###\s+(.*)/)
    if (h3)
      return <p key={i} className="font-semibold text-white/70 mt-1.5 mb-0.5 text-[13px] uppercase tracking-wide">{parseInline(h3[1])}</p>
    const listMatch = line.match(/^[-•]\s+(.*)/)
    if (listMatch)
      return (
        <div key={i} className="flex items-start gap-2 my-0.5">
          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary/60" />
          <span>{parseInline(listMatch[1])}</span>
        </div>
      )
    if (line === '') return <div key={i} className="h-1.5" />
    return <p key={i}>{parseInline(line)}</p>
  })
}

type Message = { role: 'user' | 'assistant'; content: string }

type Action =
  | { type: 'updateSchedule'; month: string; workDays: string[] }
  | { type: 'setDayJobs'; jobs: DayJob[] }
  | { type: 'addTask'; title: string; track: Track; date: string; xp: number }
  | { type: 'completeTask'; taskId: string }
  | { type: 'uncompleteTask'; taskId: string }
  | { type: 'skipTask'; taskId: string }
  | { type: 'resetData' }

function ApiKeySetup({ onSave }: { onSave: (key: string) => void }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    const key = input.trim()
    if (!key.startsWith('sk-ant-')) {
      setError('Ключ должен начинаться с sk-ant-...')
      return
    }
    onSave(key)
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(167,139,250,0.1))', boxShadow: '0 0 0 1px rgba(129,140,248,0.2) inset' }}
      >
        <Key size={22} style={{ color: '#818cf8' }} />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">Добавь API ключ</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Помощник работает через Anthropic API. Добавь свой ключ — он хранится только на твоём устройстве.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm">
        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError('') }}
          placeholder="sk-ant-api03-..."
          autoComplete="off"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
          style={{
            background: error ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: 'white',
          }}
        />
        {error && <p className="text-xs text-red-400 -mt-1">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
        >
          Сохранить и открыть чат
        </button>
      </form>

      <div className="flex flex-col gap-2 w-full max-w-sm">
        <p className="text-xs text-muted-foreground text-center mb-1">Где взять ключ?</p>
        <div
          className="flex items-center gap-3 rounded-xl p-3 text-sm"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <span className="text-base">1️⃣</span>
          <span className="text-muted-foreground">Зайди на <span className="text-primary">console.anthropic.com</span></span>
          <ExternalLink size={13} className="ml-auto shrink-0 text-muted-foreground" />
        </div>
        <div
          className="flex items-center gap-3 rounded-xl p-3 text-sm"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <span className="text-base">2️⃣</span>
          <span className="text-muted-foreground">API Keys → Create Key</span>
        </div>
        <div
          className="flex items-center gap-3 rounded-xl p-3 text-sm"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <span className="text-base">3️⃣</span>
          <span className="text-muted-foreground">Скопируй и вставь сюда</span>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-1">
          🔒 Ключ сохраняется локально и никуда не передаётся
        </p>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastActions, setLastActions] = useState<string[]>([])
  const [showKeySettings, setShowKeySettings] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const bottomRef = useRef<HTMLDivElement>(null)

  const { chatHistory, addChatMessage, tasks, streak, trackXP, workDays, dayJobs,
    journalEntries, journalProfiles, userName, apiKey, setApiKey,
    templateTasks, categories,
    updateSchedule, setDayJobs, addTask, completeTask, uncompleteTask, skipTask, setOnboardingDone } = useStore()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, loading])

  if (!mounted) return null

  if (!apiKey && !showKeySettings) {
    return <ApiKeySetup onSave={(key) => { setApiKey(key) }} />
  }

  if (showKeySettings) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
        <button
          onClick={() => setShowKeySettings(false)}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/5 transition-colors"
        >
          <X size={16} className="text-muted-foreground" />
        </button>
        <ApiKeySetup onSave={(key) => { setApiKey(key); setShowKeySettings(false) }} />
      </div>
    )
  }

  const executeActions = (actions: Action[]) => {
    const done: string[] = []
    for (const action of actions) {
      if (action.type === 'updateSchedule') {
        updateSchedule(action.month, action.workDays)
        setOnboardingDone()
        done.push(`📅 Учебные дни на ${action.month} — ${action.workDays.length} дней`)
      } else if (action.type === 'setDayJobs') {
        setDayJobs(action.jobs)
        setOnboardingDone()
        done.push(`🖥 Рабочие часы сохранены для ${action.jobs.length} дней`)
      } else if (action.type === 'addTask') {
        addTask({ title: action.title, track: action.track, date: action.date, xp: action.xp, isRecurring: false })
        done.push(`✅ Задача добавлена: ${action.title}`)
      } else if (action.type === 'completeTask') {
        completeTask(action.taskId)
        const task = tasks.find(t => t.id === action.taskId)
        done.push(`⚡ Выполнено: ${task?.title ?? action.taskId}`)
      } else if (action.type === 'uncompleteTask') {
        uncompleteTask(action.taskId)
        const task = tasks.find(t => t.id === action.taskId)
        done.push(`↩ Отменено выполнение: ${task?.title ?? action.taskId}`)
      } else if (action.type === 'skipTask') {
        skipTask(action.taskId)
        const task = tasks.find(t => t.id === action.taskId)
        done.push(`⏭ Пропущено: ${task?.title ?? action.taskId}`)
      } else if (action.type === 'resetData') {
        done.push('🗑 Данные сброшены — перезагрузка...')
        setTimeout(() => {
          localStorage.removeItem('personal-dashboard-storage')
          window.location.reload()
        }, 1200)
      }
    }
    if (done.length > 0) setLastActions(done)
  }

  const buildContext = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const dayOfWeek = format(new Date(), 'EEEE', { locale: ru })
    const todayTasks = tasks.filter(t => t.date === today)
    const upcomingTasks = tasks
      .filter(t => t.date >= today && !t.completed)
      .sort((a, b) => a.date.localeCompare(b.date))
    const recentJournal = [...journalEntries]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7)
    const poolCards = templateTasks.map(t => {
      const cat = categories.find(c => c.id === t.categoryId)
      return { id: t.id, title: t.title, track: t.categoryId, categoryLabel: cat?.label ?? t.categoryId, xp: t.xp, durationMins: t.durationMins, weeklyFrequency: t.weeklyFrequency ?? null, defaultTimeStart: t.defaultTimeStart ?? null }
    })
    return { userName, today, dayOfWeek, todayTasks, upcomingTasks, streak, trackXP, workDaysCount: workDays.length, dayJobs: dayJobs.slice(0, 14), recentJournal, journalProfiles, poolCards }
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setLastActions([])
    addChatMessage({ role: 'user', content: text })
    setLoading(true)

    try {
      const messages: Message[] = [
        ...chatHistory,
        { role: 'user', content: text },
      ]

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, context: buildContext(), apiKey }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errorMsg = data.error || 'Ошибка сервера. Проверь API ключ и интернет.'
        addChatMessage({ role: 'assistant', content: `⚠️ ${errorMsg}` })
        return
      }

      if (data.message) addChatMessage({ role: 'assistant', content: data.message })
      if (data.actions?.length > 0) executeActions(data.actions)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка'
      addChatMessage({ role: 'assistant', content: `❌ Ошибка сети: ${errorMsg}` })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
            <Bot size={16} className="text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-foreground">Помощник</h1>
            <p className="text-xs text-muted-foreground">Составляет расписание и управляет задачами</p>
          </div>
          <button
            onClick={() => setShowKeySettings(true)}
            className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-white/5 transition-colors"
            title="Сменить API ключ"
          >
            <Settings size={15} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="text-4xl">🤖</div>
            <div>
              <p className="font-medium text-foreground">Привет, {userName}!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Составлю расписание, добавлю задачи, отмечу выполненное.<br />
                Просто напиши — и я всё сделаю сам.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {[
                'Составь расписание на апрель',
                'Какие задачи на сегодня?',
                'Что мне сделать на этой неделе?',
              ].map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 mt-1">
                <Bot size={14} className="text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm whitespace-pre-wrap'
                  : 'bg-card text-foreground border border-border rounded-tl-sm'
              }`}
            >
              {msg.role === 'assistant' ? renderMessage(msg.content) : msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary mt-1">
                <User size={14} className="text-foreground" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 mt-1">
              <Bot size={14} className="text-primary" />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {lastActions.length > 0 && (
          <div className="flex flex-col gap-1">
            {lastActions.map((a, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-xs text-primary">
                <CheckCircle2 size={13} />
                {a}
              </div>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напиши сообщение... (Enter — отправить)"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition-colors"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
