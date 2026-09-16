'use client'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'
import { FREE_BENCHMARKS, type Benchmark } from '@/lib/benchmarks'
import type { Spending, PortfolioPoint } from '@/lib/portfolio'
import { parseSpendingCsv, spendingCsv } from '@/lib/csv'
import PortfolioChart from './PortfolioChart'

type Result = { points: PortfolioPoint[]; spent: number; value: number; gain: number; gainPercent: number; pending: number; priceDate: string; stale: boolean; source: string; sourceUrl: string; historyStart: string; cachedFallback: boolean; adjusted: boolean }
async function api(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' })
  if (response.status === 401) { window.location.assign('/login'); throw new Error('Please sign in.') }
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'Please try again.')
  return data
}
function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export default function Dashboard() {
  const { lang } = useLanguage(), de = lang === 'de', locale = de ? 'de-DE' : 'en-GB'
  const t = (en: string, german: string) => de ? german : en
  const [currency, setCurrency] = useState('EUR')
  useEffect(() => { try { const saved = localStorage.getItem('mirrormoney-display-currency'); if (saved && ['EUR', 'USD', 'CHF', 'GBP', 'JPY'].includes(saved)) setCurrency(saved) } catch {} }, [])
  const [spending, setSpending] = useState<Spending[]>([])
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>(FREE_BENCHMARKS)
  const [premium, setPremium] = useState(false)
  const [selected, setSelected] = useState(FREE_BENCHMARKS[0].id)
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(true), [chartLoading, setChartLoading] = useState(false), [busy, setBusy] = useState(false)
  const [error, setError] = useState(''), [chartError, setChartError] = useState(''), [notice, setNotice] = useState('')
  const [revision, setRevision] = useState(0), [editing, setEditing] = useState<Spending | null>(null)
  const [date, setDate] = useState(''), [amount, setAmount] = useState(''), [description, setDescription] = useState(''), [category, setCategory] = useState('Other')
  const [search, setSearch] = useState(''), [searching, setSearching] = useState(false), [matches, setMatches] = useState<Benchmark[]>([])
  const [importRows, setImportRows] = useState<ReturnType<typeof parseSpendingCsv> | null>(null)
  const [filter, setFilter] = useState(''), [page, setPage] = useState(1)
  const amountInput = useRef<HTMLInputElement>(null), fileInput = useRef<HTMLInputElement>(null)
  const money = (n: number) => new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
  const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
  const reload = useCallback(async () => {
    const [entries, assets] = await Promise.all([api('/api/spending'), api('/api/benchmarks')])
    setSpending(entries.spending); setBenchmarks(assets.benchmarks); setPremium(assets.premium); setRevision(r => r + 1)
  }, [])
  useEffect(() => { setDate(localToday()); reload().catch(e => setError(e.message)).finally(() => setLoading(false)) }, [reload])
  useEffect(() => {
    if (!spending.length) { setResult(null); return }
    const controller = new AbortController()
    setChartLoading(true); setChartError(''); setResult(null)
    fetch(`/api/portfolio?benchmark=${encodeURIComponent(selected)}`, { signal: controller.signal, cache: 'no-store' }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d }).then(d => { if (!controller.signal.aborted) setResult(d.empty ? null : d) }).catch(e => { if (!controller.signal.aborted) setChartError(e.message) }).finally(() => { if (!controller.signal.aborted) setChartLoading(false) })
    return () => controller.abort()
  }, [selected, revision, spending.length])
  const reset = () => { setEditing(null); setAmount(''); setDescription(''); setCategory('Other'); setDate(localToday()) }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      const normalized = amount.trim().replace(',', '.')
      if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error(t('Enter a positive amount with up to two decimals.', 'Bitte einen positiven Betrag mit maximal zwei Nachkommastellen eingeben.'))
      await api('/api/spending', editing ? 'PATCH' : 'POST', { id: editing?.id, date, amountCents: Math.round(Number(normalized) * 100), description, category })
      reset(); await reload(); setNotice(t('Saved to your account.', 'In deinem Konto gespeichert.')); amountInput.current?.focus()
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  async function remove(row: Spending) {
    if (!window.confirm(t(`Delete “${row.description}”?`, `„${row.description}“ löschen?`))) return
    setBusy(true); setError('')
    try { await api('/api/spending', 'DELETE', { id: row.id }); await reload(); if (editing?.id === row.id) reset() } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  async function find(event: FormEvent) {
    event.preventDefault(); setSearching(true); setError('')
    try { const data = await api(`/api/benchmarks?q=${encodeURIComponent(search)}`); setMatches(data.results); if (!data.results.length) setNotice(t('No matching instrument. Try its name or ticker; not every ISIN has price history.', 'Kein Treffer. Versuche Name oder Kürzel; nicht jede ISIN hat Kursdaten.')) } catch (e) { setError((e as Error).message) } finally { setSearching(false) }
  }
  const total = spending.reduce((sum, row) => sum + row.amountCents, 0) / 100
  const benchmark = benchmarks.find(b => b.id === selected) ?? FREE_BENCHMARKS[0]
  const filtered = spending.filter(row => `${row.description} ${row.category} ${row.date}`.toLowerCase().includes(filter.toLowerCase()))
  return <div className="container py-10 sm:py-14">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{t('YOUR MONEY, IN PERSPECTIVE', 'DEIN GELD, AUS EINER NEUEN PERSPEKTIVE')}</p><h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">{t('Your spending mirror.', 'Dein Ausgaben-Spiegel.')}</h1><p className="mt-3 text-slate-400">{t('A little reflection. A clearer picture of what comes next.', 'Ein kurzer Rückblick. Ein klarerer Blick nach vorn.')}</p></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-xs text-emerald-300">{premium ? 'Premium' : 'Free'}</span></div>
    <div className="mt-5 flex flex-wrap items-center gap-3"><label className="flex items-center gap-3 text-sm text-slate-300">{t('Display currency', 'Anzeigewährung')}<select className="field w-auto" value={currency} onChange={e => { setCurrency(e.target.value); try { localStorage.setItem('mirrormoney-display-currency', e.target.value) } catch {} }}>{['EUR', 'USD', 'CHF', 'GBP', 'JPY'].map(code => <option key={code} value={code}>{code}</option>)}</select></label><p className="text-xs text-slate-500">{t('Labels only: amounts stay unchanged. Benchmark returns remain EUR-based.', 'Nur die Anzeige: Beträge bleiben gleich. Benchmark-Renditen bleiben EUR-basiert.')}</p></div>
    {error && <div role="alert" className="notice-error mt-6">{error}</div>}{notice && <div role="status" className="notice mt-6">{notice}</div>}
    <section className="panel mt-8 p-5 sm:p-6" aria-labelledby="add-title">
      <div className="mb-4 flex items-center justify-between"><h2 id="add-title" className="font-medium">{editing ? t('Edit spending', 'Ausgabe bearbeiten') : t('What did you spend?', 'Was hast du ausgegeben?')}</h2>{editing && <button className="text-sm text-slate-400" onClick={reset}>{t('Cancel', 'Abbrechen')}</button>}</div>
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.1fr_2fr_1.3fr_auto] items-end">
        <label className="field-label">{t('Amount', 'Betrag')} ({currency})<input ref={amountInput} className="field" inputMode="decimal" placeholder="4.50" value={amount} onChange={e => setAmount(e.target.value)} required maxLength={14} /></label>
        <label className="field-label">{t('Date', 'Datum')}<input className="field" type="date" value={date} max={localToday()} min="1970-01-01" onChange={e => setDate(e.target.value)} required /></label>
        <label className="field-label">{t('Description', 'Beschreibung')}<input className="field" placeholder={t('Coffee, new shoes, a weekend away…', 'Kaffee, neue Schuhe, ein Kurzurlaub…')} value={description} onChange={e => setDescription(e.target.value)} required maxLength={160} /></label>
        <label className="field-label">{t('Category', 'Kategorie')}<select className="field" value={category} onChange={e => setCategory(e.target.value)}>{['Food & drink', 'Shopping', 'Travel', 'Subscriptions', 'Other'].map((c, i) => <option key={c} value={c}>{de ? ['Essen & Trinken', 'Shopping', 'Reisen', 'Abos', 'Sonstiges'][i] : c}</option>)}</select></label>
        <button className="button-primary h-[46px]" disabled={busy || loading}>{busy ? '…' : editing ? t('Save', 'Speichern') : t('+ Add spending', '+ Hinzufügen')}</button>
      </form>
    </section>
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      <div className="panel p-5"><p className="metric-label">{t('TOTAL SPENT', 'GESAMTAUSGABEN')}</p><p className="metric">{money(total)}</p><p className="mt-2 text-xs text-slate-500">{spending.length} {t('saved entries', 'gespeicherte Einträge')}</p></div>
      <div className="panel p-5"><p className="metric-label">{t('COULD BE WORTH', 'HYPOTHETISCHER WERT')}</p><p className="metric text-emerald-300">{result ? money(result.value) : '—'}</p><p className="mt-2 text-xs text-slate-500">{benchmark.name} · {t('historical comparison', 'historischer Vergleich')}</p></div>
      <div className="panel p-5"><p className="metric-label">{t('THE DIFFERENCE', 'DIE DIFFERENZ')}</p><p className={`metric ${result && result.gain < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{result ? `${result.gain >= 0 ? '+' : ''}${money(result.gain)}` : '—'}</p><p className="mt-2 text-xs text-slate-500">{result ? `${result.gainPercent >= 0 ? '+' : ''}${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(result.gainPercent)}%` : t('Gains and losses are both possible', 'Gewinne und Verluste sind möglich')}</p></div>
    </div>
    <section className="panel mt-6 p-5 sm:p-7" aria-labelledby="comparison-title">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="comparison-title" className="text-lg font-medium">{t('What if you had invested it?', 'Was wäre bei einer Anlage passiert?')}</h2><span className="text-xs text-slate-500">{t('Daily closing prices', 'Tägliche Schlusskurse')} · {currency}</span></div>
      <div className="my-5 flex flex-wrap gap-2" aria-label={t('Choose benchmark', 'Benchmark wählen')}>{benchmarks.map(b => <button key={b.id} aria-pressed={b.id === selected} onClick={() => setSelected(b.id)} className={`rounded-lg border px-4 py-2 text-sm transition ${b.id === selected ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-200' : 'border-white/10 text-slate-400 hover:text-white'}`}><span style={{ color: b.color ?? '#c084fc' }} className="mr-2">●</span>{b.name}</button>)}</div>
      <p className="mb-4 text-xs text-slate-400">{t('Calculated using', 'Berechnet mit')}: {benchmark.proxy ?? benchmark.name} · {benchmark.currency}{result ? ' · ' + t('Available from', 'Verfügbar ab') + ' ' + result.historyStart : ''}</p>
      {loading || chartLoading ? <div role="status" className="grid min-h-64 place-items-center text-slate-400 animate-pulse">{t('Preparing your comparison…', 'Dein Vergleich wird vorbereitet…')}</div> : !spending.length ? <div className="grid min-h-64 place-items-center text-center"><div><div className="mb-4 text-4xl text-emerald-300">↗</div><h3 className="text-xl">{t('Every purchase has another possibility.', 'Jeder Kauf hat eine andere Möglichkeit.')}</h3><p className="mx-auto mt-3 max-w-md text-sm text-slate-400">{t('Add your first expense above. We’ll compare it with real historical prices, starting on the day you spent it.', 'Füge oben deine erste Ausgabe hinzu. Wir vergleichen sie mit echten historischen Kursen ab dem Tag der Ausgabe.')}</p></div></div> : chartError ? <div role="alert" className="my-10 notice-error">{chartError}<button className="ml-3 underline" onClick={() => setRevision(r => r + 1)}>{t('Retry', 'Erneut versuchen')}</button></div> : result && <>
        <PortfolioChart points={result.points} color={benchmark.color ?? '#c084fc'} locale={locale} currency={currency} />
        <p className="mt-4 text-xs text-slate-500">{t('Latest available close', 'Letzter verfügbarer Schlusskurs')}: {result.priceDate} · <a href={result.sourceUrl} target="_blank" rel="noreferrer" className="underline">{result.source}</a>{result.pending > 0 ? ` · ${money(result.pending)} ${t('awaiting a trading close', 'warten auf einen Schlusskurs')}` : ''}</p>
        {result.cachedFallback && <p className="notice mt-3">{t('The source could not refresh. Showing the last saved prices and their date.', 'Die Quelle konnte nicht aktualisiert werden. Die zuletzt gespeicherten Kurse mit Datum werden angezeigt.')}</p>}
        {result.stale && <p className="notice-error mt-3">{t('This instrument’s latest price is over seven days old. The value shown is not current.', 'Der letzte Kurs dieses Instruments ist über sieben Tage alt. Der angezeigte Wert ist nicht aktuell.')}</p>}
      </>}
      <details className="mt-5 border-t border-white/5 pt-4 text-xs leading-relaxed text-slate-400"><summary className="cursor-pointer">{t('How this comparison works', 'So funktioniert der Vergleich')}</summary><p className="mt-3">{t('Each expense buys hypothetical units at the first available close on or after its date. Amounts stay in cash until that close exists. Foreign prices are converted to euros using historical exchange rates. S&P 500 is represented by SPY, DAX by EXS1.DE, and Gold by GLD. These funds approximate their benchmarks and include fund costs and tracking differences. Bitcoin uses BTC-EUR. Adjusted prices, where supplied, reflect the provider’s split and dividend adjustments; otherwise closing prices are used. No fees, taxes, interest on cash or trading spreads are included. These are historical illustrations, not investment recommendations or forecasts.', 'Jede Ausgabe kauft hypothetische Anteile zum ersten verfügbaren Schlusskurs am oder nach dem Ausgabedatum. Bis dahin bleibt der Betrag unverzinstes Bargeld. Fremdwährungen werden mit historischen Wechselkursen in Euro umgerechnet. SPY bildet den S&P 500 ab, EXS1.DE den DAX und GLD Gold. Diese Fonds nähern die Benchmarks an und enthalten Fondskosten und Tracking-Abweichungen. Bitcoin verwendet BTC-EUR. Soweit geliefert, berücksichtigen bereinigte Kurse die Split- und Dividendenanpassungen des Anbieters; sonst werden Schlusskurse verwendet. Gebühren, Steuern und Handelsspannen sind nicht enthalten. Dies sind historische Beispiele, keine Anlageempfehlungen oder Prognosen.')}</p></details>
    </section>
    <section className="panel mt-6 p-5 sm:p-6"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-medium">{t('Your own benchmarks', 'Deine eigenen Benchmarks')}</h2><p className="mt-1 text-sm text-slate-400">{t('Search by ISIN, ticker or name. Availability depends on market-data coverage.', 'Suche nach ISIN, Kürzel oder Name. Die Verfügbarkeit hängt von der Datenabdeckung ab.')}</p></div><span className="text-xs text-emerald-300">PREMIUM</span></div>
      {premium ? <><form onSubmit={find} className="mt-4 flex gap-2"><input className="field" aria-label="ISIN, ticker or name" placeholder="US0378331005 · Apple · AAPL" value={search} onChange={e => setSearch(e.target.value)} minLength={2} maxLength={80} required /><button className="button-secondary" disabled={searching}>{searching ? '…' : t('Search', 'Suchen')}</button></form><ul className="mt-3 divide-y divide-white/5">{matches.map(m => <li key={m.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm">{m.name}</p><p className="text-xs text-slate-500">{m.id} · {m.currency} · {m.isin}</p></div><button disabled={busy} className="button-secondary" onClick={async () => { setBusy(true); try { await api('/api/benchmarks', 'POST', { id: m.id }); await reload(); setSelected(m.id); setMatches([]); setSearch('') } catch (e) { setError((e as Error).message) } finally { setBusy(false) } }}>{t('Add', 'Hinzufügen')}</button></li>)}</ul><div className="mt-3 flex flex-wrap gap-2">{benchmarks.filter(b => !FREE_BENCHMARKS.some(f => f.id === b.id)).map(b => <button key={b.id} className="text-xs text-slate-400 underline" onClick={async () => { try { await api('/api/benchmarks', 'DELETE', { id: b.id }); setSelected(FREE_BENCHMARKS[0].id); await reload() } catch (e) { setError((e as Error).message) } }}>{t('Remove', 'Entfernen')} {b.name}</button>)}</div></> : <Link href="/pricing" className="mt-4 inline-block text-sm text-emerald-300 hover:underline">{t('Explore Premium →', 'Premium entdecken →')}</Link>}
    </section>
    <section className="panel mt-6 overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6"><h2 className="font-medium">{t('Your spending', 'Deine Ausgaben')}</h2><div className="flex flex-wrap gap-2"><button className="button-secondary text-xs" onClick={() => fileInput.current?.click()} disabled={busy}>{t('Import CSV', 'CSV importieren')}</button><button className="button-secondary text-xs" disabled={!spending.length} onClick={() => download(spendingCsv(spending), 'mirrormoney-spending.csv')}>{t('Export CSV', 'CSV exportieren')}</button><button className="text-xs text-slate-400 underline" onClick={() => download('date,amount,description,category\n2025-01-15,4.50,Coffee,Food & drink', 'mirrormoney-template.csv')}>{t('CSV template', 'CSV-Vorlage')}</button></div></div>
      <input ref={fileInput} type="file" accept=".csv,text/csv" className="hidden" onChange={async e => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; setError(''); try { if (file.size > 500000) throw new Error(t('File is too large.', 'Die Datei ist zu groß.')); setImportRows(parseSpendingCsv(await file.text())) } catch (err) { setError((err as Error).message) } }} />
      {importRows && <div className="mx-5 mb-5 rounded-lg border border-emerald-400/20 p-4"><p>{t('Ready to import', 'Bereit zum Import')}: {importRows.length} · {money(importRows.reduce((s, r) => s + r.amountCents, 0) / 100)}</p><p className="mt-1 text-xs text-slate-400">{t('These rows will be added to your existing spending. Import each file only once to avoid duplicates.', 'Diese Zeilen werden zu deinen Ausgaben hinzugefügt. Jede Datei nur einmal importieren, um Duplikate zu vermeiden.')}</p><div className="mt-3 flex gap-2"><button disabled={busy} className="button-primary" onClick={async () => { setBusy(true); try { await api('/api/spending', 'POST', { entries: importRows }); setImportRows(null); await reload(); setNotice(t('Import complete.', 'Import abgeschlossen.')) } catch (e) { setError((e as Error).message) } finally { setBusy(false) } }}>{t('Import entries', 'Einträge importieren')}</button><button className="button-secondary" onClick={() => setImportRows(null)}>{t('Cancel', 'Abbrechen')}</button></div></div>}
      {!!spending.length && <div className="px-5 pb-4"><input className="field max-w-sm" aria-label={t('Filter spending', 'Ausgaben filtern')} placeholder={t('Search your spending…', 'Ausgaben durchsuchen…')} value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} /></div>}
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y border-white/5 bg-slate-950/40 text-xs text-slate-500"><tr><th className="px-5 py-3">{t('Date', 'Datum')}</th><th className="px-5 py-3">{t('Description', 'Beschreibung')}</th><th className="px-5 py-3 text-right">{t('Amount', 'Betrag')}</th><th className="px-5 py-3"><span className="sr-only">{t('Actions', 'Aktionen')}</span></th></tr></thead><tbody className="divide-y divide-white/5">{filtered.slice((page - 1) * 20, page * 20).map(row => <tr key={row.id}><td className="whitespace-nowrap px-5 py-4 text-slate-400">{new Date(`${row.date}T12:00:00`).toLocaleDateString(locale)}</td><td className="px-5 py-4"><div>{row.description}</div><div className="mt-1 text-xs text-slate-500">{row.category}</div></td><td className="whitespace-nowrap px-5 py-4 text-right tabular-nums">{money(row.amountCents / 100)}</td><td className="px-5 py-4"><div className="flex justify-end gap-3"><button disabled={busy} className="text-xs text-emerald-300" onClick={() => { setEditing(row); setDate(row.date); setAmount((row.amountCents / 100).toFixed(2)); setDescription(row.description); setCategory(row.category); amountInput.current?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>{t('Edit', 'Bearbeiten')}</button><button disabled={busy} className="text-xs text-slate-400 hover:text-rose-300" onClick={() => remove(row)}>{t('Delete', 'Löschen')}</button></div></td></tr>)}</tbody></table></div>
      {!filtered.length && <p className="p-8 text-center text-sm text-slate-500">{loading ? t('Loading…', 'Laden…') : t('No spending to show yet.', 'Noch keine Ausgaben vorhanden.')}</p>}{filtered.length > 20 && <div className="flex items-center justify-between p-5 text-sm"><button disabled={page === 1} onClick={() => setPage(p => p - 1)}>{t('Previous', 'Zurück')}</button><span>{page} / {Math.ceil(filtered.length / 20)}</span><button disabled={page * 20 >= filtered.length} onClick={() => setPage(p => p + 1)}>{t('Next', 'Weiter')}</button></div>}
    </section>
  </div>
}
