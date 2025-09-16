'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import * as pricing from '../../lib/pricing';
import { loadImportState, saveImportState, clearImportState } from '../../lib/importStorage';

type Scenario = 'sp500' | 'msci' | 'btc';

type Tx = {
  date: string;        // YYYY-MM-DD
  description: string; // free text
  amount: number;      // positive EUR
};

type RowWithCalc = Tx & { multiplier: number; whatIf: number };

const SCENARIOS: { key: Scenario; label: string }[] = [
  { key: 'sp500', label: 'S&P 500' },
  { key: 'msci', label: 'MSCI World' },
  { key: 'btc', label: 'Bitcoin' },
];

function parseCsv(text: string): Tx[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows: Tx[] = [];
  const headerLike = lines[0]?.toLowerCase().includes('date');
  for (let i = headerLike ? 1 : 0; i < lines.length; i++) {
    const parts = lines[i].split(',').map(s => s.trim());
    if (parts.length < 3) continue;
    const [date, description, amountStr] = parts;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const amount = Number(amountStr.replace(',', '.'));
    if (!isFinite(amount)) continue;
    rows.push({ date, description, amount });
  }
  return rows;
}

function daysBetween(a: string, b: string) {
  const d1 = new Date(a + 'T00:00:00Z').getTime();
  const d2 = new Date(b + 'T00:00:00Z').getTime();
  const MS_PER_DAY = 86_400_000;
  return Math.max(0, Math.round((d2 - d1) / MS_PER_DAY));
}

function fallbackMultiplier(fromDate: string, toDate: string, scenario: Scenario): number {
  const days = daysBetween(fromDate, toDate);
  const years = days / 365.25;
  const rate = scenario === 'sp500' ? 0.08 : scenario === 'msci' ? 0.07 : 0.20;
  return Math.pow(1 + rate, Math.max(0, years));
}

// Best-effort call into lib/pricing if available, else fallback
function baseMultiplier(fromDate: string, toDate: string, scenario: Scenario): number {
  const anyPricing: any = pricing;
  try {
    if (anyPricing && typeof anyPricing.getMultiplier === 'function') {
      return Number(anyPricing.getMultiplier(scenario, fromDate, toDate)) || 1;
    }
    if (anyPricing && typeof anyPricing.multiplier === 'function') {
      return Number(anyPricing.multiplier(scenario, fromDate, toDate)) || 1;
    }
  } catch {}
  return fallbackMultiplier(fromDate, toDate, scenario);
}

function formatEUR(x: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(x);
}

function downloadCsv(filename: string, rows: RowWithCalc[]) {
  const header = 'date,description,amount,multiplier,what_if';
  const body = rows.map(r => [r.date, r.description.replace(/,/g, ' '), r.amount, r.multiplier.toFixed(6), r.whatIf.toFixed(2)].join(',')).join('\n');
  const csv = header + '\n' + body;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TryPage() {
  const [rows, setRows] = useState<Tx[]>([]);
  const [scenario, setScenario] = useState<Scenario>('sp500');
  const [asOf, setAsOf] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [growthFactor, setGrowthFactor] = useState<number>(1); // 1.0x baseline (matches "demo" growth slider idea)

  // Restore previous session
  useEffect(() => {
    const saved = loadImportState();
    if (saved.items?.length) setRows(saved.items);
    if (saved.scenario) setScenario(saved.scenario as Scenario);
    if (saved.asOf) setAsOf(saved.asOf);
  }, []);

  // Persist on change
  useEffect(() => {
    saveImportState({ items: rows, scenario, asOf });
  }, [rows, scenario, asOf]);

  const computed: RowWithCalc[] = useMemo(() => {
    return rows.map((r) => {
      const m = baseMultiplier(r.date, asOf, scenario) * growthFactor;
      return { ...r, multiplier: m, whatIf: r.amount * m };
    });
  }, [rows, asOf, scenario, growthFactor]);

  const totals = useMemo(() => {
    const spent = rows.reduce((s, r) => s + r.amount, 0);
    const hypothetical = computed.reduce((s, r) => s + r.whatIf, 0);
    const gain = hypothetical - spent;
    return { spent, hypothetical, gain };
  }, [rows, computed]);

  const sortedForChart = useMemo(() => {
    return [...computed].sort((a, b) => a.date.localeCompare(b.date));
  }, [computed]);

  const chartPoints = useMemo(() => {
    const width = 600, height = 160, padding = 24;
    if (!sortedForChart.length) return { width, height, padding, path: '' };
    const cum: number[] = [];
    let c = 0;
    for (const r of sortedForChart) {
      c += r.whatIf;
      cum.push(c);
    }
    const maxY = Math.max(...cum) || 1;
    const stepX = (width - 2 * padding) / Math.max(1, cum.length - 1);
    const coords = cum.map((y, i) => {
      const x = padding + i * stepX;
      const yPx = height - padding - (y / maxY) * (height - 2 * padding);
      return `${x},${yPx}`;
    });
    return { width, height, padding, path: 'M ' + coords.join(' L ') };
  }, [sortedForChart]);

  const onUploadCsv = async (file: File) => {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length) setRows(prev => [...prev, ...parsed]);
  };

  const [manualDate, setManualDate] = useState<string>('');
  const [manualDesc, setManualDesc] = useState<string>('');
  const [manualAmount, setManualAmount] = useState<string>('');

  const addManual = () => {
    if (!manualDate || !/^\d{4}-\d{2}-\d{2}$/.test(manualDate)) return;
    const amount = Number(manualAmount.replace(',', '.'));
    if (!isFinite(amount) || amount <= 0) return;
    setRows(prev => [...prev, { date: manualDate, description: manualDesc || 'Manual', amount }]);
    setManualDate(''); setManualDesc(''); setManualAmount('');
  };

  const deleteAll = () => {
    setRows([]);
    clearImportState();
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Try me</h1>
          <p className="text-gray-600 mt-1">Import your transactions, then tweak the growth slider below. The demo instantly reflects <em>your</em> data.</p>
        </header>

        {/* TOP: IMPORT SECTION (substance of /import) */}
        <section className="mb-10 rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">1) Your data</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-gray-700">Scenario</span>
              <select
                className="rounded-lg border px-3 py-2"
                value={scenario}
                onChange={(e) => setScenario(e.target.value as Scenario)}
              >
                {SCENARIOS.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-gray-700">As of date</span>
              <input
                type="date"
                className="rounded-lg border px-3 py-2"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-gray-700">Upload CSV</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => e.target.files && onUploadCsv(e.target.files[0])}
                className="rounded-lg border px-3 py-2"
              />
              <span className="text-xs text-gray-500">Format: date,description,amount — dates YYYY-MM-DD; amounts positive €</span>
            </label>
          </div>

          {/* Manual add */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="rounded-lg border px-3 py-2"
              placeholder="YYYY-MM-DD"
            />
            <input
              type="text"
              value={manualDesc}
              onChange={(e) => setManualDesc(e.target.value)}
              className="rounded-lg border px-3 py-2"
              placeholder="Description"
            />
            <input
              type="number"
              step="0.01"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              className="rounded-lg border px-3 py-2"
              placeholder="Amount (€)"
            />
            <button onClick={addManual} className="rounded-lg bg-black text-white px-4 py-2 font-medium hover:opacity-90">Add row</button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Multiplier</th>
                  <th className="py-2 pr-4">What‑if</th>
                </tr>
              </thead>
              <tbody>
                {computed.map((r, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4 font-mono">{r.date}</td>
                    <td className="py-2 pr-4">{r.description}</td>
                    <td className="py-2 pr-4 font-mono">{formatEUR(r.amount)}</td>
                    <td className="py-2 pr-4 font-mono">{r.multiplier.toFixed(4)}×</td>
                    <td className="py-2 pr-4 font-mono">{formatEUR(r.whatIf)}</td>
                  </tr>
                ))}
                {!computed.length && (
                  <tr>
                    <td className="py-6 text-gray-500" colSpan={5}>No rows yet — upload a CSV or add a row above.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals + actions */}
          <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="text-sm">
              <div><span className="text-gray-600">Total spent:</span> <strong>{formatEUR(totals.spent)}</strong></div>
              <div><span className="text-gray-600">Hypothetical:</span> <strong>{formatEUR(totals.hypothetical)}</strong></div>
              <div><span className="text-gray-600">Gain:</span> <strong className={totals.gain >= 0 ? 'text-emerald-600' : 'text-red-600'}>{formatEUR(totals.gain)}</strong></div>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-lg border px-4 py-2"
                onClick={() => deleteAll()}
              >
                Delete all
              </button>
              <button
                className="rounded-lg bg-black text-white px-4 py-2 font-medium hover:opacity-90"
                onClick={() => downloadCsv('mirror-money-results.csv', computed)}
                disabled={!computed.length}
              >
                Download CSV
              </button>
            </div>
          </div>

          {/* Mini chart */}
          <div className="mt-6 rounded-xl bg-gray-50 p-3">
            <svg width={chartPoints.width} height={chartPoints.height} role="img" aria-label="Cumulative hypothetical value chart">
              <rect x="0" y="0" width={chartPoints.width} height={chartPoints.height} fill="white" />
              {chartPoints.path && <path d={chartPoints.path} fill="none" stroke="black" strokeWidth="2" />}
            </svg>
          </div>
        </section>

        {/* BOTTOM: DEMO SECTION (substance of /demo), connected via growthFactor */}
        <section className="rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">2) Adjust growth factor</h2>
          <p className="text-gray-600 mb-3">This mirrors the “Try a demo” slider, but now it’s applied to the data you entered above.</p>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.01}
              value={growthFactor}
              onChange={(e) => setGrowthFactor(Number(e.target.value))}
              className="w-full md:w-96"
            />
            <div className="text-sm">
              <div><span className="text-gray-600">Growth factor:</span> <strong>{growthFactor.toFixed(2)}×</strong></div>
              <div><span className="text-gray-600">Adjusted hypothetical:</span> <strong>{formatEUR(totals.hypothetical)}</strong></div>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Tip: Set factor to 1.00× to see the base model; drag left/right to explore pessimistic/optimistic scenarios.
          </div>
        </section>

        {/* Footer helper */}
        <div className="mt-10 text-sm text-gray-500">
          Want to start over? <Link className="underline" href="/try">Reload Try me</Link>.
        </div>
      </div>
    </main>
  );
}
