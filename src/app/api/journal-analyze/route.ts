import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY не найден' }, { status: 500 })
  }

  try {
    const { month, entries, existingProfiles, userName } = await req.json()
    const name = (userName as string)?.trim() || 'пользователь'
    // entries: JournalEntry[] for the target month
    // existingProfiles: Record<string, { text, updatedAt }> — all previous months

    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: 'Нет записей за этот месяц' }, { status: 400 })
    }

    const entriesText = entries
      .sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date))
      .map((e: { date: string; text: string }) => `[${e.date}]\n${e.text}`)
      .join('\n\n---\n\n')

    const previousProfilesText = Object.entries(existingProfiles || {})
      .filter(([m]) => m !== month)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, p]) => `=== ${m} ===\n${(p as { text: string }).text}`)
      .join('\n\n')

    const systemPrompt = `Ты — опытный психолог. Твоя задача — создать точные "заметки психолога" на основе дневниковых записей человека по имени ${name}.

Эти заметки будут использоваться как контекст для AI-ассистента, который помогает ${name} в повседневной жизни. Чем точнее и полезнее заметки — тем лучше ассистент сможет ему помочь.

ЧТО ВКЛЮЧИТЬ В ЗАМЕТКИ (около 500 слов):

1. ПАТТЕРНЫ ПОВЕДЕНИЯ — что повторяется? Что он делает когда устаёт, стрессует, откладывает?
2. ЧТО РЕАЛЬНО РАБОТАЕТ — какие подходы, решения, окружение помогают ему двигаться?
3. ЗАСТРЯВШИЕ ТОЧКИ — где он буксует снова и снова? Какие страхи, сомнения, избегания?
4. ЭНЕРГИЯ — что его заряжает? Что истощает?
5. КЛЮЧЕВЫЕ ТЕМЫ МЕСЯЦА — о чём думал, что переживал, что менялось?
6. ПРОТИВОРЕЧИЯ — расхождения между тем что говорит и что делает?
7. ДИНАМИКА — есть ли прогресс, регресс, стагнация?

СТИЛЬ:
- Пиши от третьего лица ("${name} склонен...", "Он замечает...")
- Конкретно и честно. Без лести, без осуждения.
- Используй прямые наблюдения из записей, а не абстрактные выводы.
- Это заметки для специалиста, не для самого ${name} — пиши честно о слабых местах.`

    const userMessage = previousProfilesText
      ? `ПРЕДЫДУЩИЕ МЕСЯЦЫ (контекст для сравнения динамики):\n${previousProfilesText}\n\n===\n\nЗАПИСИ ЗА ${month}:\n${entriesText}\n\nСоздай заметки психолога за ${month}. Учти динамику относительно предыдущих месяцев если она есть.`
      : `ЗАПИСИ ЗА ${month}:\n${entriesText}\n\nСоздай заметки психолога за ${month}.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const block = response.content?.[0]
    if (!block || block.type !== 'text') {
      return NextResponse.json({ error: 'AI не вернул ответ' }, { status: 500 })
    }

    return NextResponse.json({ profile: block.text.trim() })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
