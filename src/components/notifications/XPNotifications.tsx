'use client'

import { useNotificationStore } from '@/lib/notifications'
import { ACHIEVEMENT_MAP, TIER_COLORS } from '@/lib/achievements'

export function XPNotifications() {
  const { notifications } = useNotificationStore()

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map(notification => {
        if (notification.kind === 'xp') {
          return (
            <div
              key={notification.id}
              className="animate-xp-pop"
              style={{
                background: `linear-gradient(135deg, ${notification.color}cc, ${notification.color}88)`,
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: `0 0 16px ${notification.color}66`,
                whiteSpace: 'nowrap',
              }}
            >
              +{notification.xp} XP
            </div>
          )
        }

        const def = ACHIEVEMENT_MAP[notification.achievementId]
        if (!def) return null
        const colors = TIER_COLORS[def.tier]

        return (
          <div
            key={notification.id}
            style={{
              background: `linear-gradient(135deg, rgba(15,15,20,0.92), rgba(20,20,28,0.88))`,
              border: `1px solid ${colors.border}`,
              color: '#fff',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 16px ${colors.color}22`,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: '240px',
              animation: `ach-slide-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards, ach-fade-out 0.6s ease-in ${notification.ttl - 0.6}s forwards`,
            }}
          >
            <span style={{
              fontSize: '26px',
              lineHeight: 1,
              filter: `drop-shadow(0 0 6px ${colors.color}88)`,
            }}>{def.emoji}</span>
            <div>
              <div style={{ fontSize: '10px', color: colors.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                Достижение разблокировано
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '1px' }}>{def.label}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>{def.desc}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
