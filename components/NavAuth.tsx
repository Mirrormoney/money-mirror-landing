'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/i18n'

export default function NavAuth() {
  const pathname = usePathname()
  const { lang } = useLanguage()
  const [status, setStatus] = React.useState<'loading'|'in'|'out'>('loading')

  React.useEffect(() => {
    let alive = true
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (!alive) return; setStatus(data?.user ? 'in' : 'out') })
      .catch(() => { if (!alive) return; setStatus('out') })
    return () => { alive = false }
  }, [pathname])

  if (status === 'loading') {
    return <span className="px-3 py-2 text-sm opacity-70">…</span>
  }

  if (status === 'in') {
    return (
      <Link href="/account" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/5">
        {lang === 'de' ? 'Konto' : 'Account'}
      </Link>
    )
  }
  return (
    <Link href="/login" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/5">
      {lang === 'de' ? 'Anmelden' : 'Sign in'}
    </Link>
  )
}
