'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Navbar layout update per request:
 * - Order (L→R): Brand | Try a demo | Pricing | FAQ | Flags
 * - Flags slightly larger
 * - Keep turquoise CTA, brand, styles as before
 */
export default function Navbar() {
  const getLang = () => {
    if (typeof window === 'undefined') return 'en' as const;
    const v = (localStorage.getItem('lang') || 'en').toLowerCase();
    return (v === 'de' ? 'de' : 'en') as const;
  };

  const [lang, setLang] = useState<'en'|'de'>(getLang);

  useEffect(() => {
    const onCustom = () => setLang(getLang());
    const onStorage = (e: StorageEvent) => { if (e.key === 'lang') setLang(getLang()); };
    window.addEventListener('mm:lang', onCustom as any);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('mm:lang', onCustom as any);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setLanguage = (next: 'en'|'de') => {
    try {
      localStorage.setItem('lang', next);
      document?.documentElement?.setAttribute('lang', next);
      window.dispatchEvent(new Event('mm:lang'));
      setLang(next);
    } catch {}
  };

  const pricingLabel = lang === 'de' ? 'Preise' : 'Pricing';
  const faqLabel = 'FAQ';
  const ctaLabel = lang === 'de' ? 'Demo testen' : 'Try a demo';

  return (
    <nav className="w-full">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        {/* Brand left */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-base font-semibold leading-none">MirrorMoney</span>
        </Link>

        {/* Right cluster: CTA | Pricing | FAQ | Flags */}
        <div className="flex items-center gap-4">
          {/* CTA — turquoise */}
          <Link
            href="/import"
            className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm bg-teal-500 hover:bg-teal-600"
            aria-label={ctaLabel}
          >
            {ctaLabel}
          </Link>

          {/* Pricing & FAQ */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/pricing" className="text-sm font-medium hover:opacity-80">{pricingLabel}</Link>
            <Link href="/faq" className="text-sm font-medium hover:opacity-80">{faqLabel}</Link>
          </div>

          {/* Flags (slightly larger) */}
          <div className="inline-flex items-center rounded-full border px-2 py-1 text-xs">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-1 leading-none ${lang === 'en' ? 'font-semibold' : 'text-gray-500'} text-base`}
              aria-label="Switch to English"
              title="English"
            >
              🇬🇧
            </button>
            <span className="px-1 text-gray-400">/</span>
            <button
              type="button"
              onClick={() => setLanguage('de')}
              className={`px-1 leading-none ${lang === 'de' ? 'font-semibold' : 'text-gray-500'} text-base`}
              aria-label="Auf Deutsch umschalten"
              title="Deutsch"
            >
              🇩🇪
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
