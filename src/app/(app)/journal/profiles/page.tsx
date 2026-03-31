'use client'

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Brain, CalendarDays, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'

export default function JournalProfilesPage() {
  const { journalProfiles, deleteJournalProfile } = useStore()
  const router = useRouter()

  const months = Object.entries(journalProfiles).sort((a, b) => b[0].localeCompare(a[0]))
  const btnStyle = { background: 'rgba(167,139,250,0.1)', boxShadow: '0 0 0 1px rgba(129,140,248,0.2) inset', color: '#a78bfa' }

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center rounded-xl p-2 transition-all"
          style={btnStyle}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Психологические заметки</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Портреты по месяцам от ИИ-психолога</p>
        </div>
      </div>

      {months.length === 0 ? (
        <div
          className="rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
          style={{ background: 'rgba(129,140,248,0.07)', border: '1px solid rgba(129,140,248,0.15)' }}
        >
          <Brain size={32} style={{ color: '#818cf8', opacity: 0.5 }} />
          <div>
            <p className="font-semibold text-white/70">Заметок пока нет</p>
            <p className="text-sm text-muted-foreground mt-1">
              Пиши в дневник, затем нажми «Обновить базу» — ИИ создаст психологический портрет за месяц
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {months.map(([month, profile]) => {
            const monthLabel = format(new Date(month + '-01'), 'LLLL yyyy', { locale: ru })
            const updatedLabel = format(new Date(profile.updatedAt), 'd MMM yyyy, HH:mm', { locale: ru })
            return (
              <div
                key={month}
                className="rounded-2xl p-5 flex flex-col gap-3"
                style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={15} style={{ color: '#818cf8' }} />
                    <span className="font-semibold text-white capitalize">{monthLabel}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/25">обновлено {updatedLabel}</span>
                    <button
                      onClick={() => deleteJournalProfile(month)}
                      className="flex items-center justify-center rounded-lg p-1.5 opacity-40 hover:opacity-100 transition-opacity"
                      style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}
                      title="Удалить заметку"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-white/70 whitespace-pre-wrap">{profile.text}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
