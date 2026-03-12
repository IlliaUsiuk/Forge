'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ArrowLeft, Lock, Brain } from 'lucide-react'
import Link from 'next/link'
import { useStore } from '@/lib/store'

const SESSION_KEY = 'journal-unlocked'
const JOURNAL_PASSWORD = '1212'

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

export default function ProfilesPage() {
  const { journalProfiles } = useStore()
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') setUnlocked(true)
  }, [])

  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />

  const sorted = Object.entries(journalProfiles).sort(([a], [b]) => b.localeCompare(a))

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 h-full">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/journal"
          className="flex items-center justify-center h-9 w-9 rounded-xl transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset', color: 'rgba(255,255,255,0.5)' }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Заметки психолога</h1>
          <p className="text-sm text-white/40 mt-0.5">Психологический профиль по месяцам</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div
          className="rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center flex-1"
          style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(167,139,250,0.1)', boxShadow: '0 0 0 1px rgba(129,140,248,0.2) inset' }}
          >
            <Brain size={20} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <p className="font-semibold text-white/70">Заметок пока нет</p>
            <p className="text-sm text-white/30 mt-1">
              Напиши в дневник и нажми «Обновить базу» — психолог проанализирует записи
            </p>
          </div>
          <Link
            href="/journal"
            className="rounded-xl px-4 py-2 text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)', color: 'white' }}
          >
            Перейти в дневник
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sorted.map(([month, profile]) => {
            const monthLabel = format(new Date(month + '-01'), 'LLLL yyyy', { locale: ru })
            const updatedAt = format(new Date(profile.updatedAt), 'd MMM yyyy, HH:mm', { locale: ru })
            return (
              <div
                key={month}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
              >
                {/* Month header */}
                <div
                  className="px-5 py-3 flex items-center justify-between"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ background: 'rgba(167,139,250,0.15)' }}
                    >
                      <Brain size={13} style={{ color: '#a78bfa' }} />
                    </div>
                    <p className="text-sm font-bold text-white capitalize">{monthLabel}</p>
                  </div>
                  <p className="text-xs text-white/25">обновлено {updatedAt}</p>
                </div>

                {/* Profile text */}
                <div className="px-5 py-4">
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                  >
                    {profile.text}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
