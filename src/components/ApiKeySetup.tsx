'use client'

import { useState } from 'react'
import { Key, ExternalLink } from 'lucide-react'

export function ApiKeySetup({ onSave }: { onSave: (key: string) => void }) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6 max-w-sm mx-auto w-full">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(167,139,250,0.1))', boxShadow: '0 0 0 1px rgba(129,140,248,0.2) inset' }}>
        <Key size={22} style={{ color: '#818cf8' }} />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">Нужен API ключ</h2>
        <p className="text-sm text-muted-foreground">Помощник работает напрямую через твой Anthropic API ключ — без посредников</p>
      </div>

      <div className="w-full space-y-2">
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && value.trim().startsWith('sk-')) onSave(value.trim()) }}
            placeholder="sk-ant-..."
            className="w-full rounded-xl px-4 py-3 pr-24 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <button
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
          >
            {show ? 'скрыть' : 'показать'}
          </button>
        </div>
        <button
          onClick={() => { if (value.trim().startsWith('sk-')) onSave(value.trim()) }}
          disabled={!value.trim().startsWith('sk-')}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
        >
          Сохранить и продолжить
        </button>
      </div>

      <div className="w-full rounded-2xl p-5 space-y-4" style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.12)' }}>
        <p className="text-sm font-semibold text-foreground">Как получить ключ — 3 минуты</p>
        <div className="space-y-3">
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'rgba(129,140,248,0.2)', color: '#818cf8' }}>1</span>
            <div>
              <p className="text-sm text-foreground/80 font-medium">Зарегистрируйся на Anthropic</p>
              <p className="text-xs text-muted-foreground mt-0.5">Нажми кнопку ниже → Sign up → введи email и пароль</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'rgba(129,140,248,0.2)', color: '#818cf8' }}>2</span>
            <div>
              <p className="text-sm text-foreground/80 font-medium">Создай API ключ</p>
              <p className="text-xs text-muted-foreground mt-0.5">После входа: левое меню → «API Keys» → кнопка «Create Key»</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'rgba(129,140,248,0.2)', color: '#818cf8' }}>3</span>
            <div>
              <p className="text-sm text-foreground/80 font-medium">Скопируй и вставь сюда</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ключ начинается с <span className="font-mono" style={{ color: '#a78bfa' }}>sk-ant-</span> — скопируй его и вставь в поле выше</p>
            </div>
          </div>
        </div>
        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.2)', color: '#818cf8' }}
        >
          <ExternalLink size={14} />
          Открыть Anthropic Console
        </a>
        <p className="text-xs text-muted-foreground/60 text-center">🔒 Ключ хранится только у тебя — мы его не видим и не используем</p>
      </div>
    </div>
  )
}
