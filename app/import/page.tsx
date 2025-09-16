'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as pricing from '../../lib/pricing';
import { loadImportState, saveImportState, clearImportState, type Tx, type Scenario } from '../../lib/importStorage';
import * as I18N from '../../lib/i18n';

type RowWithCalc = Tx & { multiplier: number; whatIf: number };

const DICT = {
  en: {
    import_adjust_title: 'Import & Adjust',
    import_adjust_desc: 'Import your transactions, then use the growth slider below. The slider applies directly to the data you entered above.',
    your_data: '1) Your data',
    scenario_label: 'Scenario',
    scenario_sp500: 'S&P 500',
    scenario_msci: 'MSCI World',
    scenario_btc: 'Bitcoin',
    as_of_date: 'As of date',
    upload_csv: 'Upload CSV',
    upload_hint: 'Format: date,description,amount — dates YYYY-MM-DD; amounts positive €',
    placeholder_date: 'YYYY-MM-DD',
    placeholder_desc: 'Description',
    placeholder_amount: 'Amount (€)',
    add_row: 'Add row',
    table_date: 'Date',
    table_description: 'Description',
    table_amount: 'Amount',
    table_multiplier: 'Multiplier',
    table_what_if: 'What‑if',
    no_rows_yet: 'No rows yet — upload a CSV or add a row above.',
    totals_spent: 'Total spent:',
    totals_hypothetical: 'Hypothetical:',
    gain: 'Gain:',
    delete_all: 'Delete all',
    download_csv: 'Download CSV',
    chart_aria: 'Portfolio value over time',
    adjust_growth_title: '2) Adjust growth factor',
    adjust_growth_desc: 'Scale the model up/down to explore pessimistic/optimistic outcomes.',
    growth_factor: 'Growth factor:',
    adjusted_hypothetical: 'Adjusted hypothetical:',
    tip_base_drag: 'Tip: Set factor to 1.00× to see the base model; drag left/right to explore pessimistic/optimistic scenarios.',
    chart_base_title: 'Portfolio value (base)',
    chart_adjusted_title: 'Portfolio value (adjusted)',
    axis_x_date: 'Date',
    axis_y_value: 'Value (€)',
  },
  de: {
    import_adjust_title: 'Importieren & Anpassen',
    import_adjust_desc: 'Importiere deine Transaktionen und nutze unten den Wachstums‑Regler. Der Regler wirkt direkt auf die oben eingegebenen Daten.',
    your_data: '1) Deine Daten',
    scenario_label: 'Szenario',
    scenario_sp500: 'S&P 500',
    scenario_msci: 'MSCI World',
    scenario_btc: 'Bitcoin',
    as_of_date: 'Stichtag',
    upload_csv: 'CSV hochladen',
    upload_hint: 'Format: datum,beschreibung,betrag — Datum YYYY-MM-DD; Beträge positiv in €',
    placeholder_date: 'JJJJ-MM-TT',
    placeholder_desc: 'Beschreibung',
    placeholder_amount: 'Betrag (€)',
    add_row: 'Zeile hinzufügen',
    table_date: 'Datum',
    table_description: 'Beschreibung',
    table_amount: 'Betrag',
    table_multiplier: 'Multiplikator',
    table_what_if: 'Was‑wäre‑wenn',
    no_rows_yet: 'Noch keine Zeilen — CSV hochladen oder oben eine Zeile hinzufügen.',
    totals_spent: 'Summe ausgegeben:',
    totals_hypothetical: 'Hypothetisch:',
    gain: 'Gewinn:',
    delete_all: 'Alles löschen',
    download_csv: 'CSV herunterladen',
    chart_aria: 'Portfoliowert über die Zeit',
    adjust_growth_title: '2) Wachstumsfaktor anpassen',
    adjust_growth_desc: 'Modell nach oben/unten skalieren für pessimistische/optimistische Szenarien.',
    growth_factor: 'Wachstumsfaktor:',
    adjusted_hypothetical: 'Angepasst hypothetisch:',
    tip_base_drag: 'Tipp: 1,00× zeigt das Basismodell; links/rechts ziehen für pessimistische/optimistische Szenarien.',
    chart_base_title: 'Portfoliowert (Basis)',
    chart_adjusted_title: 'Portfoliowert (angepasst)',
    axis_x_date: 'Datum',
    axis_y_value: 'Wert (€)',
  }
} as const;

function useLocalI18n() {
  const getLang = (): 'en' | 'de' => {
    if (typeof window === 'undefined') return 'en';
    const v = (localStorage.getItem('lang') || 'en').toLowerCase();
    return v === 'de' ? 'de' : 'en';
  };
  const [lang, setLang] = React.useState<'en' | 'de'>(getLang);

  React.useEffect(() => {
    let prev = getLang();
    const update = () => {
      const next = getLang();
      if (next !== prev) {
        prev = next;
        setLang(next);
      }
    };
    const onStorage = (e: StorageEvent) => { if (e.key === 'lang') update(); };
    const onCustom = () => update();
    const onClick = () => setTimeout(update, 0);
    const onKey = () => setTimeout(update, 0);
    const onFocus = () => update();
    const onVisibility = () => { if (!document.hidden) update(); };

    const mo = new MutationObserver(() => update());
    if (document?.documentElement) {
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }

    window.addEventListener('storage', onStorage);
    window.addEventListener('mm:lang', onCustom as any);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('mm:lang', onCustom as any);
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      mo.disconnect();
    };
  }, []);

  const t = (key: keyof typeof DICT['en']) => (DICT[lang] as any)[key] ?? (DICT.en as any)[key] ?? String(key);
  return { t, lang };
}

const useI18n: () => { t: (k: string) => string; lang: 'en' | 'de' } =
  (I18N as any).useI18n || (useLocalI18n as any);

// ---------- Chart utilities (portfolio timeline with shared domain) ----------
type ChartGeom = {
  widthUnits: number; height: number;
  path: string; area: string | null; points: Array<[number, number]>;
  xTicks: Array<{ x: number; label: string }>; yTicks: Array<{ y: number; label: string; raw: number }>;
  axes: { x1: number; y1: number; x2: number; y2: number; x0: number; y0: number };
};

function makeXTicks(labels: string[], count = 5) {
  if (labels.length === 0) return [];
  const idxs = new Set<number>([0, labels.length - 1]);
  for (let i = 1; i < count - 1; i++) {
    idxs.add(Math.round((i * (labels.length - 1)) / (count - 1)));
  }
  return Array.from(idxs).sort((a, b) => a - b);
}

function makeYTicks(yMin: number, yMax: number, count = 4) {
  const ticks: number[] = [];
  for (let i = 0; i <= count; i++) {
    ticks.push(yMin + (i * (yMax - yMin)) / count);
  }
  return ticks;
}

function chartGeometry(values: number[], labels: string[], yMin: number, yMax: number, widthUnits = 1000, height = 220, padLeft = 56, padBottom = 36, padTop = 8, padRight = 8): ChartGeom {
  if (!values.length || !isFinite(yMax) || yMax <= yMin) {
    return { widthUnits, height, path: '', area: null, points: [], xTicks: [], yTicks: [], axes: { x1: padLeft, y1: height - padBottom, x2: widthUnits - padRight, y2: height - padBottom, x0: padLeft, y0: padTop } };
  }
  const innerW = widthUnits - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const stepX = innerW / Math.max(1, values.length - 1);
  const pts: Array<[number, number]> = values.map((val, i) => {
    const x = padLeft + i * stepX;
    const ratio = (val - yMin) / (yMax - yMin);
    const yPx = padTop + innerH - Math.max(0, Math.min(ratio, 1)) * innerH;
    return [x, yPx];
  });

  let path = 'M ' + pts.map(([x, y]) => `${x},${y}`).join(' L ');
  if (pts.length === 1) {
    const [x, y] = pts[0];
    path = `M ${x-0.01},${y} L ${x+0.01},${y}`;
  }

  const area = `M ${padLeft},${padTop + innerH} L ` + pts.map(([x, y]) => `${x},${y}`).join(' L ') + ` L ${padLeft + innerW},${padTop + innerH} Z`;

  const xi = makeXTicks(labels, 5);
  const xTicks = xi.map(i => ({ x: padLeft + i * stepX, label: labels[i] || '' }));

  const yi = makeYTicks(yMin, yMax, 4);
  const yTicks = yi.map(val => {
    const ratio = (val - yMin) / (yMax - yMin);
    const y = padTop + innerH - ratio * innerH;
    return { y, label: formatEUR(val), raw: val };
  });

  const axes = { x1: padLeft, y1: padTop + innerH, x2: padLeft + innerW, y2: padTop + innerH, x0: padLeft, y0: padTop };

  return { widthUnits, height, path, area, points: pts, xTicks, yTicks, axes };
}

function formatEUR(x: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(x);
}

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
  const rate = scenario === 'sp500' ? 0.08 : 'msci' ? 0.07 : 0.20;
  return Math.pow(1 + rate, Math.max(0, years));
}

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

// Portfolio value timeline: sum of each cashflow grown from its date up to evaluation date
function computePortfolioSeries(rows: Tx[], scenario: Scenario, asOf: string, growthFactor: number) {
  if (!rows.length) return { values: [] as number[], labels: [] as string[] };
  const datesSet = new Set<string>(rows.map(r => r.date));
  datesSet.add(asOf);
  const dates = Array.from(datesSet).sort((a, b) => a.localeCompare(b));
  const values: number[] = [];
  for (const t of dates) {
    let sum = 0;
    for (const r of rows) {
      if (t >= r.date) {
        sum += r.amount * baseMultiplier(r.date, t, scenario) * growthFactor;
      }
    }
    values.push(sum);
  }
  return { values, labels: dates };
}

export default function ImportPage() {
  const { t } = useI18n();

  const [rows, setRows] = useState<Tx[]>([]);
  const [scenario, setScenario] = useState<Scenario>('sp500');
  const [asOf, setAsOf] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [growthFactor, setGrowthFactor] = useState<number>(1);

  useEffect(() => {
    const saved = loadImportState();
    if (saved.items?.length) setRows(saved.items);
    if (saved.scenario) setScenario(saved.scenario as Scenario);
    if (saved.asOf) setAsOf(saved.asOf);
  }, []);

  useEffect(() => {
    saveImportState({ items: rows, scenario, asOf });
  }, [rows, scenario, asOf]);

  const baseComputed: RowWithCalc[] = useMemo(() => {
    return rows.map((r) => {
      const m = baseMultiplier(r.date, asOf, scenario);
      return { ...r, multiplier: m, whatIf: r.amount * m };
    });
  }, [rows, asOf, scenario]);

  const totals = useMemo(() => {
    const spent = rows.reduce((s, r) => s + r.amount, 0);
    const hypothetical = baseComputed.reduce((s, r) => s + r.whatIf, 0);
    const gain = hypothetical - spent;
    return { spent, hypothetical, gain };
  }, [rows, baseComputed]);

  const baseTimeline = useMemo(() => computePortfolioSeries(rows, scenario, asOf, 1), [rows, scenario, asOf]);
  const adjustedTimeline = useMemo(() => computePortfolioSeries(rows, scenario, asOf, growthFactor), [rows, scenario, asOf, growthFactor]);

  const allValues: number[] = [...baseTimeline.values, ...adjustedTimeline.values];
  const yMin = allValues.length ? Math.min(...allValues) : 0;
  const yMax = allValues.length ? Math.max(...allValues) : 1;

  const baseChart = useMemo(() => chartGeometry(baseTimeline.values, baseTimeline.labels, yMin, yMax), [baseTimeline, yMin, yMax]);
  const adjustedChart = useMemo(() => chartGeometry(adjustedTimeline.values, adjustedTimeline.labels, yMin, yMax), [adjustedTimeline, yMin, yMax]);

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

  const lastAdjusted = adjustedTimeline.values.length
    ? adjustedTimeline.values[adjustedTimeline.values.length - 1]
    : 0;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">{t('import_adjust_title')}</h1>
          <p className="text-gray-600 mt-1">{t('import_adjust_desc')}</p>
        </header>

        {/* TOP: IMPORT SECTION */}
        <section className="mb-10 rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{t('your_data')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-gray-700">{t('scenario_label')}</span>
              <select
                className="rounded-lg border px-3 py-2 text-black bg-white"
                value={scenario}
                onChange={(e) => setScenario(e.target.value as Scenario)}
              >
                <option value="sp500">{t('scenario_sp500')}</option>
                <option value="msci">{t('scenario_msci')}</option>
                <option value="btc">{t('scenario_btc')}</option>
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-gray-700">{t('as_of_date')}</span>
              <input
                type="date"
                className="rounded-lg border px-3 py-2 text-black bg-white placeholder:text-gray-700"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-gray-700">{t('upload_csv')}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => e.target.files && onUploadCsv(e.target.files[0])}
                className="rounded-lg border px-3 py-2 text-black bg-white"
              />
              <span className="text-xs text-gray-500">{t('upload_hint')}</span>
            </label>
          </div>

          {/* Manual add */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="rounded-lg border px-3 py-2 text-black bg-white placeholder:text-gray-700"
              placeholder={t('placeholder_date')}
            />
            <input
              type="text"
              value={manualDesc}
              onChange={(e) => setManualDesc(e.target.value)}
              className="rounded-lg border px-3 py-2 text-black bg-white placeholder:text-gray-700"
              placeholder={t('placeholder_desc')}
            />
            <input
              type="number"
              step="0.01"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              className="rounded-lg border px-3 py-2 text-black bg-white placeholder:text-gray-700"
              placeholder={t('placeholder_amount')}
            />
            <button type="button" onClick={addManual} className="rounded-lg bg-black text-white px-4 py-2 font-medium hover:opacity-90">{t('add_row')}</button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">{t('table_date')}</th>
                  <th className="py-2 pr-4">{t('table_description')}</th>
                  <th className="py-2 pr-4">{t('table_amount')}</th>
                  <th className="py-2 pr-4">{t('table_multiplier')}</th>
                  <th className="py-2 pr-4">{t('table_what_if')}</th>
                </tr>
              </thead>
              <tbody>
                {baseComputed.map((r, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4 font-mono">{r.date}</td>
                    <td className="py-2 pr-4">{r.description}</td>
                    <td className="py-2 pr-4 font-mono">{formatEUR(r.amount)}</td>
                    <td className="py-2 pr-4 font-mono">{r.multiplier.toFixed(4)}×</td>
                    <td className="py-2 pr-4 font-mono">{formatEUR(r.whatIf)}</td>
                  </tr>
                ))}
                {!baseComputed.length && (
                  <tr>
                    <td className="py-6 text-gray-500" colSpan={5}>{t('no_rows_yet')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals + actions */}
          <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="text-sm">
              <div><span className="text-gray-600">{t('totals_spent')}</span> <strong>{formatEUR(totals.spent)}</strong></div>
              <div><span className="text-gray-600">{t('totals_hypothetical')}</span> <strong>{formatEUR(totals.hypothetical)}</strong></div>
              <div><span className="text-gray-600">{t('gain')}</span> <strong className={totals.gain >= 0 ? 'text-emerald-600' : 'text-red-600'}>{formatEUR(totals.gain)}</strong></div>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-lg border px-4 py-2"
                onClick={() => deleteAll()}
              >
                {t('delete_all')}
              </button>
              <button
                className="rounded-lg bg-black text-white px-4 py-2 font-medium hover:opacity-90"
                onClick={() => downloadCsv('mirror-money-results.csv', baseComputed)}
                disabled={!baseComputed.length}
              >
                {t('download_csv')}
              </button>
            </div>
          </div>

          {/* Base chart */}
          <div className="mt-6">
            <div className="rounded-2xl border p-4">
              <div className="text-sm font-medium mb-2">{t('chart_base_title')}</div>
              <svg
                viewBox={`0 0 ${baseChart.widthUnits} ${baseChart.height}`}
                preserveAspectRatio="none"
                className="w-full h-48 text-teal-600"
                role="img"
                aria-label={t('chart_aria')}
              >
                <path d={`M ${baseChart.axes.x1},${baseChart.axes.y1} L ${baseChart.axes.x2},${baseChart.axes.y2}`} stroke="currentColor" strokeWidth="1" opacity="0.4" />
                <path d={`M ${baseChart.axes.x0},${baseChart.axes.y0} L ${baseChart.axes.x0},${baseChart.axes.y1}`} stroke="currentColor" strokeWidth="1" opacity="0.4" />
                {baseChart.xTicks.map((tck, i) => (
                  <g key={i}>
                    <line x1={tck.x} y1={baseChart.axes.y1} x2={tck.x} y2={baseChart.axes.y1 + 6} stroke="currentColor" opacity="0.4" />
                    <text x={tck.x} y={baseChart.axes.y1 + 18} fontSize="10" textAnchor="middle" fill="currentColor">{tck.label}</text>
                  </g>
                ))}
                {baseChart.yTicks.map((tck, i) => (
                  <g key={i}>
                    <line x1={baseChart.axes.x0 - 6} y1={tck.y} x2={baseChart.axes.x0} y2={tck.y} stroke="currentColor" opacity="0.4" />
                    <text x={baseChart.axes.x0 - 8} y={tck.y + 3} fontSize="10" textAnchor="end" fill="currentColor">{tck.label}</text>
                  </g>
                ))}
                {baseChart.area && <path d={baseChart.area} fill="currentColor" fillOpacity="0.08" />}
                {baseChart.path && <path d={baseChart.path} fill="none" stroke="currentColor" strokeWidth="2" />}
                <text x={(baseChart.axes.x1 + baseChart.axes.x2) / 2} y={baseChart.axes.y1 + 32} fontSize="11" textAnchor="middle" fill="currentColor">{t('axis_x_date')}</text>
                <text x={baseChart.axes.x0 - 36} y={(baseChart.axes.y0 + baseChart.axes.y1) / 2} fontSize="11" textAnchor="middle" fill="currentColor" transform={`rotate(-90 ${baseChart.axes.x0 - 36}, ${(baseChart.axes.y0 + baseChart.axes.y1) / 2})`}>{t('axis_y_value')}</text>
              </svg>
            </div>
          </div>
        </section>

        {/* BOTTOM: DEMO SECTION, connected via growthFactor */}
        <section className="rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{t('adjust_growth_title')}</h2>
          <p className="text-gray-600 mb-3">{t('adjust_growth_desc')}</p>

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
              <div><span className="text-gray-600">{t('growth_factor')}</span> <strong>{growthFactor.toFixed(2)}×</strong></div>
              <div><span className="text-gray-600">{t('adjusted_hypothetical')}</span> <strong>{formatEUR(lastAdjusted)}</strong></div>
            </div>
          </div>

          {/* Adjusted chart */}
          <div className="mt-6">
            <div className="rounded-2xl border p-4">
              <div className="text-sm font-medium mb-2">{t('chart_adjusted_title')}</div>
              <svg
                viewBox={`0 0 ${adjustedChart.widthUnits} ${adjustedChart.height}`}
                preserveAspectRatio="none"
                className="w-full h-48 text-teal-600"
                role="img"
                aria-label={t('chart_aria')}
              >
                <path d={`M ${adjustedChart.axes.x1},${adjustedChart.axes.y1} L ${adjustedChart.axes.x2},${adjustedChart.axes.y2}`} stroke="currentColor" strokeWidth="1" opacity="0.4" />
                <path d={`M ${adjustedChart.axes.x0},${adjustedChart.axes.y0} L ${adjustedChart.axes.x0},${adjustedChart.axes.y1}`} stroke="currentColor" strokeWidth="1" opacity="0.4" />
                {adjustedChart.xTicks.map((tck, i) => (
                  <g key={i}>
                    <line x1={tck.x} y1={adjustedChart.axes.y1} x2={tck.x} y2={adjustedChart.axes.y1 + 6} stroke="currentColor" opacity="0.4" />
                    <text x={tck.x} y={adjustedChart.axes.y1 + 18} fontSize="10" textAnchor="middle" fill="currentColor">{tck.label}</text>
                  </g>
                ))}
                {adjustedChart.yTicks.map((tck, i) => (
                  <g key={i}>
                    <line x1={adjustedChart.axes.x0 - 6} y1={tck.y} x2={adjustedChart.axes.x0} y2={tck.y} stroke="currentColor" opacity="0.4" />
                    <text x={adjustedChart.axes.x0 - 8} y={tck.y + 3} fontSize="10" textAnchor="end" fill="currentColor">{tck.label}</text>
                  </g>
                ))}
                {adjustedChart.area && <path d={adjustedChart.area} fill="currentColor" fillOpacity="0.08" />}
                {adjustedChart.path && <path d={adjustedChart.path} fill="none" stroke="currentColor" strokeWidth="2" />}
                <text x={(adjustedChart.axes.x1 + adjustedChart.axes.x2) / 2} y={adjustedChart.axes.y1 + 32} fontSize="11" textAnchor="middle" fill="currentColor">{t('axis_x_date')}</text>
                <text x={adjustedChart.axes.x0 - 36} y={(adjustedChart.axes.y0 + adjustedChart.axes.y1) / 2} fontSize="11" textAnchor="middle" fill="currentColor" transform={`rotate(-90 ${adjustedChart.axes.x0 - 36}, ${(adjustedChart.axes.y0 + adjustedChart.axes.y1) / 2})`}>{t('axis_y_value')}</text>
              </svg>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            {t('tip_base_drag')}
          </div>
        </section>
      </div>
    </main>
  );
}
