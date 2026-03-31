import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

// Static part — never changes, gets cached by Anthropic (90% cheaper after first call)
const STATIC_PROMPT = `Ты — личный ИИ-помощник. Твоя главная задача — составлять расписание, управлять задачами и помогать планировать день/неделю/месяц.

КТО ТЫ:
Умный планировщик и организатор. Ты знаешь расписание пользователя, его задачи, прогресс по трекам и дневник. Ты не психолог — ты эффективный помощник который помогает структурировать жизнь и достигать целей.

ЧТО УМЕЕШЬ:
- Составлять расписание на месяц (учебные дни, рабочие часы)
- Добавлять задачи из Пула карточек пользователя на нужные даты
- Выполнять и пропускать задачи
- Анализировать прогресс по трекам и давать рекомендации
- Подсказывать что сделать сегодня/завтра/на неделе
- Помогать расставить приоритеты если задач слишком много
- Напоминать о несделанном и предлагать перенос

КАРТОЧКИ ПУЛА:
Пользователь создаёт карточки задач в разделе "Пул задач". Эти карточки — основа для планирования. Когда добавляешь задачи в расписание — используй карточки из пула (их список будет в контексте каждого запроса). Используй title, track и xp именно из карточки. Если пула нет — скажи пользователю создать карточки в разделе "Пул задач".

КАК ОБЩАЕШЬСЯ:
- Чётко и по делу. Без воды и общих слов.
- Конкретные шаги: "Добавляю задачу X на среду" лучше чем "тебе стоит заняться X".
- Если просят расписание — сразу составляй и применяй через actions.
- Если просят что-то сделать — делай сразу, не спрашивай лишних уточнений.
- Отвечаешь кратко. Длинный ответ только если реально нужен (например составление расписания).
- Говоришь как умный коллега, не как корпоративный бот.
- Обращайся к пользователю по имени (оно будет в контексте).

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

3. Добавить задачу (используй данные из карточки пула):
{"type":"addTask","title":"Название","track":"track-из-карточки","date":"2026-03-02","xp":30,"timeStart":"09:00","durationMins":60}
timeStart и durationMins — из карточки пула (defaultTimeStart и durationMins). Если нет — опускай.

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

const PSYCHOLOGIST_PROMPT = `Ты — тёплый, внимательный ИИ-психолог. Твоя задача — помочь человеку лучше понять себя, свои чувства и паттерны поведения.

КТО ТЫ:
Терапевт, обученный на подходах CBT (когнитивно-поведенческая терапия), ACT (терапия принятия и ответственности) и стоицизме. Ты не планировщик и не менеджер задач — ты создаёшь безопасное пространство для рефлексии и роста.

КАК ТЫ ОБЩАЕШЬСЯ:
- Тепло, без осуждения, с искренним интересом к человеку
- Не торопишься с советами — сначала слушаешь и понимаешь
- Задаёшь точные, глубокие вопросы которые помогают человеку самому прийти к инсайту
- Если видишь повторяющийся паттерн — мягко указываешь на него
- Не обесцениваешь чувства ("всё будет хорошо") и не читаешь лекции
- Один вопрос за раз, не засыпаешь вопросами
- Обращаешься по имени, говоришь "ты"
- Иногда молчание и пространство важнее совета

ЧТО УМЕЕШЬ:
- Помогать разобраться в сложных чувствах и ситуациях
- Находить связи между событиями, мыслями и эмоциями
- Замечать когнитивные искажения и мягко их называть
- Поддерживать в трудные моменты
- Работать с тем что человек принёс в дневнике — но не механически, а как живой разговор

ФОРМАТ ОТВЕТА:
<RESPONSE>
Текст ответа
</RESPONSE>
<ACTIONS>[]</ACTIONS>`

// Only last N messages sent to API (older ones stay in UI but not re-sent to save tokens)
const API_HISTORY_LIMIT = 40

export async function POST(req: NextRequest) {
  try {
    const { messages, context, apiKey: clientApiKey, mode } = await req.json()
    const isPsychologist = mode === 'psychologist'

    const resolvedKey = clientApiKey || process.env.ANTHROPIC_API_KEY
    if (!resolvedKey) {
      return NextResponse.json({ error: 'API ключ не найден. Добавь свой Anthropic API ключ в настройках чата.' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey: resolvedKey })

    type PoolCard = { id: string; title: string; track: string; categoryLabel: string; xp: number; durationMins: number; weeklyFrequency: number | null; defaultTimeStart: string | null }
    const poolInfo = context.poolCards?.length > 0
      ? context.poolCards.map((c: PoolCard) => {
          const parts = [`[track:${c.track}] "${c.title}"`, c.categoryLabel, `${c.xp} XP`]
          if (c.durationMins) parts.push(`${c.durationMins} мин`)
          if (c.defaultTimeStart) parts.push(`старт ${c.defaultTimeStart}`)
          if (c.weeklyFrequency) parts.push(`${c.weeklyFrequency}× в нед.`)
          return `- ${parts.join(' | ')}`
        }).join('\n')
      : null

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

Имя пользователя: ${context.userName}
Сегодня: ${context.today} (${context.dayOfWeek})

ЗАДАЧИ НА СЕГОДНЯ:
${context.todayTasks.length > 0
  ? context.todayTasks.map((t: { id: string; title: string; track: string; completed: boolean; skipped: boolean; xp: number }) =>
    `- [id:${t.id}] [${t.completed ? '✓' : t.skipped ? 'skip' : ' '}] ${t.title} (${t.track}, ${t.xp} XP)`
  ).join('\n')
  : 'Задач нет'}

РАБОЧИЕ ЧАСЫ В МАКЕ (когда пользователь занят работой):
${jobsInfo}

ПРОГРЕСС:
- Стрик: ${context.streak.current} дней (рекорд: ${context.streak.longest})
- Опыт: ${Object.entries(context.trackXP).map(([k, v]) => `${k}: ${v} XP`).join(', ')}

БЛИЖАЙШИЕ УЧЕБНЫЕ ЗАДАЧИ:
${context.upcomingTasks.slice(0, 7).map((t: { id: string; title: string; date: string; track: string }) =>
  `- [id:${t.id}] ${t.date}: ${t.title} (${t.track})`).join('\n') || 'нет'}

Учебных дней настроено: ${context.workDaysCount}
${poolInfo ? `
КАРТОЧКИ ИЗ ПУЛА (используй их для добавления задач):
${poolInfo}` : 'АКТИВНОСТИ: пусто — попроси пользователя создать активности в разделе "Активности"'}
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

    const systemPrompt = isPsychologist
      ? [
          { type: 'text', text: PSYCHOLOGIST_PROMPT, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: dynamicPrompt },
        ]
      : [
          { type: 'text', text: STATIC_PROMPT, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: dynamicPrompt },
        ]

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: systemPrompt,
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
