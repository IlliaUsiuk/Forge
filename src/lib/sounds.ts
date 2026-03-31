// Web Audio API sound effects — no external files needed

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
}

// Short satisfying ding on task complete
export function playTaskComplete() {
  const ac = ctx()
  if (!ac) return
  const g = ac.createGain()
  g.connect(ac.destination)
  g.gain.setValueAtTime(0.18, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4)

  const o = ac.createOscillator()
  o.connect(g)
  o.type = 'sine'
  o.frequency.setValueAtTime(660, ac.currentTime)
  o.frequency.exponentialRampToValueAtTime(880, ac.currentTime + 0.08)
  o.start(ac.currentTime)
  o.stop(ac.currentTime + 0.4)
}

// Rising tone when XP is gained
export function playXP() {
  const ac = ctx()
  if (!ac) return
  const g = ac.createGain()
  g.connect(ac.destination)
  g.gain.setValueAtTime(0.12, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35)

  const o = ac.createOscillator()
  o.connect(g)
  o.type = 'triangle'
  o.frequency.setValueAtTime(440, ac.currentTime)
  o.frequency.exponentialRampToValueAtTime(660, ac.currentTime + 0.15)
  o.frequency.exponentialRampToValueAtTime(880, ac.currentTime + 0.3)
  o.start(ac.currentTime)
  o.stop(ac.currentTime + 0.35)
}

// Gentle chime for achievement unlock
export function playAchievement() {
  const ac = ctx()
  if (!ac) return

  const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const g = ac.createGain()
    g.connect(ac.destination)
    const t = ac.currentTime + i * 0.18  // slower spacing
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.07, t + 0.04)  // quieter, slower attack
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.9)  // longer decay

    const o = ac.createOscillator()
    o.connect(g)
    o.type = 'sine'
    o.frequency.setValueAtTime(freq, t)
    o.start(t)
    o.stop(t + 0.9)
  })
}

// Soft click on UI interactions
export function playClick() {
  const ac = ctx()
  if (!ac) return
  const g = ac.createGain()
  g.connect(ac.destination)
  g.gain.setValueAtTime(0.08, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06)

  const o = ac.createOscillator()
  o.connect(g)
  o.type = 'sine'
  o.frequency.setValueAtTime(1200, ac.currentTime)
  o.start(ac.currentTime)
  o.stop(ac.currentTime + 0.06)
}

// Error / wrong password
export function playError() {
  const ac = ctx()
  if (!ac) return
  const g = ac.createGain()
  g.connect(ac.destination)
  g.gain.setValueAtTime(0.12, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3)

  const o = ac.createOscillator()
  o.connect(g)
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(220, ac.currentTime)
  o.frequency.exponentialRampToValueAtTime(110, ac.currentTime + 0.3)
  o.start(ac.currentTime)
  o.stop(ac.currentTime + 0.3)
}
