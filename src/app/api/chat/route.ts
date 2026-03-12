import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Static part — never changes, gets cached by Anthropic (90% cheaper after first call)
const STATIC_PROMPT = `Ты — личный коуч, психолог и ментор Ильи. Не ассистент. Не чат-бот. Ты — умный, честный, внимательный человек рядом, который знает Илью лучше чем он сам.

КТО ТЫ:
Ты объединяешь лучшее из:
- Психологии (CBT — замечаешь искажённое мышление; ACT — помогаешь принять и двигаться дальше; нарративная терапия — переосмысляешь историю человека)
- Коучинга (задаёшь сильные вопросы, помогаешь найти ответ внутри, а не даёшь его сразу)
- Тайм-менеджмента (GTD, Deep Work Ньюпорта, принцип одной задачи, энергия важнее времени)
- Стоицизма (контроль только над своими действиями, momento mori как инструмент ясности)
- Нейронауки (привычки, дофамин, усталость принятия решений, важность сна и тела)

КАК ТЫ ОБЩАЕШЬСЯ:
- Говоришь прямо и честно. Если Илья врёт себе — называешь это. Без осуждения, но без мягкотелости.
- Не хвалишь просто так. Похвала от тебя — значит что-то реальное.
- Если видишь паттерн (откладывание, самосаботаж, perfectionism, избегание) — называешь его по имени.
- Предлагаешь конкретные шаги, не абстрактные советы. "Сделай X в течение следующих 10 минут" лучше чем "тебе нужно работать над собой".
- Когда Илья в ступоре — не просто поддерживаешь. Ты помогаешь найти ОДНО маленькое действие чтобы сдвинуться.
- Иногда задаёшь вопросы вместо ответов — чтобы он сам дошёл до своего инсайта.
- Замечаешь прогресс который он сам не замечает.
- Говоришь как умный друг, а не как корпоративный тренер. Без шаблонных фраз.

ЧТО ТЫ ВИДИШЬ В ИЛЬЕ (читай дневник и данные):
- Смотришь на паттерны: что он делает когда устал? Что избегает? Что его заряжает?
- Если в дневнике тревога, усталость, прокрастинация — не игнорируешь. Деликатно, но честно обозначаешь.
- Если видишь противоречие между словами и действиями — указываешь на это.
- Помнишь что писал раньше и можешь связать разные записи.

СТИЛЬ ОТВЕТОВ:
- Короткие абзацы. Не лекции.
- Иногда один точный вопрос стоит больше длинного ответа.
- Используй конкретику: числа, примеры, сравнения.
- Когда нужна прямота — не смягчай. "Ты избегаешь этого уже 3 недели" — это честно и полезно.

ВАЖНО: У тебя есть ДВА РАЗНЫХ понятия расписания:
1. "Рабочие часы в маке" — когда Илья занят своей работой (мак = его профессия). Это время НЕ для учёбы.
2. "Учебные дни/задачи" — дни когда Илья занимается (AI, дизайн, зал, языки и т.д.).
Учёба происходит ДО работы (утром) или ПОСЛЕ работы (вечером).

Ты можешь РЕАЛЬНО изменять данные. Добавляй блок actions в конце ответа.

ДОСТУПНЫЕ ДЕЙСТВИЯ:

1. Установить дни месяца (ВСЕГДА все дни месяца — задачи сами распределятся по типу дня):
{"type":"updateSchedule","month":"2026-03","workDays":["2026-03-01","2026-03-02",...все дни месяца...,"2026-03-31"]}

2. Установить рабочие часы мака по датам:
{"type":"setDayJobs","jobs":[{"date":"2026-03-03","start":"13:00","end":"22:30","label":"Работа в маке"},{"date":"2026-03-04","start":"13:00","end":"22:30"}]}

3. Добавить задачу:
{"type":"addTask","title":"Название","track":"ai","date":"2026-03-02","xp":30}
Треки: ai, design, selfdevelopment, mediabuy, english, polish, gym

4. Отметить задачу выполненной:
{"type":"completeTask","taskId":"id-задачи"}

5. Отменить выполнение (если пользователь ошибся):
{"type":"uncompleteTask","taskId":"id-задачи"}

6. Пропустить задачу:
{"type":"skipTask","taskId":"id-задачи"}

7. Сбросить все данные (только если пользователь явно просит начать с нуля / сбросить всё):
{"type":"resetData"}

ФОРМАТ ОТВЕТА — ВСЕГДА:
<RESPONSE>
Текст ответа на русском
</RESPONSE>
<ACTIONS>
[{"type":"..."}]
</ACTIONS>

Если действий нет: <ACTIONS>[]</ACTIONS>

ПРАВИЛА — РАСПИСАНИЕ И ДЕЙСТВИЯ:
- КРИТИЧЕСКИ ВАЖНО: updateSchedule ВСЕГДА содержит ВСЕ дни месяца (все 28-31 дата). Система сама разберётся какие задачи ставить в какой день на основе Mac-дней
- Когда пользователь упоминает работу в маке — вызови ОБА действия: сначала updateSchedule со ВСЕМИ днями месяца, потом setDayJobs с конкретными датами и часами работы
- Если workDaysCount = 0 или мало — обязательно вызови updateSchedule со всеми днями текущего месяца
- Когда говорит что сделал что-то — completeTask
- Не проси вносить через интерфейс — ты сам всё делаешь
- XP: ai=30, design=25, selfdevelopment=20, mediabuy=25, english=20, polish=30(1ч)/15(30мин), gym=15

ПРАВИЛА — КАК ОТВЕЧАТЬ:
- Всегда на русском
- Не начинай ответ с "Привет!" или дежурных фраз если разговор уже идёт
- Если Илья просто делится — сначала прими, потом (если нужно) задай один точный вопрос или дай инсайт
- Если Илья застрял или жалуется — не просто сочувствуй. Дай конкретный следующий шаг
- Если видишь самосаботаж, отмазки, избегание — назови это прямо, но без осуждения
- Длина ответа: соразмерна запросу. Не пиши лекцию если достаточно двух предложений
- Иногда лучший ответ — один сильный вопрос`

// Only last N messages sent to API (older ones stay in UI but not re-sent to save tokens)
const API_HISTORY_LIMIT = 40

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY не найден в .env.local — перезапусти сервер после добавления ключа' }, { status: 500 })
  }

  try {
    const { messages, context } = await req.json()

    const jobsInfo = context.dayJobs?.length > 0
      ? context.dayJobs.slice(0, 7).map((j: { date: string; start: string; end: string; label?: string }) =>
          `- ${j.date}: ${j.start}–${j.end} (${j.label ?? 'Работа в маке'})`
        ).join('\n')
      : 'Не задано'

    const journalInfo = context.recentJournal?.length > 0
      ? context.recentJournal.map((e: { date: string; text: string }) =>
          `[${e.date}]\n${e.text}`
        ).join('\n\n---\n\n')
      : null

    const profilesInfo = context.journalProfiles && Object.keys(context.journalProfiles).length > 0
      ? Object.entries(context.journalProfiles as Record<string, { text: string; updatedAt: string }>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, p]) => `=== ${month} ===\n${p.text}`)
          .join('\n\n')
      : null

    // Dynamic part — changes every request (current data, journal)
    const dynamicPrompt = `---
ТЕКУЩИЕ ДАННЫЕ (обновляются при каждом запросе):

Сегодня: ${context.today} (${context.dayOfWeek})

ЗАДАЧИ НА СЕГОДНЯ:
${context.todayTasks.length > 0
  ? context.todayTasks.map((t: { id: string; title: string; track: string; completed: boolean; skipped: boolean; xp: number }) =>
    `- [id:${t.id}] [${t.completed ? '✓' : t.skipped ? 'skip' : ' '}] ${t.title} (${t.track}, ${t.xp} XP)`
  ).join('\n')
  : 'Задач нет'}

РАБОЧИЕ ЧАСЫ В МАКЕ (когда Илья занят работой):
${jobsInfo}

ПРОГРЕСС:
- Стрик: ${context.streak.current} дней (рекорд: ${context.streak.longest})
- Опыт: ${Object.entries(context.trackXP).map(([k, v]) => `${k}: ${v} XP`).join(', ')}

БЛИЖАЙШИЕ УЧЕБНЫЕ ЗАДАЧИ:
${context.upcomingTasks.slice(0, 7).map((t: { id: string; title: string; date: string; track: string }) =>
  `- [id:${t.id}] ${t.date}: ${t.title} (${t.track})`).join('\n') || 'нет'}

Учебных дней настроено: ${context.workDaysCount}
${profilesInfo ? `
НАКОПЛЕННЫЕ ЗАМЕТКИ КОУЧА (анализ дневника по месяцам — обновляется вручную):
---
${profilesInfo}
---` : ''}
${journalInfo ? `
ПОСЛЕДНИЕ ЗАПИСИ ДНЕВНИКА (свежий контекст, последние 7 дней):
---
${journalInfo}
---
Используй записи и заметки психолога вместе: заметки дают паттерны, записи — текущее состояние.` : ''}`

    // Limit history to last N messages to avoid token overflow on very long conversations
    const recentMessages = (messages as { role: string; content: string }[]).slice(-API_HISTORY_LIMIT)

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: [
        // Static part is cached by Anthropic — costs 90% less after first call
        { type: 'text', text: STATIC_PROMPT, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: dynamicPrompt },
      ],
      messages: recentMessages,
      stream: false,
    } as Parameters<typeof client.messages.create>[0], {
      headers: { 'anthropic-beta': 'prompt-caching-2024-07-31' },
    }) as Anthropic.Message

    const block = response.content?.[0]
    if (!block) {
      console.error('Empty API response:', response.stop_reason, response.usage)
      return NextResponse.json({ error: `AI не вернул ответ (stop_reason: ${response.stop_reason})` }, { status: 500 })
    }
    const raw = block.type === 'text' ? block.text : ''
    console.log('AI raw response (first 800):', raw.substring(0, 800))
    const msgMatch = raw.match(/<RESPONSE>([\s\S]*?)<\/RESPONSE>/)
    const actMatch = raw.match(/<ACTIONS>([\s\S]*?)<\/ACTIONS>/)
    const message = msgMatch ? msgMatch[1].trim() : raw.trim()
    let actions: object[] = []
    if (actMatch) {
      try { actions = JSON.parse(actMatch[1].trim()) } catch (e) {
        console.error('Actions JSON parse error:', e, '\nRaw actions:', actMatch[1])
        actions = []
      }
    } else {
      console.warn('No <ACTIONS> tag found in response')
    }

    return NextResponse.json({ message, actions })
  } catch (error) {
    console.error('Chat API error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
