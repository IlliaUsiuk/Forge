'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Loader2, Mail, Lock, User } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name.trim() } },
      })
      if (error) throw error
      // If email confirmation is off — user is logged in immediately
      if (data.session) {
        router.push('/')
        router.refresh()
      } else {
        setDone(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#060510' }}>
        <div className="text-center space-y-4">
          <div className="text-5xl">📬</div>
          <h2 className="text-xl font-bold text-white">Проверь почту</h2>
          <p className="text-sm text-white/40 max-w-xs">
            Мы отправили письмо с подтверждением на <span className="text-white/70">{email}</span>. Перейди по ссылке чтобы войти.
          </p>
          <Link href="/login" className="inline-block text-sm text-primary hover:opacity-80 transition-opacity">
            Вернуться к входу
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#060510' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <img src="/forge-logo.svg" alt="Forge" className="h-14 w-14" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Forge</h1>
            <p className="text-sm text-white/40 mt-0.5">Куй себя каждый день</p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: '#0d0b18', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-base font-semibold text-white">Создать аккаунт</h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Имя"
                required
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition-all placeholder:text-white/25"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition-all placeholder:text-white/25"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Пароль (минимум 6 символов)"
                required
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition-all placeholder:text-white/25"
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
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? 'Регистрирую...' : 'Зарегистрироваться'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/30 mt-4">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-primary hover:opacity-80 transition-opacity">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
