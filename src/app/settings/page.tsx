'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { useStore } from '@/lib/store'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function SettingsPage() {
  const { tasks, clearOldTasks } = useStore()
  const [showConfirm, setShowConfirm] = useState(false)
  const [resetStatus, setResetStatus] = useState<'idle' | 'success'>('idle')
  const [clearStatus, setClearStatus] = useState<'idle' | 'success'>('idle')

  const today = format(new Date(), 'yyyy-MM-dd')
  const oldTasksCount = tasks.filter(t => t.date < today).length

  const handleClearOld = () => {
    clearOldTasks(today)
    setClearStatus('success')
    setTimeout(() => setClearStatus('idle'), 3000)
  }

  const handleReset = () => {
    localStorage.removeItem('personal-dashboard-storage')
    setResetStatus('success')
    setShowConfirm(false)
    setTimeout(() => window.location.reload(), 1500)
  }

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Настройки</h1>
        <p className="text-sm text-muted-foreground mt-1">Управление твоими данными и предпочтениями</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div
          className="rounded-2xl p-4"
          style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
        >
          <p className="text-xs text-muted-foreground mb-1">Всего задач</p>
          <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
        </div>
        <div
          className="rounded-2xl p-4"
          style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
        >
          <p className="text-xs text-muted-foreground mb-1">Выполнено</p>
          <p className="text-2xl font-bold text-foreground">{completedTasks}</p>
        </div>
      </div>

      {/* Data Management */}
      <div
        className="rounded-2xl p-5"
        style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
      >
        <h2 className="font-semibold text-foreground mb-4">Управление данными</h2>

        <div className="space-y-3">
          {/* Clear old tasks */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">Очистить старые задачи</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Удалить задачи до сегодня ({oldTasksCount} шт.) — прогресс XP и стрик не затронуты
              </p>
            </div>
            {clearStatus === 'success' ? (
              <div className="flex items-center gap-2 text-green-400 text-sm font-semibold shrink-0">
                <CheckCircle2 size={16} />
                Готово
              </div>
            ) : (
              <button
                onClick={handleClearOld}
                disabled={oldTasksCount === 0}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-30"
                style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}
              >
                Очистить
              </button>
            )}
          </div>

          {/* Reset All */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">Сбросить всё</h3>
              <p className="text-sm text-muted-foreground mt-1">Удалить все задачи, достижения и прогресс</p>
            </div>
            {resetStatus === 'success' ? (
              <div className="flex items-center gap-2 text-green-400 text-sm font-semibold shrink-0">
                <CheckCircle2 size={16} />
                Сброшено
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(!showConfirm)}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  color: '#ef4444',
                }}
              >
                {showConfirm ? 'Отмена' : 'Сбросить'}
              </button>
            )}
          </div>

          {/* Confirmation */}
          {showConfirm && (
            <div
              className="p-4 rounded-xl flex gap-3"
              style={{ background: 'rgba(239,68,68,0.1)', borderLeft: '2px solid #ef4444' }}
            >
              <AlertTriangle size={16} style={{ color: '#ef4444', marginTop: '2px' }} className="shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-foreground font-semibold">Это действие необратимо</p>
                <p className="text-xs text-muted-foreground mt-1">Все твои данные будут удалены. Убедись, что сделал бэкап!</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all"
                    style={{
                      background: 'rgba(239,68,68,0.3)',
                      color: '#ef4444',
                    }}
                  >
                    Да, удалить всё
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div
        className="rounded-2xl p-5"
        style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
      >
        <h2 className="font-semibold text-foreground mb-4">Информация</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><span className="text-foreground font-semibold">Версия:</span> 1.0.0</p>
          <p><span className="text-foreground font-semibold">Хранилище:</span> localStorage (браузер)</p>
          <p><span className="text-foreground font-semibold">Синхронизация:</span> локальная (нет облака)</p>
          <p className="mt-3 text-xs">💡 Совет: Используй функцию экспорта на странице Статистика для резервного копирования</p>
        </div>
      </div>
    </div>
  )
}
