'use client'

import { useState } from 'react'
import { Key, ExternalLink, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useT } from '@/lib/i18n'

const CARD_STYLE = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
const ACCENT = { color: '#818cf8' }
const WARN_STYLE = { background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }
const OK_STYLE = { background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }

function FAQ({ question, children }: { question: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl overflow-hidden" style={CARD_STYLE}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
      >
        {question}
        {open ? <ChevronUp size={14} className="shrink-0 text-muted-foreground" /> : <ChevronDown size={14} className="shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed space-y-1.5 border-t border-white/5 pt-3">
          {children}
        </div>
      )}
    </div>
  )
}

export function ApiKeySetup({ onSave }: { onSave: (key: string) => void }) {
  const { lang } = useT()
  const isUk = lang === 'uk'
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)

  const isValid = value.trim().startsWith('sk-')

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="max-w-lg mx-auto w-full px-5 py-8 space-y-5">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(167,139,250,0.1))', boxShadow: '0 0 0 1px rgba(129,140,248,0.2) inset' }}>
            <Key size={22} style={ACCENT} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isUk ? 'Потрібен API ключ Anthropic' : 'Anthropic API Key Required'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isUk
                ? 'Асистент використовує Claude AI — тобі потрібен особистий ключ доступу'
                : 'The assistant uses Claude AI — you need a personal access key'}
            </p>
          </div>
        </div>

        {/* What is it */}
        <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(129,140,248,0.07)', border: '1px solid rgba(129,140,248,0.15)' }}>
          <p className="text-sm font-semibold text-foreground">
            {isUk ? '🤔 Що таке API ключ?' : '🤔 What is an API key?'}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isUk
              ? 'API ключ — це як пароль, який дозволяє Forge звертатись до Claude AI від твого імені. Ти реєструєшся на сайті Anthropic (компанія що створила Claude), отримуєш ключ і вставляєш сюди. Forge використовує твій ключ напряму — ми його не бачимо і не зберігаємо на своєму сервері.'
              : 'An API key is like a password that lets Forge talk to Claude AI on your behalf. You sign up on Anthropic\'s website (the company that made Claude), get a key, and paste it here. Forge uses your key directly — we never see it or store it on our servers.'}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} style={{ color: '#34d399' }} />
              <span className="text-xs" style={{ color: '#34d399' }}>
                {isUk ? 'Ключ зберігається тільки у тебе' : 'Key stored only on your device'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} style={{ color: '#34d399' }} />
              <span className="text-xs" style={{ color: '#34d399' }}>
                {isUk ? '~$1–5 на місяць при активному використанні' : '~$1–5/month with active use'}
              </span>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            {isUk ? '📋 Як отримати ключ — крок за кроком' : '📋 How to get a key — step by step'}
          </p>

          {/* Step 1 */}
          <div className="rounded-xl p-4 space-y-2" style={CARD_STYLE}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'rgba(129,140,248,0.2)', color: '#818cf8' }}>1</span>
              <p className="text-sm font-semibold text-foreground">
                {isUk ? 'Відкрий сайт Anthropic' : 'Open Anthropic website'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pl-8">
              {isUk
                ? 'Натисни кнопку нижче — відкриється сайт console.anthropic.com. Якщо ще немає акаунту — натисни "Sign up", введи email і придумай пароль. Якщо вже є — просто "Log in".'
                : 'Click the button below — it opens console.anthropic.com. If you don\'t have an account — click "Sign up", enter your email and create a password. If you already have one — just "Log in".'}
            </p>
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-8 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.25)', color: '#818cf8' }}
            >
              <ExternalLink size={12} />
              console.anthropic.com
            </a>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl p-4 space-y-2" style={CARD_STYLE}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'rgba(129,140,248,0.2)', color: '#818cf8' }}>2</span>
              <p className="text-sm font-semibold text-foreground">
                {isUk ? 'Поповни баланс (мінімум $5)' : 'Add credits (minimum $5)'}
            </p>
            </div>
            <div className="pl-8 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isUk
                  ? 'Без поповнення ключ не буде працювати. Зліва в меню знайди "Billing" → натисни "Add credit" → введи дані картки → поповни на $5 (цього вистачить на кілька місяців звичайного використання).'
                  : 'Without credits the key won\'t work. In the left menu find "Billing" → click "Add credit" → enter your card details → add $5 (this will last several months of normal use).'}
              </p>
              <div className="rounded-lg px-3 py-2 flex items-start gap-2" style={WARN_STYLE}>
                <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
                <p className="text-xs leading-relaxed" style={{ color: '#fbbf24' }}>
                  {isUk
                    ? 'Це найчастіша причина помилки "Invalid API key" — ключ є, але баланс не поповнено. Без $5 на рахунку нічого не працюватиме.'
                    : 'This is the most common reason for "Invalid API key" error — the key exists but no credits added. Without $5 balance nothing will work.'}
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl p-4 space-y-2" style={CARD_STYLE}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'rgba(129,140,248,0.2)', color: '#818cf8' }}>3</span>
              <p className="text-sm font-semibold text-foreground">
                {isUk ? 'Створи API ключ' : 'Create an API key'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pl-8">
              {isUk
                ? 'Зліва в меню натисни "API Keys" → кнопка "Create Key" → дай будь-яку назву (наприклад "Forge") → натисни "Create Key".'
                : 'In the left menu click "API Keys" → click "Create Key" button → give it any name (e.g. "Forge") → click "Create Key".'}
            </p>
          </div>

          {/* Step 4 */}
          <div className="rounded-xl p-4 space-y-2" style={CARD_STYLE}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'rgba(129,140,248,0.2)', color: '#818cf8' }}>4</span>
              <p className="text-sm font-semibold text-foreground">
                {isUk ? 'Скопіюй і встав ключ сюди' : 'Copy and paste the key here'}
              </p>
            </div>
            <div className="pl-8 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isUk
                  ? 'Після створення з\'явиться довгий рядок що починається з '
                  : 'After creation you\'ll see a long string starting with '}
                <span className="font-mono px-1 rounded" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>sk-ant-api03-...</span>
                {isUk
                  ? '. Натисни кнопку "Copy" поруч з ним. Ключ показується лише ОДИН РАЗ — якщо не скопіюєш зараз, доведеться створювати новий.'
                  : '. Click the "Copy" button next to it. The key is shown only ONCE — if you don\'t copy it now, you\'ll have to create a new one.'}
              </p>
              <div className="rounded-lg px-3 py-2 flex items-start gap-2" style={WARN_STYLE}>
                <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
                <p className="text-xs leading-relaxed" style={{ color: '#fbbf24' }}>
                  {isUk
                    ? 'Скопіюй ключ одразу! Після закриття вікна він більше не відобразиться.'
                    : 'Copy the key immediately! After closing the dialog it won\'t be shown again.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {isUk ? 'Встав свій API ключ:' : 'Paste your API key:'}
          </p>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && isValid) onSave(value.trim()) }}
              placeholder="sk-ant-api03-..."
              className="w-full rounded-xl px-4 py-3 pr-24 text-sm text-foreground outline-none font-mono"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${isValid ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)'}` }}
            />
            <button
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
            >
              {show ? (isUk ? 'сховати' : 'hide') : (isUk ? 'показати' : 'show')}
            </button>
          </div>
          {value && !isValid && (
            <p className="text-xs" style={{ color: '#f87171' }}>
              {isUk
                ? 'Ключ повинен починатись з sk-ant-...'
                : 'Key must start with sk-ant-...'}
            </p>
          )}
          {isValid && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} style={{ color: '#34d399' }} />
              <p className="text-xs" style={{ color: '#34d399' }}>
                {isUk ? 'Ключ виглядає правильно' : 'Key looks correct'}
              </p>
            </div>
          )}
          <button
            onClick={() => { if (isValid) onSave(value.trim()) }}
            disabled={!isValid}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
          >
            {isUk ? 'Зберегти та продовжити' : 'Save and continue'}
          </button>
        </div>

        {/* FAQ */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            {isUk ? '❓ Часті питання' : '❓ Common questions'}
          </p>

          <FAQ question={isUk ? 'Скільки це коштує?' : 'How much does it cost?'}>
            <p>
              {isUk
                ? 'Дуже мало. Одне повідомлення до бота коштує приблизно $0.001–0.005 (менше копійки). При активному використанні (10–20 повідомлень на день) витрати — $1–5 на місяць. Перші $5 вистачить на 1–3 місяці.'
                : 'Very little. One message to the bot costs about $0.001–0.005. With active use (10–20 messages per day) it\'s $1–5 per month. Your first $5 will last 1–3 months.'}
            </p>
            <p>
              {isUk
                ? 'Anthropic не списує щомісячну підписку — ти платиш тільки за те що використовуєш.'
                : 'Anthropic doesn\'t charge a monthly subscription — you only pay for what you use.'}
            </p>
          </FAQ>

          <FAQ question={isUk ? 'Бот пише що ключ невалідний — що робити?' : 'Bot says key is invalid — what to do?'}>
            <p>{isUk ? 'Перевір по черзі:' : 'Check in order:'}</p>
            <p>1. {isUk ? 'Чи поповнений баланс на Anthropic? (Billing → Add credit). Це найчастіша причина.' : 'Is your Anthropic balance topped up? (Billing → Add credit). This is the most common cause.'}</p>
            <p>2. {isUk ? 'Чи скопіював ключ повністю? Він довгий — близько 100 символів. Спробуй скопіювати ще раз.' : 'Did you copy the full key? It\'s long — about 100 characters. Try copying again.'}</p>
            <p>3. {isUk ? 'Чи не закінчились кошти на рахунку? Зайди в Billing і перевір баланс.' : 'Did you run out of credits? Check your balance in Billing.'}</p>
            <p>4. {isUk ? 'Спробуй створити новий ключ — старий міг бути видалений або не активований.' : 'Try creating a new key — the old one might have been deleted or not activated.'}</p>
          </FAQ>

          <FAQ question={isUk ? 'Чи безпечно це?' : 'Is this safe?'}>
            <p>
              {isUk
                ? 'Так. Твій ключ зберігається тільки в браузері (localStorage) і ніколи не відправляється на наші сервери. Forge відправляє запити до Anthropic напряму з твого браузера використовуючи твій ключ.'
                : 'Yes. Your key is stored only in your browser (localStorage) and never sent to our servers. Forge sends requests to Anthropic directly from your browser using your key.'}
            </p>
            <p>
              {isUk
                ? 'Якщо хочеш — в будь-який момент можеш видалити ключ в Anthropic Console і він перестане працювати.'
                : 'If you want — you can delete the key in Anthropic Console at any time and it will stop working.'}
            </p>
          </FAQ>

          <FAQ question={isUk ? 'Мій ключ починається не з sk-ant-, а з sk-...' : 'My key starts with sk-... not sk-ant-...'}>
            <p>
              {isUk
                ? 'Це нормально — нові ключі можуть мати скорочений формат. Вставляй як є, головне що він починається з sk-.'
                : 'That\'s fine — newer keys may have a shorter format. Paste it as is, the important thing is it starts with sk-.'}
            </p>
          </FAQ>

          <FAQ question={isUk ? 'Де знайти мій ключ якщо я його вже створив?' : 'Where to find my key if I already created one?'}>
            <p>
              {isUk
                ? 'На жаль, Anthropic не показує вже створені ключі повністю — тільки перші кілька символів. Якщо не зберіг ключ — доведеться створити новий. Це безкоштовно і займає 30 секунд.'
                : 'Unfortunately Anthropic doesn\'t show already created keys in full — only the first few characters. If you didn\'t save the key — you\'ll need to create a new one. It\'s free and takes 30 seconds.'}
            </p>
          </FAQ>

          <FAQ question={isUk ? 'Anthropic просить підтвердити номер телефону — це нормально?' : 'Anthropic asks to verify phone number — is that normal?'}>
            <p>
              {isUk
                ? 'Так, це звичайна перевірка при реєстрації. Введи номер свого телефону, отримай SMS з кодом і введи його. Це одноразова перевірка.'
                : 'Yes, this is standard verification during sign-up. Enter your phone number, receive an SMS code and enter it. This is a one-time check.'}
            </p>
          </FAQ>
        </div>

        {/* Support */}
        <div className="rounded-xl px-4 py-3 text-center" style={OK_STYLE}>
          <p className="text-xs" style={{ color: '#34d399' }}>
            {isUk
              ? '🔒 Ключ зберігається тільки у тебе — ми його не бачимо і не використовуємо'
              : '🔒 Key stored only on your device — we never see or use it'}
          </p>
        </div>

      </div>
    </div>
  )
}
