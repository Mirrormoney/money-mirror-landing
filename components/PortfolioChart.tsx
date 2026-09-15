'use client'
import { useState } from 'react'
import type { PortfolioPoint } from '@/lib/portfolio'
export default function PortfolioChart({ points, color, locale }: { points: PortfolioPoint[]; color: string; locale: string }) {
  const [index, setIndex] = useState<number | null>(null)
  if (!points.length) return null
  const width = 900, height = 300, pad = 50
  const max = Math.max(1, ...points.flatMap(p => [p.value, p.spent])) * 1.08
  const start = Date.parse(points[0].date), span = Math.max(86400000, Date.parse(points.at(-1)!.date) - start)
  const x = (date: string) => pad + (Date.parse(date) - start) / span * (width - pad * 2)
  const y = (value: number) => height - pad - value / max * (height - pad * 1.5)
  const path = (key: 'value' | 'spent') => points.map((p, i) => `${i ? 'L' : 'M'}${x(p.date)},${y(p[key])}`).join(' ')
  const selected = points[index ?? points.length - 1]
  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value)
  return <div>
    <div className="flex flex-wrap justify-between gap-2 text-sm text-slate-400"><span>{new Date(`${selected.date}T12:00:00`).toLocaleDateString(locale)}</span><span><span style={{ color }}>{money(selected.value)}</span><span className="ml-4">{locale === 'de-DE' ? 'Ausgegeben' : 'Spent'} {money(selected.spent)}</span></span></div>
    <svg className="mt-3 w-full touch-pan-y" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={locale === 'de-DE' ? 'Historischer Vergleich: Ausgaben und hypothetischer Wert' : 'Historical comparison of spending and hypothetical value'} onMouseLeave={() => setIndex(null)} onMouseMove={e => {
      const rect = e.currentTarget.getBoundingClientRect(); const position = (e.clientX - rect.left) / rect.width * width
      const target = start + (position - pad) / (width - pad * 2) * span
      let best = 0; for (let i = 1; i < points.length; i++) if (Math.abs(Date.parse(points[i].date) - target) < Math.abs(Date.parse(points[best].date) - target)) best = i
      setIndex(best)
    }}>
      <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".14" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {[0, 1, 2, 3, 4].map(i => <g key={i}><line x1={pad} x2={width - pad} y1={y(max * i / 4)} y2={y(max * i / 4)} stroke="#1e293b" /><text x={pad - 8} y={y(max * i / 4) + 4} textAnchor="end" fill="#64748b" fontSize="11">{new Intl.NumberFormat(locale, { notation: 'compact' }).format(max * i / 4)}</text></g>)}
      <path d={`${path('value')} L${x(points.at(-1)!.date)},${height - pad} L${x(points[0].date)},${height - pad} Z`} fill="url(#chart-fill)" />
      <path d={path('spent')} fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="5 5" />
      <path d={path('value')} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" />
      <line x1={x(selected.date)} x2={x(selected.date)} y1={20} y2={height - pad} stroke="#475569" strokeDasharray="3 4" />
      <circle cx={x(selected.date)} cy={y(selected.value)} r="5" fill={color} />
      <text x={pad} y={height - 15} fill="#64748b" fontSize="12">{points[0].date}</text><text x={width - pad} y={height - 15} textAnchor="end" fill="#64748b" fontSize="12">{points.at(-1)!.date}</text>
    </svg>
    <label className="sr-only" htmlFor="chart-date">Explore chart date</label><input id="chart-date" type="range" min={0} max={points.length - 1} value={index ?? points.length - 1} onChange={e => setIndex(Number(e.target.value))} className="w-full accent-emerald-400" />
  </div>
}
