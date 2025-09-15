// lib/i18n.tsx — complete dictionary (EN/DE) incl. Legal + Import + Manual entry
'use client'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Lang = 'en' | 'de'

const dict = {
  en: {
    // nav & brand
    nav_pricing: 'Pricing',
    nav_faq: 'FAQ',
    nav_import: 'Import CSV',
    nav_demo: 'Try a demo',
    brand: 'MirrorMoney',

    // hero
    hero_title: 'See what your spending could’ve become.',
    hero_sub:
      'MirrorMoney turns past purchases into a risk-free, "what-if" portfolio—so you learn investing by reflection, not regret.',
    hero_cta_primary: 'Try a demo',
    hero_cta_secondary: 'See pricing',
    sample_view: 'Sample "what-if" view',

    // how it works
    hiw_title: 'How it works',
    hiw_sub: 'Three simple steps to reflect, learn, and act.',
    hiw_1_title: '1. Connect or Upload',
    hiw_1_body: 'Link your account securely (or upload a CSV). We only read transactions—with your permission.',
    hiw_2_title: '2. Pick scenarios',
    hiw_2_body: 'Choose ETF, stock, or crypto "what-if" models that map to your real purchases.',
    hiw_3_title: '3. Learn by reflection',
    hiw_3_body: 'See your shadow portfolio grow over time—then decide if/when to start investing for real.',

    // pricing
    pricing_title: 'Pricing',
    pricing_sub: 'Start free. Upgrade when you want more scenarios and history.',
    free: 'Free',
    premium: 'Premium',
    month: '/month',
    free_f1: '• 1 account',
    free_f2: '• Last 60 days',
    free_f3: '• 1 scenario',
    get_started: 'Get started',
    prem_f1: '• Full history',
    prem_f2: '• Multiple scenarios',
    prem_f3: '• Forecasts & export',
    upgrade: 'Upgrade',

    // faq
    faq_title: 'FAQ',
    faq_q1: 'What is MirrorMoney?',
    faq_a1:
      'A learning tool that models how your past spending might have grown if invested, so you can build better habits before moving to real investing.',
    faq_q2: 'Do you need my bank login?',
    faq_a2:
      'For the demo: no. Later, we’ll support secure read-only connections via regulated providers. You can also upload a CSV.',
    faq_q3: 'Is this financial advice?',
    faq_a3: 'No. MirrorMoney is an educational simulation. It is not investment advice.',
    faq_q4: 'How do you make money?',
    faq_a4:
      'We offer a Premium plan with advanced features. When you’re ready to invest for real, we may earn referral fees from partner brokers.',

    // demo page
    demo_title: 'Interactive demo',
    demo_desc:
      'This demo uses mock data. Adjust the "growth" slider below to see how a shadow portfolio might look without risking real money.',
    back: '← Back',
    shadow: 'Shadow portfolio (mock)',
    based_on: 'Based on',
    of_past: 'of past purchases',
    adjust_growth: 'Adjust growth factor',
    current_factor: 'Current factor',

    // footer/legal labels
    contact: 'Contact',
    privacy: 'Privacy',
    terms: 'Terms',
    impressum: 'Impressum (Legal Notice)',
    datenschutz: 'Privacy (Datenschutz)',
    disclaimer: 'No Investment Advice',

    // import page (v1)
    import_title: 'Import transactions (CSV)',
    import_desc:
      'Upload a CSV with date, description, amount — then pick a scenario to see your "what-if" result.',
    csv_format: 'Expected CSV header: date,description,amount (YYYY-MM-DD, positive amount in €)',
    choose_file: 'Choose CSV file',
    scenario: 'Scenario',
    as_of: 'As of',
    process: 'Process CSV',
    clear: 'Clear',
    total_spent: 'Total spent',
    total_hyp: 'Hypothetical value',
    table_date: 'Date',
    table_desc: 'Description',
    table_amt: 'Amount',
    result: 'Result',

    // import step 2 (manual + extras)
    manual_title: 'Add a single entry manually',
    field_date: 'Date',
    field_desc: 'Description',
    field_amount: 'Amount (€)',
    add_row: 'Add entry',
    rows_label: 'rows',
    what_if_value: 'What-if value',
    multiplier: 'Multiplier',
    totals: 'Totals',
    gain: 'Gain',
    remove: 'Remove',
    download_csv: 'Download results (CSV)',
    delete_all: 'Delete all',
  },

  de: {
    // nav & brand
    nav_pricing: 'Preise',
    nav_faq: 'FAQ',
    nav_import: 'CSV importieren',
    nav_demo: 'Demo testen',
    brand: 'MirrorMoney',

    // hero
    hero_title: 'Sieh, was aus deinen Ausgaben hätte werden können.',
    hero_sub:
      'MirrorMoney verwandelt vergangene Käufe in ein risikofreies "What-if"-Portfolio – so lernst du Investieren durch Reflexion statt Reue.',
    hero_cta_primary: 'Demo testen',
    hero_cta_secondary: 'Preise ansehen',
    sample_view: 'Beispielfenster "What-if"',

    // how it works
    hiw_title: 'So funktioniert’s',
    hiw_sub: 'Drei einfache Schritte: reflektieren, lernen, handeln.',
    hiw_1_title: '1. Verbinden oder CSV hochladen',
    hiw_1_body:
      'Konto sicher verknüpfen (oder CSV hochladen). Wir lesen nur Transaktionen – mit deiner Zustimmung.',
    hiw_2_title: '2. Szenarien wählen',
    hiw_2_body: 'ETF, Aktie oder Krypto als "What-if"-Modelle passend zu deinen echten Käufen.',
    hiw_3_title: '3. Durch Reflexion lernen',
    hiw_3_body:
      'Sieh, wie dein Schatten-Portfolio wächst – und entscheide später, ob/wann du wirklich investieren willst.',

    // pricing
    pricing_title: 'Preise',
    pricing_sub: 'Starte gratis. Upgrade, wenn du mehr Szenarien und Historie willst.',
    free: 'Gratis',
    premium: 'Premium',
    month: '/Monat',
    free_f1: '• 1 Konto',
    free_f2: '• Letzte 60 Tage',
    free_f3: '• 1 Szenario',
    get_started: 'Loslegen',
    prem_f1: '• Gesamte Historie',
    prem_f2: '• Mehrere Szenarien',
    prem_f3: '• Prognosen & Export',
    upgrade: 'Upgrade',

    // faq
    faq_title: 'FAQ',
    faq_q1: 'Was ist MirrorMoney?',
    faq_a1:
      'Ein Lern-Tool, das zeigt, wie sich vergangene Ausgaben entwickelt hätten, wenn du investiert hättest – für bessere Gewohnheiten vor dem echten Investieren.',
    faq_q2: 'Braucht ihr mein Bank-Login?',
    faq_a2:
      'Für die Demo: nein. Später ermöglichen wir sichere, schreibgeschützte Verbindungen über regulierte Anbieter. CSV-Upload ist möglich.',
    faq_q3: 'Ist das Finanzberatung?',
    faq_a3: 'Nein. MirrorMoney ist eine Simulation zu Lernzwecken und keine Anlageberatung.',
    faq_q4: 'Wie verdient ihr Geld?',
    faq_a4:
      'Über einen Premium-Plan mit Zusatzfunktionen. Wenn du später wirklich investierst, können wir Vermittlungsgebühren erhalten.',

    // demo page
    demo_title: 'Interaktive Demo',
    demo_desc:
      'Diese Demo nutzt Beispieldaten. Verändere unten den "Wachstums"-Regler und sieh dir an, wie ein Schatten-Portfolio ohne Risiko aussehen könnte.',
    back: '← Zurück',
    shadow: 'Schatten-Portfolio (Demo)',
    based_on: 'Basierend auf',
    of_past: 'an früheren Käufen',
    adjust_growth: 'Wachstumsfaktor anpassen',
    current_factor: 'Aktueller Faktor',

    // footer/legal labels
    contact: 'Kontakt',
    privacy: 'Datenschutz',
    terms: 'Impressum',
    impressum: 'Impressum',
    datenschutz: 'Datenschutz',
    disclaimer: 'Keine Anlageberatung',

    // import page (v1)
    import_title: 'Transaktionen importieren (CSV)',
    import_desc:
      'Lade eine CSV mit Datum, Beschreibung, Betrag hoch – wähle dann ein Szenario für dein "What-if"-Ergebnis.',
    csv_format: 'Erwarteter CSV-Header: date,description,amount (YYYY-MM-DD, positiver Betrag in €)',
    choose_file: 'CSV auswählen',
    scenario: 'Szenario',
    as_of: 'Stichtag',
    process: 'CSV verarbeiten',
    clear: 'Zurücksetzen',
    total_spent: 'Summe Ausgaben',
    total_hyp: 'Hypothetischer Wert',
    table_date: 'Datum',
    table_desc: 'Beschreibung',
    table_amt: 'Betrag',
    result: 'Ergebnis',

    // import step 2 (manual + extras)
    manual_title: 'Einzelnen Eintrag manuell hinzufügen',
    field_date: 'Datum',
    field_desc: 'Beschreibung',
    field_amount: 'Betrag (€)',
    add_row: 'Eintrag hinzufügen',
    rows_label: 'Zeilen',
    what_if_value: 'What-if-Wert',
    multiplier: 'Faktor',
    totals: 'Summen',
    gain: 'Gewinn',
    remove: 'Entfernen',
    download_csv: 'Ergebnis als CSV herunterladen',
    delete_all: 'Alle löschen',
  },
} as const

type Dict = typeof dict

const LangContext = createContext<{
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: keyof Dict['en']) => string
} | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')

  // on first load: use saved choice or browser language
  useEffect(() => {
    const saved =
      typeof window !== 'undefined' ? (localStorage.getItem('lang') as Lang | null) : null
    if (saved) setLang(saved)
    else if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('de'))
      setLang('de')
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('lang', lang)
  }, [lang])

  const t = useMemo(() => {
    return (key: keyof Dict['en']) => (dict[lang][key] ?? dict.en[key]) as string
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

export function useT() {
  return useLanguage().t
}
