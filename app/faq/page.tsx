'use client'
import { useT } from '@/lib/i18n'

export default function FAQ() {
  const t = useT()
  const faqs = [
    { q: t('faq_q1'), a: t('faq_a1') },
    { q: t('faq_q2'), a: t('faq_a2') },
    { q: t('faq_q3'), a: t('faq_a3') },
    { q: t('faq_q4'), a: t('faq_a4') },
  ]
  return (
    <section className="container py-16">
      <h1 className="text-3xl font-semibold">{t('faq_title')}</h1>
      <div className="mt-8 space-y-6">
        {faqs.map((f, i)=>(
          <div key={i} className="rounded-xl border border-white/10 p-6">
            <div className="font-semibold">{f.q}</div>
            <div className="mt-2 text-slate-300">{f.a}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
