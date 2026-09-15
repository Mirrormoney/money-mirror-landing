'use client'
import { useLanguage } from '@/lib/i18n'
export default function ReviewBanner() {
  const { lang } = useLanguage()
  return <div className="border-b border-emerald-300/10 bg-emerald-300/5 px-4 py-2 text-center text-xs text-slate-400" role="status">{lang === 'de' ? 'Kostenlose Testversion · Historische Vergleiche mit Fonds und Bitcoin · Kurse können abweichen.' : 'Free prototype · Historical comparisons using funds and Bitcoin · Prices may differ.'}</div>
}
