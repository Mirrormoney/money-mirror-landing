'use client'
import { useT } from '@/lib/i18n'

export default function Pricing() {
  const t = useT()
  return (
    <section className="container py-16">
      <h1 className="text-3xl font-semibold">{t('pricing_title')}</h1>
      <p className="mt-2 text-slate-300 max-w-2xl">{t('pricing_sub')}</p>
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 p-6">
          <div className="text-slate-400 text-sm">{t('free')}</div>
          <div className="mt-2 text-4xl font-semibold">€0</div>
          <ul className="mt-4 space-y-2 text-slate-300">
            <li>{t('free_f1')}</li>
            <li>{t('free_f2')}</li>
            <li>{t('free_f3')}</li>
          </ul>
          <button className="mt-6 w-full bg-white/10 hover:bg-white/15 py-3 rounded-xl font-semibold">{t('get_started')}</button>
        </div>
        <div className="rounded-2xl border border-brand-accent/30 p-6 bg-brand-accent/5">
          <div className="text-brand-accent text-sm">{t('premium')}</div>
          <div className="mt-2 text-4xl font-semibold">€3.99<span className="text-base text-slate-400">{t('month')}</span></div>
          <ul className="mt-4 space-y-2 text-slate-300">
            <li>{t('prem_f1')}</li>
            <li>{t('prem_f2')}</li>
            <li>{t('prem_f3')}</li>
          </ul>
          <button className="mt-6 w-full bg-brand-accent text-slate-900 hover:opacity-90 py-3 rounded-xl font-semibold">{t('upgrade')}</button>
        </div>
      </div>
    </section>
  )
}
