'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useT } from '@/lib/i18n'

type Tx = { date: string; description: string; amount: number }

const sampleTx: Tx[] = [
  { date: '2025-01-15', description: 'Coffee + snack', amount: 8.5 },
  { date: '2025-02-02', description: 'Cab ride', amount: 22.0 },
  { date: '2025-03-19', description: 'Sneakers', amount: 120.0 },
  { date: '2025-04-28', description: 'Movie night', amount: 32.0 },
]

export default function Demo() {
  const t = useT()
  const [multiplier, setMultiplier] = useState(1.18)
  const invested = sampleTx.reduce((sum, t) => sum + t.amount, 0)
  const hypothetical = invested * multiplier

  return (
    <section className="container py-16">
      <Link href="/" className="text-slate-400 hover:text-white">{t('back')}</Link>
      <h1 className="mt-4 text-3xl font-semibold">{t('demo_title')}</h1>
      <p className="mt-2 text-slate-300 max-w-2xl">
        {t('demo_desc')}
      </p>

      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-xl border border-white/10 p-6">
          <div className="text-sm text-slate-300">{t('shadow')}</div>
          <div className="mt-2 text-4xl font-semibold">€{hypothetical.toFixed(2)}</div>
          <div className="mt-1 text-slate-400 text-sm">{t('based_on')} €{invested.toFixed(2)} {t('of_past')}</div>

          <div className="mt-6">
            <label className="text-sm text-slate-300">{t('adjust_growth')}</label>
            <input type="range" min="1.00" max="1.50" step="0.01" value={multiplier} onChange={(e)=>setMultiplier(parseFloat(e.target.value))} className="w-full mt-2"/>
            <div className="text-slate-400 text-sm mt-1">{t('current_factor')}: {multiplier.toFixed(2)}×</div>
          </div>

          <div className="mt-6 h-48 rounded-lg bg-white/5 relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full">
              <polyline fill="none" stroke="#34D399" strokeWidth="3" points="0,120 40,118 80,116 120,114 160,110 200,105 240,100 280,95 320,88 360,82 400,76 440,70 480,66 520,60 560,54 600,50" />
            </svg>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 p-6">
          <div className="text-sm text-slate-300">Recent purchases (mock)</div>
          <ul className="mt-3 space-y-3">
            {sampleTx.map((t, i)=>(
              <li key={i} className="flex items-center justify-between">
                <div>
                  <div className="text-slate-300">{t.description}</div>
                  <div className="text-slate-500 text-xs">{t.date}</div>
                </div>
                <div className="font-semibold">€{t.amount.toFixed(2)}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
