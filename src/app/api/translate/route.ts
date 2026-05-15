import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { text, targetLang } = await req.json()
  if (!text?.trim()) return NextResponse.json({ translated: text })

  const langName = targetLang === 'uk' ? 'Ukrainian' : 'English'

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Translate the following task title to ${langName}. If it is already in ${langName}, return it exactly as-is. Return ONLY the translated text — no quotes, no explanation.\n\n${text}`,
    }],
  })

  const translated = message.content[0].type === 'text' ? message.content[0].text.trim() : text
  return NextResponse.json({ translated })
}
