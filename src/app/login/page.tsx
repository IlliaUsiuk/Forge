'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Loader2, Mail, Lock, ArrowLeft } from 'lucide-react'

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Неверный email или пароль'
  if (msg.includes('Email not confirmed')) return 'Email не подтверждён — проверь почту'
  if (msg.includes('Too many requests')) return 'Слишком много попыток, подожди немного'
  if (msg.includes('User not found')) return 'Аккаунт с таким email не найден'
  if (msg.includes('Error sending recovery email')) return 'Не удалось отправить письмо — превышен лимит или email не зарегистрирован'
  if (msg.includes('rate limit')) return 'Превышен лимит отправки писем, попробуй через час'
  if (msg.includes('For security purposes')) return 'Подожди немного перед следующей попыткой'
  return msg
}

const REMEMBER_KEY = 'forge-remember-email'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem(REMEMBER_KEY) ?? '') : ''
  )
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(() =>
    typeof window !== 'undefined' ? !!localStorage.getItem(REMEMBER_KEY) : false
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin(e: { preventDefault(): void }) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (remember) localStorage.setItem(REMEMBER_KEY, email)
      else localStorage.removeItem(REMEMBER_KEY)
      router.push('/')
      router.refresh()
    } catch (e) {
      setError(translateError(e instanceof Error ? e.message : 'Ошибка входа'))
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e: { preventDefault(): void }) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setResetSent(true)
    } catch (e) {
      setError(translateError(e instanceof Error ? e.message : 'Ошибка сброса пароля'))
    } finally {
      setLoading(false)
    }
  }

  const logo = (
    <div className="flex flex-col items-center gap-3 mb-8">
      <img src="/forge-logo.svg" alt="Forge" className="h-14 w-14" />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Forge</h1>
        <p className="text-sm text-white/40 mt-0.5">Куй себя каждый день</p>
      </div>
    </div>
  )

  if (resetSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#060510' }}>
        <div className="w-full max-w-sm">
          {logo}
          <div className="rounded-2xl p-6 text-center space-y-4" style={{ background: '#0d0b18', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-4xl">📬</div>
            <h2 className="text-base font-semibold text-white">Письмо отправлено</h2>
            <p className="text-sm text-white/40">
              Проверь почту <span className="text-white/70">{email}</span> и перейди по ссылке для сброса пароля.
            </p>
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
            >
              Открыть Gmail
            </a>
            <button
              onClick={() => { setMode('login'); setResetSent(false) }}
              className="text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              Вернуться к входу
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#060510' }}>
      <div className="w-full max-w-sm">
        {logo}

        <div className="rounded-2xl p-6 space-y-4" style={{ background: '#0d0b18', border: '1px solid rgba(255,255,255,0.07)' }}>

          {mode === 'login' ? (
            <>
              <h2 className="text-base font-semibold text-white">Войти</h2>
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Пароль"
                    required
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => setRemember(r => !r)}
                      className="flex h-4 w-4 items-center justify-center rounded transition-all"
                      style={{
                        background: remember ? 'linear-gradient(135deg, #818cf8, #a78bfa)' : 'rgba(255,255,255,0.06)',
                        border: remember ? 'none' : '1px solid rgba(255,255,255,0.15)',
                      }}
                    >
                      {remember && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-white/40">Запомнить меня</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setError(null) }}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors"
                  >
                    Забыли пароль?
                  </button>
                </div>

                {error && (
                  <p className="text-xs text-red-400 rounded-xl px-3 py-2" style={{ background: 'rgba(239,68,68,0.08)' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? 'Вхожу...' : 'Войти'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setMode('login'); setError(null) }}
                  className="text-white/30 hover:text-white/60 transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <h2 className="text-base font-semibold text-white">Восстановление пароля</h2>
              </div>
              <p className="text-xs text-white/35">Введи свой email — мы пришлём ссылку для сброса пароля.</p>
              <form onSubmit={handleReset} className="space-y-3">
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    autoFocus
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 rounded-xl px-3 py-2" style={{ background: 'rgba(239,68,68,0.08)' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? 'Отправляю...' : 'Отправить ссылку'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-white/30 mt-4">
          Нет аккаунта?{' '}
          <Link href="/register" className="text-primary hover:opacity-80 transition-opacity">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}
