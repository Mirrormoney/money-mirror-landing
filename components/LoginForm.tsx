'use client'
import { useEffect, useState, type FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useLanguage } from '@/lib/i18n'
import Link from 'next/link'
export default function LoginForm({ google, apple, emailLink }: { google: boolean; apple: boolean; emailLink: boolean }) {
  const { lang } = useLanguage()
  const de = lang === 'de'
  const [register, setRegister] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  useEffect(() => {
    setRegister(new URLSearchParams(window.location.search).get('mode') === 'register')
  }, [])
  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    if (query.has('error')) setError(de ? 'Anmeldung fehlgeschlagen. Bitte nutze deine ursprüngliche Anmeldemethode.' : 'Sign-in failed. Please use your original sign-in method.')
    if (query.has('sent')) setMessage(de ? 'Bitte prüfe dein E-Mail-Postfach.' : 'Check your inbox for your sign-in link.')
  }, [de])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    const data = new FormData(event.currentTarget)
    try {
      const password = String(data.get('password'))
      if (register) {
        const response = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name: data.get('name') }) })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error)
      }
      const result = await signIn('credentials', { email, password, redirect: false, callbackUrl: '/import' })
      if (result?.error || !result?.ok) throw new Error(de ? 'E-Mail oder Passwort stimmt nicht. Bitte erneut versuchen.' : 'Email or password is incorrect. Please try again.')
      window.location.assign('/import')
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.') } finally { setBusy(false) }
  }
  return <section className="container py-16 sm:py-24"><div className="mx-auto max-w-md">
    <p className="eyebrow">MIRRORMONEY</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">{register ? (de ? 'Dein nächster Blick voraus.' : 'A fresh perspective starts here.') : (de ? 'Willkommen zurück.' : 'Welcome back.')}</h1>
    <p className="mt-4 text-slate-400">{de ? 'Deine Ausgaben. Deine Perspektive. Sicher in deinem Konto.' : 'Your spending. Your perspective. Saved securely in your account.'}</p>
    <div className="panel mt-8 p-6">
      <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-950 p-1">
        {[false, true].map(value => <button type="button" key={String(value)} className={`rounded-md py-2 text-sm ${register === value ? 'bg-slate-800 text-white' : 'text-slate-400'}`} onClick={() => { setRegister(value); setError('') }}>{value ? (de ? 'Konto erstellen' : 'Create account') : (de ? 'Anmelden' : 'Sign in')}</button>)}
      </div>
      <form onSubmit={submit} className="space-y-4">
        {register && <label className="field-label">Name<input className="field" name="name" autoComplete="name" maxLength={80} /></label>}
        <label className="field-label">{de ? 'E-Mail' : 'Email'}<input className="field" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label className="field-label">{de ? 'Passwort' : 'Password'}<input className="field" name="password" type="password" minLength={register ? 12 : 1} maxLength={128} autoComplete={register ? 'new-password' : 'current-password'} required /></label>
        {register && <p className="text-xs text-slate-400">{de ? 'Mindestens 12 Zeichen. Ein langer Satz ist leicht zu merken.' : 'At least 12 characters. A long passphrase is easier to remember.'}</p>}
        {error && <p role="alert" className="notice-error">{error}</p>}{message && <p role="status" className="notice">{message}</p>}
        <button disabled={busy} className="button-primary w-full">{busy ? '…' : register ? (de ? 'Kostenlos starten' : 'Start for free') : (de ? 'Anmelden' : 'Sign in')}</button>
      </form>
      {!register && <Link href="/reset-password" className="mt-4 block text-sm text-slate-400 hover:text-white">{de ? 'Passwort vergessen?' : 'Forgot your password?'}</Link>}
      {(google || apple) && <><div className="my-5 text-center text-xs text-slate-500">{de ? 'oder weiter mit' : 'or continue with'}</div><div className="grid gap-3">{google && <button className="button-secondary" onClick={() => signIn('google', { callbackUrl: '/import' })}>Google</button>}{apple && <button className="button-secondary" onClick={() => signIn('apple', { callbackUrl: '/import' })}>Apple</button>}</div></>}
      {emailLink && <button className="mt-5 text-sm text-emerald-300 hover:underline" disabled={busy || !email} onClick={async () => { setBusy(true); await signIn('email', { email, callbackUrl: '/account' }); setBusy(false) }}>{de ? 'Anmeldelink per E-Mail senden' : 'Email me a sign-in link'}</button>}
    </div>
    <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">{de ? 'So gehen wir mit deinen Daten um:' : 'How we handle your data:'} <Link className="underline" href="/datenschutz">{de ? 'Datenschutz' : 'Privacy policy'}</Link></p>
  </div></section>
}
