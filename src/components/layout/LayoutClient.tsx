'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { XPNotifications } from '@/components/notifications/XPNotifications'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { loadUserData, saveUserData } from '@/lib/sync'

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const userIdRef = useRef<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const setUserName = useStore(s => s.setUserName)

  // Debounced save — waits 2s after last store change before saving
  const scheduleSave = useCallback(() => {
    if (!userIdRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      if (userIdRef.current) saveUserData(userIdRef.current)
    }, 2000)
  }, [])

  useEffect(() => {
    // Get current session and load data
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      const userId = session.user.id

      // Set username from auth metadata if available
      const displayName = session.user.user_metadata?.display_name
      if (displayName) setUserName(displayName)

      // Load cloud data first — only allow saves after load completes
      await loadUserData(userId)
      userIdRef.current = userId
    })

    // Listen for auth changes (logout, session expiry)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        userIdRef.current = null
        router.push('/login')
      } else if (event === 'SIGNED_IN' && session) {
        const userId = session.user.id
        loadUserData(userId).then(() => { userIdRef.current = userId })
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to store changes → auto-save to Supabase
  useEffect(() => {
    const unsub = useStore.subscribe(() => scheduleSave())
    return () => unsub()
  }, [scheduleSave])

  return (
    <div className="flex-1 flex flex-col">
      {children}
      <XPNotifications />
    </div>
  )
}
