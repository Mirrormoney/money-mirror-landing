'use client'
import { useState } from 'react'
import { useT } from '@/lib/i18n'
import { Asset, parseYMD, ratio } from '@/lib/pricing'

type Tx = { date: string; description: string; amount: number }

const SCENARIOS: { key: Asset, label: string }[] = [
  { key: 'SP500', label: 'S&P 500 (demo model)' },
  { key: 'MSCI',  label: 'MSCI World (demo model)' },
  { key: 'BTC',   label: 'Bitcoin (demo model)' },
]

function parseCsv(text: string): Tx[] {
  const lines = text.split(/\r?\n/).filter(l=>l.trim().length>0)
  if (lines.length === 0) return []
  const header = lines[0].split(',').map(s=>s.trim().toLowerCase())
  const idxDate = header.indexOf('date')
  const idxDesc = header.indexOf('description')
  const idxAmt = header.indexOf('amount')
  if (idxDate===-1 || idxDesc===-1 || idxAmt===-1) return []
  const rows: Tx[] = []
  for (let i=1;i<lines.length;i++){
    const row = lines[i].split(',')
    if (row.length < 3) continue
    const date = row[idxDate]?.trim()
    const description = row[idxDesc]?.trim()
    const amount = parseFloat(row[idxAmt]?.trim().replace(',', '.'))
    if (!date || !description || !isFinite(amount)) continue
    rows.push({ date, description, amount })
  }
  return rows
}

export default function ImportPage() {
  const t = useT()
  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<Tx[]>([])
  const [scenario, setScenario] = useState<Asset>('SP500')
  const [asOf, setAsOf] = useState<string>(new Date().toISOString().slice(0,10))
  const [result, setResult] = useState<{ total:number, hypo:number } | null>(null)

  const onFile = async (f: File) => {
    const text = await f.text()
    const parsed = parseCsv(text)
    setFileName(f.name)
    setRows(parsed)
    setResult(null)
  }

  const process = () => {
    const asOfDate = parseYMD(asOf)
    if (!asOfDate) { alert('Invalid As-of date'); return }
    let total = 0, hypo = 0
    for (const r of rows) {
      const d = parseYMD(r.date)
      if (!d) continue
      total += r.amount
      const mult = ratio(scenario, d, asOfDate)
      hypo += r.amount * mult
    }
    setResult({ total, hypo })
  }

  const clearAll = () => { setRows([]); setFileName(null); setResult(null) }

  return (
    <section className="container py-16">
      <h1 className="text-3xl font-semibold">{t('import_title')}</h1>
      <p className="mt-2 text-slate-300 max-w-2xl">{t('import_desc')}</p>
      <p className="mt-1 text-slate-400 text-sm">{t('csv_format')}</p>

      <div className="mt-6 flex flex-col md:flex-row gap-3">
        <label className="inline-flex items-center gap-3">
          <input type="file" accept=".csv,text/csv" onChange={e=>e.target.files && onFile(e.target.files[0])}/>
          <span className="text-sm">{fileName ? fileName : t('choose_file')}</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">{t('scenario')}:</span>
          <select value={scenario} onChange={e=>setScenario(e.target.value as any)} className="bg-white/10 border border-white/10 rounded-md px-2 py-1">
            {SCENARIOS.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">{t('as_of')}:</span>
          <input type="date" value={asOf} onChange={e=>setAsOf(e.target.value)} className="bg-white/10 border border-white/10 rounded-md px-2 py-1"/>
        </div>
        <button onClick={process} className="bg-brand-accent text-slate-900 px-4 py-2 rounded-md font-semibold">{t('process')}</button>
        <button onClick={clearAll} className="border border-white/10 px-4 py-2 rounded-md font-semibold">{t('clear')}</button>
      </div>

      {rows.length === 0 && (
        <div className="mt-6 text-slate-400 text-sm">
          <p>Tip: Try this sample CSV first:</p>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-white/5 p-4 border border-white/10">{`date,description,amount
2025-01-15,Coffee + snack,8.50
2025-02-02,Cab ride,22.00
2025-03-19,Sneakers,120.00
2025-04-28,Movie night,32.00`}</pre>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-8">
          <div className="text-slate-300 text-sm mb-2">{rows.length} rows</div>
          <div className="rounded-xl border border-white/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-4 py-2">{t('table_date')}</th>
                  <th className="text-left px-4 py-2">{t('table_desc')}</th>
                  <th className="text-right px-4 py-2">{t('table_amt')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r,i)=>(
                  <tr key={i} className="odd:bg-white/0 even:bg-white/5">
                    <td className="px-4 py-2">{r.date}</td>
                    <td className="px-4 py-2">{r.description}</td>
                    <td className="px-4 py-2 text-right">€{r.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-white/10 p-6">
            <div className="text-slate-400 text-sm">{t('total_spent')}</div>
            <div className="text-3xl font-semibold mt-1">€{result.total.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-white/10 p-6">
            <div className="text-slate-400 text-sm">{t('total_hyp')}</div>
            <div className="text-3xl font-semibold mt-1">€{result.hypo.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-white/10 p-6">
            <div className="text-slate-400 text-sm">{t('result')}</div>
            <div className="mt-2 text-sm text-slate-300">Calculated with a deterministic demo model (not real market data). For education only.</div>
          </div>
        </div>
      )}
    </section>
  )
}
