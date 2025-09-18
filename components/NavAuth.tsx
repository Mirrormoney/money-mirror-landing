'use client'
import React from 'react'
import Link from 'next/link'

export default function NavAuth() {
  const [status, setStatus] = React.useState<'loading'|'in'|'out'>('loading')

  React.useEffect(() => {
    let alive = true
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (!alive) return; setStatus(data?.user ? 'in' : 'out') })
      .catch(() => { if (!alive) return; setStatus('out') })
    return () => { alive = false }
  }, [])

  if (status === 'loading') {
    return <span className="px-3 py-2 text-sm opacity-70">…</span>
  }

  if (status === 'in') {
    return (
      <Link href="/account" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/5">
        Account
      </Link>
    )
  }
  return (
    <Link href="/login" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/5">
      Login
    </Link>
  )
}
