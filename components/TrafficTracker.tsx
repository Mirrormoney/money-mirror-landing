'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
export default function TrafficTracker() {
  const path = usePathname()
  const sent = useRef<string | null>(null)
  useEffect(() => {
    if (!path || path.startsWith('/admin') || navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return
    const send = () => {
      if (document.visibilityState !== 'visible' || sent.current === path) return
      sent.current = path
      void fetch('/api/traffic', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }), keepalive: true }).catch(() => {})
    }
    send()
    document.addEventListener('visibilitychange', send)
    return () => document.removeEventListener('visibilitychange', send)
  }, [path])
  return null
}
