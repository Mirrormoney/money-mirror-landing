'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/i18n'

const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => {
  const pathname = usePathname()
  const active = pathname === href
  return (
    <Link href={href} className={`px-3 py-2 rounded-md text-sm font-medium ${active ? 'bg-white/10' : 'hover:bg-white/5'}`}>
      {children}
    </Link>
  )
}

export default function Navbar() {
  const { setLang, t } = useLanguage()
  return (
    <header className="border-b border-white/10">
      <nav className="container py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block w-8 h-8 rounded-xl bg-brand-accent" />
          <span className="text-lg font-semibold">MirrorMoney</span>
        </Link>
        <div className="flex items-center gap-1">
          <NavLink href="/pricing">{t('nav_pricing')}</NavLink>
          <NavLink href="/faq">{t('nav_faq')}</NavLink>
          {/* Removed: <NavLink href="/import">{t('nav_import')}</NavLink> */}
          <a href="/demo" className="ml-2 inline-flex items-center gap-2 bg-brand-accent text-slate-900 hover:opacity-90 px-3 py-2 rounded-md text-sm font-semibold">
            {t('nav_demo')}
          </a>
          <div className="ml-3 flex items-center gap-1">
            <button aria-label="English" title="English" onClick={()=>setLang('en')} className="px-2 py-1 rounded hover:bg-white/10 text-lg">🇬🇧</button>
            <button aria-label="Deutsch" title="Deutsch" onClick={()=>setLang('de')} className="px-2 py-1 rounded hover:bg-white/10 text-lg">🇩🇪</button>
          </div>
        </div>
      </nav>
    </header>
  )
}
