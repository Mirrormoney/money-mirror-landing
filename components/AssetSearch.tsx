'use client'
import React from 'react'

type Hit = {
  name?: string
  ticker?: string
  exchCode?: string
  micCode?: string
  securityType?: string
  shareClassFIGI?: string
  compositeFIGI?: string
  isin?: string
}

export default function AssetSearch(props: { onSelect: (hit: Hit) => void }) {
  const [q, setQ] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [results, setResults] = React.useState<Hit[]>([])

  const search = async () => {
    const qq = q.trim()
    if (!qq) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/mm/openfigi?q=${encodeURIComponent(qq)}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setResults(Array.isArray(json?.results) ? json.results : [])
    } catch (e: any) {
      setError(String(e?.message || e || 'Error'))
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') search()
  }

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search ISIN / Ticker / Name (OpenFIGI)"
          className="flex-1 rounded-lg border px-3 py-2 text-black bg-white placeholder:text-gray-600"
        />
        <button onClick={search} className="rounded-lg bg-black text-white px-4 py-2 font-medium hover:opacity-90">
          Search
        </button>
      </div>
      {loading && <div className="mt-3 text-sm text-gray-500">Searching…</div>}
      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      <div className="mt-3 divide-y rounded-lg border">
        {results.length === 0 && !loading && !error && (
          <div className="p-3 text-sm text-gray-500">No results yet.</div>
        )}
        {results.map((r, i) => (
          <div key={i} className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50">
            <div className="min-w-0">
              <div className="font-medium truncate">{r.name || '—'}</div>
              <div className="text-xs text-gray-600 truncate">
                {r.ticker ? `Ticker: ${r.ticker}` : ''}
                {r.exchCode ? `  · Exch: ${r.exchCode}` : ''}
                {r.micCode ? `  · MIC: ${r.micCode}` : ''}
                {r.securityType ? `  · Type: ${r.securityType}` : ''}
              </div>
              <div className="text-[11px] text-gray-500 truncate">
                {r.shareClassFIGI ? `shareFIGI: ${r.shareClassFIGI} ` : ''}
                {r.compositeFIGI ? `compFIGI: ${r.compositeFIGI}` : ''}
              </div>
            </div>
            <button
              onClick={() => props.onSelect(r)}
              className="shrink-0 rounded-md border px-3 py-1 text-sm hover:bg-gray-100"
            >
              Select
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Tip: For ISIN use uppercase (e.g., DE0007664039). Results are limited to top 12.
      </div>
    </div>
  )
}
