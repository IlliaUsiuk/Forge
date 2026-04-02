'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { signOut } from '@/lib/sync'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, Pencil, X, Lock, Camera, AlertTriangle, Eye, EyeOff, LogOut } from 'lucide-react'

const RANK_NAMES = ['Новичок', 'Стажёр', 'Специалист', 'Профи', 'Эксперт', 'Мастер', 'Гуру', 'Легенда', 'Элита']
const XP_PER_LEVEL = 200


export default function ProfilePage() {
  const router = useRouter()
  const {
    userName, setUserName,
    avatarUrl, setAvatarUrl,
    trackXP, streak, tasks,
    scheduleSettings, setScheduleSettings,
    apiKey, setApiKey,
  } = useStore()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(userName)
  const [nameSaved, setNameSaved] = useState(false)
  const [draftApiKey, setDraftApiKey] = useState(apiKey)
  const [apiKeySaved, setApiKeySaved] = useState(false)

  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const [showReset, setShowReset] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalXP = Object.values(trackXP).reduce((a, b) => a + b, 0)
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1
  const xpInLevel = totalXP % XP_PER_LEVEL
  const levelProgress = (xpInLevel / XP_PER_LEVEL) * 100
  const rankIndex = Math.min(Math.floor((level - 1) / 3), RANK_NAMES.length - 1)
  const rankName = RANK_NAMES[rankIndex]
  const completedTasks = tasks.filter(t => t.completed).length
  const firstLetter = userName.trim().charAt(0).toUpperCase() || '?'

  function saveName() {
    setUserName(draftName)
    setEditingName(false)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (newPw.length < 6) { setPwError('Минимум 6 символов'); return }
    if (newPw !== confirmPw) { setPwError('Пароли не совпадают'); return }
    setPwLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      setNewPw(''); setConfirmPw('')
      setPwSaved(true)
      setTimeout(() => setPwSaved(false), 2500)
    } catch (e) {
      setPwError(e instanceof Error ? e.message : 'Ошибка смены пароля')
    } finally {
      setPwLoading(false)
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatarUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleReset() {
    localStorage.removeItem('personal-dashboard-storage')
    setTimeout(() => window.location.reload(), 300)
  }

  return (
    <div className="p-6 space-y-5">

      <h1 className="text-2xl font-bold text-foreground">Профиль</h1>

      {/* Avatar + Name — full width */}
      <div
        className="rounded-2xl p-6 flex items-center gap-6"
        style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-black text-white overflow-hidden"
            style={{ background: avatarUrl ? undefined : 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              : firstLetter
            }
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-lg transition-opacity hover:opacity-80"
            style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
            title="Загрузить фото"
          >
            <Camera size={13} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2 max-w-xs">
              <input
                autoFocus
                value={draftName}
                onChange={e => setDraftName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveName()
                  if (e.key === 'Escape') { setDraftName(userName); setEditingName(false) }
                }}
                maxLength={20}
                placeholder="Твоё имя"
                className="flex-1 min-w-0 rounded-xl px-3 py-2 text-lg font-semibold text-foreground outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(129,140,248,0.4)' }}
              />
              <button onClick={saveName} className="shrink-0 rounded-lg p-2 text-white" style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}>
                <CheckCircle2 size={16} />
              </button>
              <button onClick={() => { setDraftName(userName); setEditingName(false) }} className="shrink-0 rounded-lg p-2 text-muted-foreground hover:text-foreground" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div>
                <p className="text-2xl font-bold text-foreground">{userName}</p>
                <p className="text-sm text-muted-foreground">{userName}</p>
              </div>
              <button
                onClick={() => { setDraftName(userName); setEditingName(true) }}
                className="ml-1 shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
              >
                <Pencil size={15} />
              </button>
              {nameSaved && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-400">
                  <CheckCircle2 size={12} /> Сохранено
                </span>
              )}
            </div>
          )}
          {avatarUrl && (
            <button onClick={() => setAvatarUrl('')} className="mt-2 text-xs text-muted-foreground hover:text-red-400 transition-colors">
              Удалить фото
            </button>
          )}
        </div>

        {/* Rank badge */}
        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-base font-black text-white"
            style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
          >
            {level}
          </div>
          <p className="text-xs text-muted-foreground">{rankName}</p>
        </div>
      </div>

      {/* Stats — 4 cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Всего XP', value: totalXP, color: '#818cf8', bg: 'linear-gradient(135deg, #0d0d1c, #08080f)', glow: 'rgba(129,140,248,0.12)' },
          { label: 'Уровень', value: `${level} · ${rankName}`, color: '#a78bfa', bg: 'linear-gradient(135deg, #100f1e, #090810)', glow: 'rgba(167,139,250,0.12)' },
          { label: 'Стрик', value: `${streak.current} дн.`, color: '#fb923c', bg: 'linear-gradient(135deg, #1c0e08, #130b06)', glow: 'rgba(251,146,60,0.12)' },
          { label: 'Задач выполнено', value: completedTasks, color: '#34d399', bg: 'linear-gradient(135deg, #0a1812, #060f0c)', glow: 'rgba(52,211,153,0.12)' },
        ].map(({ label, value, color, bg, glow }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{ background: bg, boxShadow: `0 8px 32px ${glow}, 0 0 0 1px ${glow} inset` }}
          >
            <p className="text-lg sm:text-2xl font-black leading-tight break-words" style={{ color }}>{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Level progress — full width */}
      <div
        className="rounded-2xl px-5 py-4"
        style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">{rankName} · ур. {level}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{xpInLevel} / {XP_PER_LEVEL} XP</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${levelProgress}%`, background: 'linear-gradient(90deg, #818cf8, #a78bfa)', boxShadow: '0 0 10px rgba(129,140,248,0.5)' }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-right" style={{ color: 'rgba(255,255,255,0.2)' }}>
          ещё {XP_PER_LEVEL - xpInLevel} XP до уровня {level + 1}
        </p>
      </div>

      {/* 2-column grid */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">

        {/* Change password */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Lock size={15} className="text-primary" />
            <h2 className="font-semibold text-foreground">Сменить пароль</h2>
          </div>

          {pwSaved ? (
            <div className="flex items-center gap-2 py-4 text-green-400 text-sm font-medium">
              <CheckCircle2 size={16} /> Пароль успешно изменён
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-3">
              {[
                { label: 'Новый пароль', value: newPw, setter: setNewPw },
                { label: 'Повтори новый', value: confirmPw, setter: setConfirmPw },
              ].map(({ label, value, setter }, i) => (
                <div key={i} className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={value}
                    onChange={e => setter(e.target.value)}
                    placeholder={label}
                    autoComplete="new-password"
                    className="w-full rounded-xl px-3 py-2.5 pr-10 text-sm text-foreground outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              ))}
              {pwError && <p className="text-xs text-red-400">{pwError}</p>}
              <button
                type="submit"
                disabled={pwLoading}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
              >
                {pwLoading ? 'Сохраняю...' : 'Изменить пароль'}
              </button>
            </form>
          )}
        </div>

        {/* Reset */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-foreground">Обнулить данные</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Удалит все задачи, XP, стрик и настройки</p>
            </div>
            <button
              onClick={() => setShowReset(v => !v)}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
            >
              {showReset ? 'Отмена' : 'Сбросить'}
            </button>
          </div>

          {showReset && (
            <div
              className="mt-4 rounded-xl p-4 flex gap-3"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Это необратимо</p>
                <p className="text-xs text-muted-foreground mt-0.5">Все данные удалятся без восстановления.</p>
                <button
                  onClick={handleReset}
                  className="mt-3 w-full rounded-lg py-2 text-xs font-semibold"
                  style={{ background: 'rgba(239,68,68,0.25)', color: '#ef4444' }}
                >
                  Да, удалить всё
                </button>
              </div>
            </div>
          )}
        </div>
        {/* API Key */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}>
        <h2 className="text-base font-semibold text-foreground">API ключ помощника</h2>
        <input
          type="password"
          value={draftApiKey}
          onChange={e => { setDraftApiKey(e.target.value); setApiKeySaved(false) }}
          placeholder="sk-ant-api03-..."
          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
        />
        {apiKey && <p className="text-xs text-muted-foreground">Ключ сохранён: {apiKey.slice(0, 12)}…</p>}
        <button
          onClick={() => { setApiKey(draftApiKey.trim()); setApiKeySaved(true); setTimeout(() => setApiKeySaved(false), 2000) }}
          disabled={!draftApiKey.trim() || draftApiKey.trim() === apiKey}
          className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-40"
          style={{ background: apiKeySaved ? 'rgba(52,211,153,0.15)' : 'rgba(129,140,248,0.15)', color: apiKeySaved ? '#34d399' : '#818cf8', border: `1px solid ${apiKeySaved ? 'rgba(52,211,153,0.3)' : 'rgba(129,140,248,0.3)'}` }}
        >
          {apiKeySaved ? 'Сохранено ✓' : 'Сохранить'}
        </button>
      </div>

        {/* Schedule Settings */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}>
        <h2 className="text-base font-semibold text-foreground">Настройки расписания</h2>
        <div className="space-y-3">
          {[
            { label: 'Время подъёма', type: 'time', value: scheduleSettings.wakeTime, onChange: (v: string) => setScheduleSettings({ wakeTime: v }), extra: { colorScheme: 'dark' } },
            { label: 'Утренняя подготовка (мин)', type: 'number', value: String(scheduleSettings.prepMin), onChange: (v: string) => setScheduleSettings({ prepMin: Number(v) }), min: 0, max: 240 },
            { label: 'Дорога до работы (мин)', type: 'number', value: String(scheduleSettings.commuteToWorkMin), onChange: (v: string) => setScheduleSettings({ commuteToWorkMin: Number(v) }), min: 0, max: 240 },
            { label: 'Буфер перед выездом (мин)', type: 'number', value: String(scheduleSettings.departBufMin), onChange: (v: string) => setScheduleSettings({ departBufMin: Number(v) }), min: 0, max: 60 },
          ].map(({ label, type, value, onChange, ...rest }) => (
            <div key={label}>
              <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
              <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', ...(rest.extra ?? {}) }}
                {...(rest.min !== undefined ? { min: rest.min, max: rest.max } : {})}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Используется для расчёта времени выезда на работу</p>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-medium transition-all hover:brightness-125 w-full"
        style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
      >
        <LogOut size={16} />
        Выйти из аккаунта
      </button>

    </div>

    </div>
  )
}
