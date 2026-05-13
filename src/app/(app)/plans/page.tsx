'use client'

import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { uk as ukLocale } from 'date-fns/locale'
import { Plus, Pin, PinOff, Trash2, CheckCheck, ChevronDown, ChevronRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useT } from '@/lib/i18n'
import type { Plan } from '@/lib/types'

export default function PlansPage() {
  const { t, lang } = useT()
  const tp = t.plans
  const dateLocale = lang === 'uk' ? ukLocale : enUS

  const {
    plans,
    createPlan, addPlanStep, updatePlanStep,
    togglePlanStepPin, deletePlanStep, completePlan, deletePlan,
  } = useStore()

  const [mounted, setMounted] = useState(false)
  const [newStepText, setNewStepText] = useState('')
  const [editingStep, setEditingStep] = useState<{ planId: string; stepId: string } | null>(null)
  const [editingText, setEditingText] = useState('')
  const [expandedPast, setExpandedPast] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const activePlan = plans.find(p => !p.completed) ?? null
  const pastPlans = [...plans.filter(p => p.completed)].sort((a, b) =>
    (b.endDate ?? b.createdAt).localeCompare(a.endDate ?? a.createdAt)
  )

  function formatDate(d: string) {
    return format(new Date(d + 'T12:00:00'), 'd MMM yyyy', { locale: dateLocale })
  }

  function handleAddStep(e: React.FormEvent) {
    e.preventDefault()
    if (!activePlan || !newStepText.trim()) return
    addPlanStep(activePlan.id, newStepText.trim())
    setNewStepText('')
    inputRef.current?.focus()
  }

  function startEdit(planId: string, stepId: string, text: string) {
    setEditingStep({ planId, stepId })
    setEditingText(text)
  }

  function commitEdit() {
    if (!editingStep) return
    const trimmed = editingText.trim()
    if (trimmed) updatePlanStep(editingStep.planId, editingStep.stepId, trimmed)
    setEditingStep(null)
  }

  function togglePast(id: string) {
    setExpandedPast(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function pinnedCount(plan: Plan) {
    return plan.steps.filter(s => s.pinned).length
  }

  return (
    <main className="flex min-h-screen flex-col px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">{tp.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tp.subtitle}</p>
        </div>

        {/* Active plan */}
        {!activePlan ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-8 py-12 text-center">
            <p className="text-muted-foreground">{tp.noActivePlan}</p>
            <button
              onClick={createPlan}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
            >
              <Plus size={16} />
              {tp.createFirst}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5">
            {/* Plan header */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {tp.activePlan}
                </span>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {tp.started}: {formatDate(activePlan.startDate)}
                </p>
              </div>
              <button
                onClick={() => { if (confirm(tp.deletePlan + '?')) deletePlan(activePlan.id) }}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 size={15} />
              </button>
            </div>

            {/* Steps */}
            {activePlan.steps.length > 0 && (
              <ol className="mb-4 space-y-1">
                {activePlan.steps.map((step, idx) => {
                  // sequential number counts only pinned steps before this one
                  const num = step.pinned
                    ? activePlan.steps.slice(0, idx + 1).filter(s => s.pinned).length
                    : null
                  const isEditing = editingStep?.planId === activePlan.id && editingStep.stepId === step.id

                  return (
                    <li
                      key={step.id}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                        step.pinned ? 'hover:bg-muted/40' : 'opacity-50 hover:bg-muted/20'
                      }`}
                    >
                      {/* Number badge */}
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                        style={step.pinned ? {
                          background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(167,139,250,0.1))',
                          color: '#818cf8',
                        } : {
                          background: 'rgba(128,128,128,0.1)',
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        {num ?? '–'}
                      </span>

                      {/* Text */}
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editingText}
                          onChange={e => setEditingText(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitEdit()
                            if (e.key === 'Escape') setEditingStep(null)
                          }}
                          className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
                        />
                      ) : (
                        <span
                          className={`flex-1 cursor-text text-sm ${step.pinned ? 'text-foreground' : 'text-muted-foreground line-through'}`}
                          onDoubleClick={() => startEdit(activePlan.id, step.id, step.text)}
                        >
                          {step.text}
                        </span>
                      )}

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => togglePlanStepPin(activePlan.id, step.id)}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                          title={step.pinned ? tp.unpin : tp.pin}
                        >
                          {step.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                        </button>
                        <button
                          onClick={() => deletePlanStep(activePlan.id, step.id)}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                          title={tp.deleteStep}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}

            {/* Add step */}
            <form onSubmit={handleAddStep} className="mb-4 flex gap-2">
              <input
                ref={inputRef}
                value={newStepText}
                onChange={e => setNewStepText(e.target.value)}
                placeholder={tp.stepPlaceholder}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={!newStepText.trim()}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
              >
                <Plus size={15} />
                {tp.addStep}
              </button>
            </form>

            {/* Complete button */}
            {pinnedCount(activePlan) > 0 && (
              <button
                onClick={() => completePlan(activePlan.id)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40"
              >
                <CheckCheck size={16} className="text-primary" />
                {tp.completePlan}
              </button>
            )}
          </div>
        )}

        {/* New plan button (when active plan exists) */}
        {activePlan && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={createPlan}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus size={14} />
              {tp.newPlan}
            </button>
          </div>
        )}

        {/* Past plans */}
        {pastPlans.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {tp.pastPlans}
            </h2>
            <div className="space-y-2">
              {pastPlans.map(plan => {
                const isOpen = expandedPast.has(plan.id)
                const count = plan.steps.filter(s => s.pinned).length
                return (
                  <div key={plan.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                    <button
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
                      onClick={() => togglePast(plan.id)}
                    >
                      {isOpen ? <ChevronDown size={16} className="shrink-0 text-muted-foreground" /> : <ChevronRight size={16} className="shrink-0 text-muted-foreground" />}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">
                          {formatDate(plan.startDate)}
                          {plan.endDate && ` → ${formatDate(plan.endDate)}`}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">{tp.steps(count)}</span>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); if (confirm(tp.deletePlan + '?')) deletePlan(plan.id) }}
                        className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </button>
                    </button>
                    {isOpen && (
                      <ol className="border-t border-border px-4 py-3 space-y-1">
                        {plan.steps.map((step, idx) => {
                          const num = step.pinned
                            ? plan.steps.slice(0, idx + 1).filter(s => s.pinned).length
                            : null
                          return (
                            <li key={step.id} className={`flex items-center gap-3 py-1 ${!step.pinned ? 'opacity-40' : ''}`}>
                              <span
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold"
                                style={step.pinned ? {
                                  background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(167,139,250,0.1))',
                                  color: '#818cf8',
                                } : {
                                  background: 'rgba(128,128,128,0.1)',
                                  color: 'var(--muted-foreground)',
                                }}
                              >
                                {num ?? '–'}
                              </span>
                              <span className={`text-sm ${step.pinned ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                                {step.text}
                              </span>
                            </li>
                          )
                        })}
                      </ol>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

      </div>
    </main>
  )
}
