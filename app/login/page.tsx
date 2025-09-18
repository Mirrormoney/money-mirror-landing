'use client';
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
export default function LoginPage(): JSX.Element {
  const [email, setEmail] = useState(''); const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false); const [error, setError] = useState<string | null>(null);
  const onEmailSignIn = async () => { const trimmed = email.trim(); if (!trimmed) return;
    setSending(true); setError(null);
    try { const res = await signIn('email', { email: trimmed, redirect: false });
      if (res?.ok) setSent(true); else setError('Could not send the link. Check the email address or server settings.'); }
    catch (e:any) { setError(e?.message || 'Error sending magic link.'); } finally { setSending(false); } };
  return (<main className="min-h-screen"><div className="mx-auto max-w-md px-4 py-16">
    <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
    <div className="space-y-2"><label className="text-sm text-gray-700">Email (magic link)</label>
    <div className="flex gap-2"><input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" className="flex-1 rounded-md border px-3 py-2 text-black bg-white" type="email" autoComplete="email"/>
    <button onClick={onEmailSignIn} disabled={sending || !email} className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50">{sending ? 'Sending…' : 'Send link'}</button></div>
    {sent && <p className="text-sm text-emerald-600 mt-2">If that email exists, we sent you a login link.</p>}
    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}</div></div></main>); }
