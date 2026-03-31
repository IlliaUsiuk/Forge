'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, Lock } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase puts tokens in the URL hash: #access_token=...&type=recovery
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace('#', ''))
    const type = params.get('type')
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (type === 'recovery' && accessToken && refreshToken) {
      // Set the session from the URL tokens
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(() => {
        setReady(true)
      })
      return
    }

    // Fallback: listen for event (if page was already loaded)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
      else {
        // No session and no recovery token — go back to login
        setTimeout(() => router.replace('/login'), 3000)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return }
    if (password !== confirm) { setError('Пароли не совпадают'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setTimeout(() => router.push('/'), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения пароля')
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

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#060510' }}>
        <div className="w-full max-w-sm">
          {logo}
          <div className="rounded-2xl p-6 text-center space-y-3" style={{ background: '#0d0b18', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-4xl">✅</div>
            <h2 className="text-base font-semibold text-white">Пароль обновлён</h2>
            <p className="text-sm text-white/40">Перенаправляю в приложение...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#060510' }}>
        <div className="w-full max-w-sm">
          {logo}
          <div className="rounded-2xl p-6 text-center space-y-3" style={{ background: '#0d0b18', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Loader2 size={28} className="animate-spin text-primary mx-auto" />
            <p className="text-sm text-white/40">Проверяю ссылку...</p>
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
          <h2 className="text-base font-semibold text-white">Новый пароль</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Новый пароль"
                required
                autoFocus
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Повтори пароль"
                required
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
              {loading ? 'Сохраняю...' : 'Сохранить пароль'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
