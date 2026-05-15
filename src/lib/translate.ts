export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text.trim()) return text
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang }),
    })
    const data = await res.json()
    return data.translated ?? text
  } catch {
    return text
  }
}
