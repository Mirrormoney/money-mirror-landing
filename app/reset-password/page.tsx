'use client'
import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'
export default function ResetPassword() {
  const { lang } = useLanguage(), de = lang === 'de'
  const [token, setToken] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('')
  useEffect(() => { setToken(new URLSearchParams(window.location.search).get('token') ?? '') }, [])
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError('')
    const data = new FormData(e.currentTarget)
    try {
      const response = await fetch('/api/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(token ? { token, password: data.get('password') } : { email: data.get('email') }) })
      const result = await response.json(); if (!response.ok) throw new Error(result.error)
      setMessage(token ? (de ? 'Passwort gespeichert. Du kannst dich jetzt anmelden.' : 'Password saved. You can sign in now.') : (de ? 'Wenn ein Konto existiert, erhältst du einen Link per E-Mail.' : 'If an account exists, you’ll receive a link by email.'))
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <section className="container max-w-md py-16"><h1 className="text-3xl font-semibold">{de ? 'Passwort zurücksetzen' : 'Reset your password'}</h1><form onSubmit={submit} className="panel mt-8 space-y-4 p-6">{token ? <label className="field-label">{de ? 'Neues Passwort' : 'New password'}<input className="field" name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label> : <label className="field-label">Email<input className="field" name="email" type="email" required maxLength={254} autoComplete="email" /></label>}{error && <p role="alert" className="notice-error">{error}</p>}{message ? <p role="status" className="notice">{message}</p> : <button className="button-primary w-full" disabled={busy}>{busy ? '…' : token ? (de ? 'Passwort speichern' : 'Save password') : (de ? 'Link anfordern' : 'Send reset link')}</button>}<Link className="block text-sm text-emerald-300" href="/login">{de ? 'Zur Anmeldung' : 'Back to sign in'}</Link></form></section>
}
