'use client'
import { useMemo, useState } from 'react'
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

function fmtEUR(n: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(n)
}

export default function ImportPage() {
  const t = useT()
  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<Tx[]>([])
  const [scenario, setScenario] = useState<Asset>('SP500')
  const [asOf, setAsOf] = useState<string>(new Date().toISOString().slice(0,10))

  // Manual entry form
  const [mDate, setMDate] = useState<string>('')
  const [mDesc, setMDesc] = useState<string>('')
  const [mAmt, setMAmt] = useState<string>('')

  const onFile = async (f: File) => {
    const text = await f.text()
    const parsed = parseCsv(text)
    setFileName(f.name)
    setRows(parsed)
  }

  const addManual = () => {
    if (!mDate || !parseYMD(mDate)) { alert('Invalid date'); return }
    const amt = parseFloat(mAmt.replace(',', '.'))
    if (!isFinite(amt) || amt <= 0) { alert('Invalid amount'); return }
    const desc = mDesc?.trim() || 'Manual entry'
    setRows(prev => [...prev, { date: mDate, amount: amt, description: desc }])
    setMDate(''); setMDesc(''); setMAmt('')
    if (!fileName) setFileName('manual')
  }

  const removeRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => { setRows([]); setFileName(null) }

  const asOfDate = useMemo(()=> parseYMD(asOf), [asOf])

  // Compute per-row results (sorted by date for display)
  const computed = useMemo(()=>{
    if (!asOfDate) return []
    return rows
      .map((r, idx) => {
        const d = parseYMD(r.date)
        if (!d) return null
        const mult = ratio(scenario, d, asOfDate)
        const value = r.amount * mult
        return { ...r, index: idx, mult, value, dateObj: d }
      })
      .filter(Boolean as any)
      .sort((a:any,b:any)=> a.dateObj.getTime() - b.dateObj.getTime())
  }, [rows, scenario, asOfDate])

  const totals = useMemo(()=>{
    const spent = (computed as any[]).reduce((s, r:any)=>s + r.amount, 0)
    const hypo  = (computed as any[]).reduce((s, r:any)=>s + r.value, 0)
    return { spent, hypo, gain: hypo - spent }
  }, [computed])

  // CSV export of results
  const downloadCsv = () => {
    const header = ['date','description','amount','scenario','as_of','multiplier','what_if_value']
    const lines = [header.join(',')]
    for (const r of computed as any[]) {
      lines.push(`${r.date},${r.description.replace(/,/g,';')},${r.amount.toFixed(2)},${scenario},${asOf},${r.mult.toFixed(6)},${r.value.toFixed(2)}`)
    }
    lines.push(`TOTAL,,${totals.spent.toFixed(2)},${scenario},${asOf},,${totals.hypo.toFixed(2)}`)
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `money-mirror-results-${asOf}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Simple cumulative chart path (SVG polyline)
  const chartPath = useMemo(()=>{
    if ((computed as any[]).length === 0) return ''
    const cumVals:number[] = []
    let sum = 0
    for (const r of computed as any[]) { sum += r.value; cumVals.push(sum) }
    const w = 640, h = 160, pad = 8
    const n = cumVals.length
    const minV = Math.min(...cumVals)
    const maxV = Math.max(...cumVals)
    const span = Math.max(1e-6, maxV - minV)
    const pts = cumVals.map((v,i)=>{
      const x = pad + (i*(w-2*pad))/(Math.max(1,n-1))
      const y = pad + (h-2*pad) * (1 - (v - minV)/span)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    return pts.join(' ')
  }, [computed])

  return (
    <section className="container py-16">
      <h1 className="text-3xl font-semibold">{t('import_title')}</h1>
      <p className="mt-2 text-slate-300 max-w-2xl">{t('import_desc')}</p>
      <p className="mt-1 text-slate-400 text-sm">{t('csv_format')}</p>

      {/* Controls */}
      <div className="mt-6 flex flex-col md:flex-row md:items-end gap-3">
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
        <button onClick={downloadCsv} disabled={(computed as any[]).length===0} className="border border-white/10 px-4 py-2 rounded-md font-semibold disabled:opacity-50">
          {t('download_csv')}
        </button>
        <button onClick={clearAll} className="border border-white/10 px-4 py-2 rounded-md font-semibold">{t('delete_all')}</button>
      </div>

      {/* Manual entry */}
      <div className="mt-6 rounded-xl border border-white/10 p-4">
        <div className="text-sm text-slate-300 mb-2">{t('manual_title')}</div>
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t('field_date')}</label>
            <input type="date" value={mDate} onChange={e=>setMDate(e.target.value)} className="w-full bg-white/10 border border-white/10 rounded-md px-2 py-1"/>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t('field_amount')}</label>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={mAmt} onChange={e=>setMAmt(e.target.value)} className="w-full bg-white/10 border border-white/10 rounded-md px-2 py-1"/>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs text-slate-400 mb-1">{t('field_desc')}</label>
            <input type="text" value={mDesc} onChange={e=>setMDesc(e.target.value)} className="w-full bg-white/10 border border-white/10 rounded-md px-2 py-1" placeholder="Coffee, taxi, ..." />
          </div>
          <div className="self-end">
            <button onClick={addManual} className="w-full bg-brand-accent text-slate-900 px-4 py-2 rounded-md font-semibold">{t('add_row')}</button>
          </div>
        </div>
      </div>

      {/* Table */}
      {(computed as any[]).length > 0 && (
        <div className="mt-8">
          <div className="text-slate-300 text-sm mb-2">
            {(computed as any[]).length} {t('rows_label')}
          </div>
          <div className="rounded-xl border border-white/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-4 py-2">{t('table_date')}</th>
                  <th className="text-left px-4 py-2">{t('table_desc')}</th>
                  <th className="text-right px-4 py-2">{t('table_amt')}</th>
                  <th className="text-right px-4 py-2">{t('multiplier')}</th>
                  <th className="text-right px-4 py-2">{t('what_if_value')}</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {(computed as any[]).map((r:any, i:number)=>(
                  <tr key={i} className="odd:bg-white/0 even:bg-white/5">
                    <td className="px-4 py-2">{r.date}</td>
                    <td className="px-4 py-2">{r.description}</td>
                    <td className="px-4 py-2 text-right">{fmtEUR(r.amount)}</td>
                    <td className="px-4 py-2 text-right">{r.mult.toFixed(3)}×</td>
                    <td className="px-4 py-2 text-right font-semibold">{fmtEUR(r.value)}</td>
                    <td className="px-2 py-2 text-right">
                      <button onClick={()=>removeRow(r.index)} className="text-slate-300 hover:text-white text-xs underline">{t('remove')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-white/5">
                  <td className="px-4 py-2 font-semibold" colSpan={2}>{t('totals')}</td>
                  <td className="px-4 py-2 text-right font-semibold">{fmtEUR(totals.spent)}</td>
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2 text-right font-semibold">{fmtEUR(totals.hypo)}</td>
                  <td className="px-2 py-2"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-slate-400" colSpan={4}>{t('gain')}</td>
                  <td className="px-4 py-2 text-right">{fmtEUR(totals.gain)}</td>
                  <td className="px-2 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Chart */}
          <div className="mt-6 rounded-lg border border-white/10 p-4">
            <div className="text-sm text-slate-300 mb-2">Cumulative {t('what_if_value')}</div>
            <div className="relative h-44">
              <svg viewBox="0 0 640 160" className="absolute inset-0 w-full h-full">
                <rect x="0" y="0" width="640" height="160" fill="transparent"/>
                <polyline fill="none" stroke="#34D399" strokeWidth="3" points={chartPath} />
              </svg>
            </div>
          </div>
        </div>
      )}

      {(computed as any[]).length === 0 && (
        <div className="mt-6 text-slate-400 text-sm">
          <p>Tip: Try this sample CSV first:</p>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-white/5 p-4 border border-white/10">{`date,description,amount
2025-01-15,Coffee + snack,8.50
2025-02-02,Cab ride,22.00
2025-03-19,Sneakers,120.00
2025-04-28,Movie night,32.00`}</pre>
        </div>
      )}
    </section>
  )
}
