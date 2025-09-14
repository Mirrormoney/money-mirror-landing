'use client'
import { useT } from '@/lib/i18n'

export default function Footer() {
  const t = useT()
  return (
    <footer className="mt-24 border-t border-white/10">
      <div className="container py-10 text-sm text-slate-400 flex flex-col md:flex-row gap-4 justify-between">
        <p>© {new Date().getFullYear()} MirrorMoney. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white">{t('privacy')}</a>
          <a href="#" className="hover:text-white">{t('terms')}</a>
          <a href="mailto:hello@money-mirror.com" className="hover:text-white">{t('contact')}</a>
        </div>
      </div>
    </footer>
  )
}
