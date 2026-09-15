'use client'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'

export default function GuestPreview() {
  const { lang } = useLanguage()
  const de = lang === 'de'
  const money = (value: number) => new Intl.NumberFormat(de ? 'de-DE' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  return <section className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-12">
    <p className="eyebrow">{de ? 'ERST EIN KLEINER EINBLICK' : 'A LITTLE LOOK BEFORE YOU START'}</p>
    <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{de ? 'So sieht eine neue Perspektive aus.' : 'Here’s what another perspective looks like.'}</h1>
    <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400">{de ? 'Du trägst eine Ausgabe ein. MirrorMoney zeigt dir, was derselbe Betrag als Anlage hätte werden können.' : 'You add an expense. MirrorMoney shows what that same amount could have become as an investment.'}</p>
    <div className="panel mt-7 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-5 py-4 sm:px-7">
        <div className="flex items-center gap-3"><img src="/mirrormoney-mark.svg" alt="" width="32" height="32" /><span className="text-sm font-medium">{de ? 'Dein Ausgaben-Spiegel' : 'Your spending mirror'}</span></div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-400">{de ? 'Illustratives Beispiel' : 'Illustrative example'}</span>
      </div>
      <div className="p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-950/60 p-4 text-sm"><div><span className="text-slate-300">{de ? 'Ein Wochenende unterwegs' : 'A weekend away'}</span><p className="mt-1 text-xs text-slate-500">{de ? 'Beispielausgabe · vor einem Jahr' : 'Sample spending · one year ago'}</p></div><span className="font-medium tabular-nums">{money(1000)}</span></div>
        <div className="my-6 grid grid-cols-2 gap-4">
          <div><p className="metric-label">{de ? 'HYPOTHETISCHER WERT' : 'HYPOTHETICAL VALUE'}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-300">{money(1124)}</p></div>
          <div className="text-right"><p className="metric-label">{de ? 'DIE DIFFERENZ' : 'THE DIFFERENCE'}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-300">+{money(124)}</p><p className="mt-1 text-xs text-slate-500">{de ? '+12,4 % im Beispiel' : '+12.4% in this example'}</p></div>
        </div>
        <svg viewBox="0 0 600 150" className="w-full" role="img" aria-label={de ? 'Beispielchart: 1.000 Euro werden zu 1.124 Euro. Frei erfundene Beispielwerte.' : 'Sample chart: 1,000 euros becomes 1,124 euros. Invented illustrative values.'}>
          <defs><linearGradient id="sample-shade" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#34d399" stopOpacity=".18" /><stop offset="1" stopColor="#34d399" stopOpacity="0" /></linearGradient></defs>
          <path d="M8 55H592M8 90H592" stroke="#1e293b" strokeWidth="1" />
          <path d="M8 110H592" stroke="#64748b" strokeWidth="1.5" strokeDasharray="5 6" />
          <path d="M8 110L65 99L113 116L169 89L225 96L283 70L337 76L390 43L443 52L497 31L547 38L592 17V138H8Z" fill="url(#sample-shade)" />
          <path d="M8 110L65 99L113 116L169 89L225 96L283 70L337 76L390 43L443 52L497 31L547 38L592 17" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" /><circle cx="592" cy="17" r="5" fill="#a7f3d0" />
        </svg>
        <div className="flex justify-between text-[11px] text-slate-500"><span>{de ? 'Vor einem Jahr' : 'One year ago'}</span><span>{de ? 'Heute' : 'Today'}</span></div>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400"><span><span className="mr-1 text-emerald-300">●</span>{de ? 'Beispielentwicklung' : 'Sample performance'}</span><span>┄ {de ? 'Ausgangsbetrag' : 'Original amount'}</span></div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">{de ? 'Nur zur Veranschaulichung: Diese Zahlen sind erfunden, keine historischen Marktdaten und keine Prognose. Echte Vergleiche können auch Verluste zeigen.' : 'For illustration only: these figures are invented, not historical market data or a forecast. Real comparisons can also show losses.'}</p>
      </div>
    </div>
    <div className="mt-6 flex flex-wrap items-center gap-4"><Link href="/login?mode=register" className="button-primary">{de ? 'Jetzt kostenlos registrieren →' : 'Create your free account →'}</Link><Link href="/login" className="text-sm text-slate-400 hover:text-white">{de ? 'Schon ein Konto? Anmelden' : 'Already have an account? Sign in'}</Link></div>
    <p className="mt-4 text-xs text-slate-500">{de ? 'Dein kostenloses Konto enthält S&P 500, DAX, Bitcoin und Gold.' : 'Your free account includes S&P 500, DAX, Bitcoin and Gold.'}</p>
  </section>
}
