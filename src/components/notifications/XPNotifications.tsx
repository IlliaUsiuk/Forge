'use client'

import { useNotificationStore } from '@/lib/notifications'

export function XPNotifications() {
  const notifications = useNotificationStore(s => s.notifications)

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 pointer-events-none z-50">
      {notifications.map(notif => (
        <div
          key={notif.id}
          className="animate-xp-pop"
        >
          <div
            className="rounded-lg px-4 py-2 text-sm font-bold text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${notif.color}, ${notif.color}dd)`,
              boxShadow: `0 0 20px ${notif.color}66`
            }}
          >
            +{notif.xp} XP
          </div>
        </div>
      ))}
    </div>
  )
}
