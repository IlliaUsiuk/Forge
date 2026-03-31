import { create } from 'zustand'
import { playXP, playAchievement } from './sounds'
import { ACHIEVEMENT_MAP } from './achievements'

type XPNotification = {
  id: string
  kind: 'xp'
  track: string
  xp: number
  color: string
}

type AchievementNotification = {
  id: string
  kind: 'achievement'
  achievementId: string
  ttl: number
}

type Notification = XPNotification | AchievementNotification

type NotificationStore = {
  notifications: Notification[]
  showXP: (track: string, xp: number, color: string) => void
  showAchievement: (achievementId: string) => void
  removeNotification: (id: string) => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],

  showXP: (track, xp, color) => {
    const id = `xp-${Date.now()}-${Math.random()}`
    playXP()
    set(state => ({ notifications: [...state.notifications, { id, kind: 'xp', track, xp, color }] }))
    setTimeout(() => {
      set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }))
    }, 1000)
  },

  showAchievement: (achievementId) => {
    const def = ACHIEVEMENT_MAP[achievementId]
    if (!def) return
    const id = `ach-${Date.now()}-${Math.random()}`
    const ttl = 10
    playAchievement()
    set(state => ({ notifications: [...state.notifications, { id, kind: 'achievement', achievementId, ttl }] }))
    setTimeout(() => {
      set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }))
    }, ttl * 1000)
  },

  removeNotification: (id) => {
    set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }))
  },
}))
