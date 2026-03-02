import { create } from 'zustand'

type XPNotification = {
  id: string
  track: string
  xp: number
  color: string
}

type NotificationStore = {
  notifications: XPNotification[]
  showXP: (track: string, xp: number, color: string) => void
  removeXP: (id: string) => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],

  showXP: (track, xp, color) => {
    const id = `xp-${Date.now()}-${Math.random()}`
    set(state => ({ notifications: [...state.notifications, { id, track, xp, color }] }))
    setTimeout(() => {
      set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }))
    }, 1000)
  },

  removeXP: (id) => {
    set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }))
  },
}))
