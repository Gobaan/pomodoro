import { useState, useEffect, useRef, useCallback } from 'react'

const STORAGE_KEY = 'pmg_pending_reminder'

export interface ReminderState {
  pendingAt: string | null // ISO timestamp, or null if no reminder set
  notificationsSupported: boolean
  scheduleReminder: (isoTimestamp: string) => Promise<'scheduled' | 'denied' | 'unsupported'>
  cancelReminder: () => void
}

export function useSessionReminder(): ReminderState {
  const notificationsSupported = typeof Notification !== 'undefined'

  const [pendingAt, setPendingAt] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  )
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimeout_ = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const arm = useCallback((isoTimestamp: string) => {
    const msUntil = new Date(isoTimestamp).getTime() - Date.now()
    if (msUntil <= 0) return

    clearTimeout_()
    timeoutRef.current = setTimeout(() => {
      localStorage.removeItem(STORAGE_KEY)
      setPendingAt(null)

      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
      const n = new Notification('FlowBeats — time to focus', {
        body: 'Your reminder is here. Tap to start a session.',
        tag: 'flowbeats-reminder', // deduplicates if multiple tabs
      })
      n.onclick = () => {
        window.focus()
        window.location.href = '/flowbeats/?autostart=1'
      }
    }, msUntil)
  }, [clearTimeout_])

  // Re-arm on mount if a reminder survived a page refresh
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return

    const msUntil = new Date(saved).getTime() - Date.now()
    if (msUntil <= 0) {
      localStorage.removeItem(STORAGE_KEY)
      setPendingAt(null)
      return
    }

    arm(saved)
    return clearTimeout_
  }, [arm, clearTimeout_])

  const scheduleReminder = useCallback(async (
    isoTimestamp: string,
  ): Promise<'scheduled' | 'denied' | 'unsupported'> => {
    if (typeof Notification === 'undefined') return 'unsupported'

    const permission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission()

    if (permission !== 'granted') return 'denied'

    localStorage.setItem(STORAGE_KEY, isoTimestamp)
    setPendingAt(isoTimestamp)
    arm(isoTimestamp)
    return 'scheduled'
  }, [arm])

  const cancelReminder = useCallback(() => {
    clearTimeout_()
    localStorage.removeItem(STORAGE_KEY)
    setPendingAt(null)
  }, [clearTimeout_])

  return { pendingAt, notificationsSupported, scheduleReminder, cancelReminder }
}
