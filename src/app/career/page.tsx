'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Plus, Trash2, ChevronDown, ChevronUp, ExternalLink, FileText, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import type { Vacancy, VacancyStatus } from '@/lib/types'

const SPHERE_PRESETS = [
  { label: 'Дизайн',      color: '#f472b6' },
  { label: 'AI/ML',       color: '#818cf8' },
  { label: 'Медиабаинг',  color: '#fbbf24' },
  { label: 'Маркетинг',   color: '#34d399' },
  { label: 'Разработка',  color: '#60a5fa' },
  { label: 'Менеджмент',  color: '#fb923c' },
  { label: 'Другое',      color: '#a78bfa' },
]

const STATUS_CONFIG: Record<VacancyStatus, { label: string; color: string; emoji: string }> = {
  saved:     { label: 'Сохранил',    color: 'rgba(255,255,255,0.25)', emoji: '📌' },
  applied:   { label: 'Откликнулся', color: '#60a5fa',               emoji: '📤' },
  replied:   { label: 'Ответили',    color: '#fbbf24',               emoji: '📨' },
  interview: { label: 'Интервью',    color: '#818cf8',               emoji: '🎤' },
  offer:     { label: 'Оффер',       color: '#34d399',               emoji: '✅' },
  rejected:  { label: 'Отказ',       color: '#f87171',               emoji: '❌' },
}

const STATUS_ORDER: VacancyStatus[] = ['saved', 'applied', 'replied', 'interview', 'offer', 'rejected']
const STATUS_FILTERS: (VacancyStatus | 'all')[] = ['all', 'saved', 'applied', 'replied', 'interview', 'offer', 'rejected']

const emptyVacancy = { company: '', position: '', sphere: SPHERE_PRESETS[0].label, color: SPHERE_PRESETS[0].color, status: 'saved' as VacancyStatus }

export default function CareerPage() {
  const { vacancies, cvTemplates, addVacancy, updateVacancy, deleteVacancy, addCVTemplate, updateCVTemplate, deleteCVTemplate } = useStore()

  const [tab, setTab] = useState<'vacancies' | 'cvs'>('vacancies')
  const [statusFilter, setStatusFilter] = useState<VacancyStatus | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newVac, setNewVac] = useState(emptyVacancy)

  const [expandedCvId, setExpandedCvId] = useState<string | null>(null)
  const [showAddCv, setShowAddCv] = useState(false)
  const [newCv, setNewCv] = useState({ title: '', content: '' })

  const [confirmDeleteVacId, setConfirmDeleteVacId] = useState<string | null>(null)
  const [confirmDeleteCvId, setConfirmDeleteCvId] = useState<string | null>(null)

  const filtered = vacancies.filter(v => statusFilter === 'all' || v.status === statusFilter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const stats = {
    total: vacancies.length,
    applied: vacancies.filter(v => v.status !== 'saved').length,
    interview: vacancies.filter(v => v.status === 'interview' || v.status === 'offer').length,
    offer: vacancies.filter(v => v.status === 'offer').length,
  }

  function handleAddVacancy() {
    if (!newVac.company.trim() || !newVac.position.trim()) return
    addVacancy(newVac)
    setNewVac(emptyVacancy)
    setShowAddForm(false)
  }

  function handleAddCv() {
    if (!newCv.title.trim()) return
    addCVTemplate(newCv)
    setNewCv({ title: '', content: '' })
    setShowAddCv(false)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Карьера</h1>
          <p className="text-sm text-white/40 mt-0.5">Вакансии и сопроводительные письма</p>
        </div>
        {/* Stats */}
        <div className="flex items-center gap-2">
          {[
            { label: 'Всего', value: stats.total, color: 'rgba(255,255,255,0.3)' },
            { label: 'Откликов', value: stats.applied, color: '#60a5fa' },
            { label: 'Интервью', value: stats.interview, color: '#818cf8' },
            { label: 'Офферов', value: stats.offer, color: '#34d399' },
          ].map(s => (
            <div
              key={s.label}
              className="hidden sm:flex flex-col items-center rounded-xl px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.03)', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
            >
              <span className="text-base font-black" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[10px] text-white/30 font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.03)', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}>
        {(['vacancies', 'cvs'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all"
            style={tab === t
              ? { background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(167,139,250,0.1))', color: '#a78bfa', boxShadow: '0 0 0 1px rgba(129,140,248,0.2) inset' }
              : { color: 'rgba(255,255,255,0.3)' }}
          >
            {t === 'vacancies' ? `Вакансии (${vacancies.length})` : `Мои CV (${cvTemplates.length})`}
          </button>
        ))}
      </div>

      {/* ── VACANCIES TAB ── */}
      {tab === 'vacancies' && (
        <div className="space-y-4">

          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map(s => {
              const cfg = s !== 'all' ? STATUS_CONFIG[s] : null
              const active = statusFilter === s
              const count = s === 'all' ? vacancies.length : vacancies.filter(v => v.status === s).length
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold transition-all"
                  style={{
                    background: active ? (cfg ? `${cfg.color}22` : 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.03)',
                    color: active ? (cfg ? cfg.color : 'white') : 'rgba(255,255,255,0.3)',
                    boxShadow: active ? `0 0 0 1px ${cfg ? cfg.color + '40' : 'rgba(255,255,255,0.15)'} inset` : '0 0 0 1px rgba(255,255,255,0.06) inset',
                  }}
                >
                  {cfg?.emoji} {cfg ? cfg.label : 'Все'} {count > 0 && <span className="opacity-60">({count})</span>}
                </button>
              )
            })}
          </div>

          {/* Add vacancy form */}
          {showAddForm ? (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(167,139,250,0.15) inset' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Новая вакансия</span>
                <button onClick={() => setShowAddForm(false)}><X size={14} className="text-white/30 hover:text-white/60" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Компания"
                  value={newVac.company}
                  onChange={e => setNewVac(p => ({ ...p, company: e.target.value }))}
                  className="rounded-xl px-3 py-2.5 text-sm outline-none text-white placeholder:text-white/25"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <input
                  placeholder="Должность"
                  value={newVac.position}
                  onChange={e => setNewVac(p => ({ ...p, position: e.target.value }))}
                  className="rounded-xl px-3 py-2.5 text-sm outline-none text-white placeholder:text-white/25"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
              {/* Sphere picker */}
              <div>
                <p className="text-[10px] text-white/30 font-semibold mb-1.5 uppercase tracking-wide">Сфера</p>
                <div className="flex flex-wrap gap-1.5">
                  {SPHERE_PRESETS.map(sp => (
                    <button
                      key={sp.label}
                      onClick={() => setNewVac(p => ({ ...p, sphere: sp.label, color: sp.color }))}
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold transition-all"
                      style={{
                        background: newVac.sphere === sp.label ? `${sp.color}25` : 'rgba(255,255,255,0.04)',
                        color: newVac.sphere === sp.label ? sp.color : 'rgba(255,255,255,0.35)',
                        border: `1px solid ${newVac.sphere === sp.label ? sp.color + '50' : 'rgba(255,255,255,0.07)'}`,
                      }}
                    >
                      {sp.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddVacancy}
                disabled={!newVac.company.trim() || !newVac.position.trim()}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
              >
                Добавить
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full rounded-2xl py-3 text-sm font-semibold text-white/30 hover:text-white/60 transition-colors flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
            >
              <Plus size={15} /> Добавить вакансию
            </button>
          )}

          {/* Vacancy list */}
          {filtered.length === 0 && (
            <div className="rounded-2xl p-8 text-center" style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}>
              <p className="text-2xl mb-2">💼</p>
              <p className="text-sm text-white/30">Нет вакансий{statusFilter !== 'all' ? ' с таким статусом' : ''}</p>
            </div>
          )}

          <div className="space-y-2">
            {filtered.map(vac => (
              <VacancyCard
                key={vac.id}
                vac={vac}
                cvTemplates={cvTemplates}
                expanded={expandedId === vac.id}
                onToggle={() => setExpandedId(expandedId === vac.id ? null : vac.id)}
                onUpdate={(changes) => updateVacancy(vac.id, changes)}
                onDelete={() => setConfirmDeleteVacId(vac.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── CVS TAB ── */}
      {tab === 'cvs' && (
        <div className="space-y-3">

          {/* Add CV form */}
          {showAddCv ? (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(167,139,250,0.15) inset' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Новое CV</span>
                <button onClick={() => setShowAddCv(false)}><X size={14} className="text-white/30 hover:text-white/60" /></button>
              </div>
              <input
                placeholder="Название (напр. CV Продакт-дизайнер v2)"
                value={newCv.title}
                onChange={e => setNewCv(p => ({ ...p, title: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-white placeholder:text-white/25"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <textarea
                placeholder="Текст CV / сопроводительного письма..."
                value={newCv.content}
                onChange={e => setNewCv(p => ({ ...p, content: e.target.value }))}
                rows={6}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-white placeholder:text-white/25 resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <button
                onClick={handleAddCv}
                disabled={!newCv.title.trim()}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
              >
                Сохранить
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddCv(true)}
              className="w-full rounded-2xl py-3 text-sm font-semibold text-white/30 hover:text-white/60 transition-colors flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
            >
              <Plus size={15} /> Добавить CV
            </button>
          )}

          {cvTemplates.length === 0 && !showAddCv && (
            <div className="rounded-2xl p-8 text-center" style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}>
              <p className="text-2xl mb-2">📄</p>
              <p className="text-sm text-white/30">Нет сохранённых CV — добавь первое</p>
            </div>
          )}

          {cvTemplates.map(cv => {
            const usedIn = vacancies.filter(v => v.cvId === cv.id)
            const isExpanded = expandedCvId === cv.id
            return (
              <div
                key={cv.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
              >
                {/* CV header */}
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(167,139,250,0.12)' }}>
                    <FileText size={16} style={{ color: '#a78bfa' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {isExpanded ? (
                      <input
                        value={cv.title}
                        onChange={e => updateCVTemplate(cv.id, { title: e.target.value })}
                        className="w-full bg-transparent text-sm font-bold text-white outline-none border-b border-white/10 pb-0.5"
                      />
                    ) : (
                      <p className="text-sm font-bold text-white truncate">{cv.title}</p>
                    )}
                    <p className="text-[11px] text-white/30 mt-0.5">
                      {format(new Date(cv.createdAt), 'd MMM yyyy', { locale: ru })}
                      {usedIn.length > 0 && ` · используется в ${usedIn.length} вакансиях`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setConfirmDeleteCvId(cv.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg transition-all hover:bg-red-500/10"
                      style={{ color: 'rgba(248,113,113,0.5)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => setExpandedCvId(isExpanded ? null : cv.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* CV content */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <textarea
                      value={cv.content}
                      onChange={e => updateCVTemplate(cv.id, { content: e.target.value })}
                      rows={10}
                      placeholder="Текст CV / сопроводительного письма..."
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-white/80 placeholder:text-white/20 resize-none"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                    />
                    {usedIn.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-white/25 font-semibold uppercase tracking-wide mb-1.5">Прикреплено к вакансиям</p>
                        <div className="flex flex-wrap gap-1.5">
                          {usedIn.map(v => (
                            <span
                              key={v.id}
                              className="rounded-lg px-2 py-0.5 text-xs"
                              style={{ background: `${v.color}18`, color: v.color, border: `1px solid ${v.color}30` }}
                            >
                              {v.company} — {v.position}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {/* Confirm delete vacancy */}
      {confirmDeleteVacId && (() => {
        const vac = vacancies.find(v => v.id === confirmDeleteVacId)
        return vac ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="rounded-2xl p-6 w-full max-w-sm space-y-4" style={{ background: '#111118', boxShadow: '0 0 0 1px rgba(248,113,113,0.2) inset' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(248,113,113,0.12)' }}>
                  <Trash2 size={18} style={{ color: '#f87171' }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Удалить вакансию?</p>
                  <p className="text-xs text-white/40 mt-0.5">{vac.company} — {vac.position}</p>
                </div>
              </div>
              <p className="text-xs text-white/40">Это действие нельзя отменить. Все данные по этой вакансии будут удалены.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDeleteVacId(null)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    deleteVacancy(confirmDeleteVacId)
                    if (expandedId === confirmDeleteVacId) setExpandedId(null)
                    setConfirmDeleteVacId(null)
                  }}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ) : null
      })()}

      {/* Confirm delete CV */}
      {confirmDeleteCvId && (() => {
        const cv = cvTemplates.find(c => c.id === confirmDeleteCvId)
        return cv ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="rounded-2xl p-6 w-full max-w-sm space-y-4" style={{ background: '#111118', boxShadow: '0 0 0 1px rgba(248,113,113,0.2) inset' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(248,113,113,0.12)' }}>
                  <Trash2 size={18} style={{ color: '#f87171' }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Удалить CV?</p>
                  <p className="text-xs text-white/40 mt-0.5">{cv.title}</p>
                </div>
              </div>
              <p className="text-xs text-white/40">Это действие нельзя отменить. CV будет откреплено от всех вакансий.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDeleteCvId(null)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    deleteCVTemplate(confirmDeleteCvId)
                    if (expandedCvId === confirmDeleteCvId) setExpandedCvId(null)
                    setConfirmDeleteCvId(null)
                  }}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ) : null
      })()}
    </div>
  )
}

function VacancyCard({
  vac, cvTemplates, expanded, onToggle, onUpdate, onDelete,
}: {
  vac: Vacancy
  cvTemplates: { id: string; title: string }[]
  expanded: boolean
  onToggle: () => void
  onUpdate: (changes: Partial<Vacancy>) => void
  onDelete: () => void
}) {
  const statusCfg = STATUS_CONFIG[vac.status]

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#0f0f1a',
        boxShadow: `0 0 0 1px rgba(255,255,255,0.06) inset, -3px 0 0 0 ${vac.color} inset`,
      }}
    >
      {/* Card header */}
      <div className="px-4 py-3 flex items-center gap-3 cursor-pointer" onClick={onToggle}>
        {/* Sphere dot */}
        <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: vac.color }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-white truncate">{vac.company}</p>
            <span className="text-white/30 text-sm">—</span>
            <p className="text-sm text-white/70 truncate">{vac.position}</p>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-[10px] font-semibold rounded-md px-1.5 py-0.5"
              style={{ background: `${vac.color}18`, color: vac.color, border: `1px solid ${vac.color}30` }}
            >
              {vac.sphere}
            </span>
            <span
              className="text-[10px] font-semibold rounded-md px-1.5 py-0.5"
              style={{ background: `${statusCfg.color}18`, color: statusCfg.color, border: `1px solid ${statusCfg.color}30` }}
            >
              {statusCfg.emoji} {statusCfg.label}
            </span>
            {vac.appliedAt && (
              <span className="text-[10px] text-white/25">
                {format(new Date(vac.appliedAt + 'T12:00:00'), 'd MMM', { locale: ru })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="flex h-7 w-7 items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10"
            style={{ color: 'rgba(248,113,113,0.5)' }}
          >
            <Trash2 size={12} />
          </button>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </div>
      </div>

      {/* Status stepper */}
      <div className="px-4 pb-3 flex items-center gap-0">
        {STATUS_ORDER.map((s, i) => {
          const cfg = STATUS_CONFIG[s]
          const currentIdx = STATUS_ORDER.indexOf(vac.status)
          const isActive = i <= currentIdx
          const isCurrent = s === vac.status
          const isTerminal = vac.status === 'offer' || vac.status === 'rejected'
          // hide offer/rejected steps when not reached
          if ((s === 'offer' || s === 'rejected') && !isTerminal && vac.status !== s) return null
          return (
            <div key={s} className="flex items-center flex-1">
              <button
                onClick={e => { e.stopPropagation(); onUpdate({ status: s }) }}
                className="flex flex-col items-center gap-0.5 flex-1 transition-all hover:opacity-80"
                title={cfg.label}
              >
                <div
                  className="h-1.5 w-full rounded-full transition-all"
                  style={{ background: isActive ? cfg.color : 'rgba(255,255,255,0.08)' }}
                />
                {isCurrent && (
                  <span className="text-[9px] font-bold" style={{ color: cfg.color }}>{cfg.emoji}</span>
                )}
              </button>
              {i < STATUS_ORDER.length - 2 && s !== 'interview' && (
                <div className="w-0.5" />
              )}
            </div>
          )
        })}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">

          {/* URL + Salary */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-white/30 font-semibold uppercase tracking-wide block mb-1">Ссылка на вакансию</label>
              <div className="flex items-center gap-1">
                <input
                  value={vac.url ?? ''}
                  onChange={e => onUpdate({ url: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none text-white/80 placeholder:text-white/20"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                />
                {vac.url && (
                  <a href={vac.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                    <ExternalLink size={13} className="text-white/30 hover:text-white/60" />
                  </a>
                )}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-white/30 font-semibold uppercase tracking-wide block mb-1">Зарплата</label>
              <input
                value={vac.salary ?? ''}
                onChange={e => onUpdate({ salary: e.target.value })}
                placeholder="100 000 ₴"
                className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none text-white/80 placeholder:text-white/20"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              />
            </div>
          </div>

          {/* Date applied + CV used */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-white/30 font-semibold uppercase tracking-wide block mb-1">Дата отклика</label>
              <input
                type="date"
                value={vac.appliedAt ?? ''}
                onChange={e => onUpdate({ appliedAt: e.target.value })}
                className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none text-white/80"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className="text-[10px] text-white/30 font-semibold uppercase tracking-wide block mb-1">Какое CV отправил</label>
              <select
                value={vac.cvId ?? ''}
                onChange={e => onUpdate({ cvId: e.target.value || undefined })}
                className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none text-white/80"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', colorScheme: 'dark' }}
              >
                <option value="">— не выбрано —</option>
                {cvTemplates.map(cv => (
                  <option key={cv.id} value={cv.id}>{cv.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cover letter */}
          <div>
            <label className="text-[10px] text-white/30 font-semibold uppercase tracking-wide block mb-1">Сопроводительное письмо</label>
            <textarea
              value={vac.coverLetter ?? ''}
              onChange={e => onUpdate({ coverLetter: e.target.value })}
              rows={3}
              placeholder="Что написал в отклике..."
              className="w-full rounded-lg px-2.5 py-2 text-xs outline-none text-white/80 placeholder:text-white/20 resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] text-white/30 font-semibold uppercase tracking-wide block mb-1">Заметки</label>
            <textarea
              value={vac.notes ?? ''}
              onChange={e => onUpdate({ notes: e.target.value })}
              rows={2}
              placeholder="Важные детали, контакт, требования..."
              className="w-full rounded-lg px-2.5 py-2 text-xs outline-none text-white/80 placeholder:text-white/20 resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            />
          </div>

          {/* Feedback */}
          <div>
            <label className="text-[10px] text-white/30 font-semibold uppercase tracking-wide block mb-1">Фидбек</label>
            <textarea
              value={vac.feedback ?? ''}
              onChange={e => onUpdate({ feedback: e.target.value })}
              rows={2}
              placeholder="Что ответили, как прошло интервью..."
              className="w-full rounded-lg px-2.5 py-2 text-xs outline-none text-white/80 placeholder:text-white/20 resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            />
          </div>

          {/* Lessons */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide block mb-1" style={{ color: 'rgba(251,146,60,0.5)' }}>Что можно улучшить / ошибка</label>
            <textarea
              value={vac.lessons ?? ''}
              onChange={e => onUpdate({ lessons: e.target.value })}
              rows={2}
              placeholder="Что сделал не так? Что в следующий раз сделаю иначе?"
              className="w-full rounded-lg px-2.5 py-2 text-xs outline-none text-white/80 placeholder:text-white/20 resize-none"
              style={{ background: 'rgba(251,146,60,0.04)', border: '1px solid rgba(251,146,60,0.12)' }}
            />
          </div>

          {/* Delete button */}
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:bg-red-500/10"
            style={{ color: 'rgba(248,113,113,0.6)' }}
          >
            <Trash2 size={12} /> Удалить вакансию
          </button>
        </div>
      )}
    </div>
  )
}
