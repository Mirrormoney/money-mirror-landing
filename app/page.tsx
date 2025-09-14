'use client'
import Section from '@/components/Section'
import Link from 'next/link'
import { useT } from '@/lib/i18n'

export default function Home() {
  const t = useT()
  return (
    <>
      <section className="container py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-brand-accent" /> Early concept
        </div>
        <h1 className="mt-6 text-4xl md:text-6xl font-semibold leading-tight">
          {t('hero_title')}
        </h1>
        <p className="mt-4 text-slate-300 max-w-2xl mx-auto">
          {t('hero_sub')}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a href="#try" className="inline-flex items-center gap-2 bg-brand-accent text-slate-900 px-5 py-3 rounded-xl font-semibold hover:opacity-90">
            {t('hero_cta_primary')}
          </a>
          <Link href="/pricing" className="inline-flex items-center gap-2 border border-white/10 px-5 py-3 rounded-xl font-semibold hover:bg-white/5">
            {t('hero_cta_secondary')}
          </Link>
        </div>

        <div className="mt-16 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-left text-slate-300 text-sm">{t('sample_view')}</div>
          <div className="mt-3 h-48 rounded-lg bg-gradient-to-br from-white/5 to-white/10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-50" style={{backgroundImage: 'linear-gradient(0deg,transparent 24%,rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.06) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.06) 75%, rgba(255,255,255,0.06) 76%, transparent 77%), linear-gradient(90deg,transparent 24%,rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.06) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.06) 75%, rgba(255,255,255,0.06) 76%, transparent 77%)', backgroundSize: '50px 50px'}} />
            <svg className="absolute inset-0 w-full h-full">
              <polyline fill="none" stroke="#34D399" strokeWidth="3" points="0,130 40,120 80,115 120,110 160,100 200,105 240,90 280,95 320,80 360,85 400,70 440,60 480,40 520,45 560,30 600,35 640,20" />
            </svg>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
            <div className="rounded-lg border border-white/10 p-4">
              <div className="text-slate-400 text-xs">May 10, 2024 — €50 coffee+snacks</div>
              <div className="mt-1 text-sm">If invested in S&P 500: <span className="font-semibold text-white">€58.20</span></div>
            </div>
            <div className="rounded-lg border border-white/10 p-4">
              <div className="text-slate-400 text-xs">Aug 2, 2024 — €120 sneakers</div>
              <div className="mt-1 text-sm">If invested in MSCI World ETF: <span className="font-semibold text-white">€132.10</span></div>
            </div>
            <div className="rounded-lg border border-white/10 p-4">
              <div className="text-slate-400 text-xs">Jan 15, 2025 — €30 rideshare</div>
              <div className="mt-1 text-sm">If invested in Bitcoin: <span className="font-semibold text-white">€41.90</span></div>
            </div>
          </div>
        </div>
      </section>

      <Section title={t('hiw_title')} subtitle={t('hiw_sub')}>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-white/10 p-6">
            <div className="text-brand-accent font-semibold">{t('hiw_1_title')}</div>
            <p className="mt-2 text-slate-300">{t('hiw_1_body')}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-6">
            <div className="text-brand-accent font-semibold">{t('hiw_2_title')}</div>
            <p className="mt-2 text-slate-300">{t('hiw_2_body')}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-6">
            <div className="text-brand-accent font-semibold">{t('hiw_3_title')}</div>
            <p className="mt-2 text-slate-300">{t('hiw_3_body')}</p>
          </div>
        </div>
        <div id="try" className="mt-10">
          <a href="/demo" className="inline-flex items-center gap-2 bg-brand-accent text-slate-900 px-5 py-3 rounded-xl font-semibold hover:opacity-90">
            {t('hero_cta_primary')}
          </a>
        </div>
      </Section>
    </>
  )
}
