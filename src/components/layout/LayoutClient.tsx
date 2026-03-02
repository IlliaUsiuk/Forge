'use client'

import { XPNotifications } from './notifications/XPNotifications'

export function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <XPNotifications />
    </>
  )
}
