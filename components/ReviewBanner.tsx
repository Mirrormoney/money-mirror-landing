'use client'
import { useLanguage } from '@/lib/i18n'
export default function ReviewBanner() {
  const { lang } = useLanguage()
  return <div className="border-b border-amber-300/10 bg-amber-300/5 px-4 py-2 text-center text-xs text-amber-100/80" role="status">{lang === 'de' ? 'Vorschau: Konten und Ausgaben sind verfügbar. Historische Vergleiche werden noch freigeschaltet.' : 'Review version: accounts and spending are available. Historical comparisons are not yet enabled.'}</div>
}
