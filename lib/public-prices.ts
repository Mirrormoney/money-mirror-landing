import { cleanPrices, type PricePoint } from './portfolio.ts'
export type PublicHistory = { symbol: string; currency: string; points: PricePoint[]; adjusted: boolean }
type Chart = { meta?: { symbol?: string; currency?: string; exchangeTimezoneName?: string }; timestamp?: number[]; indicators?: { quote?: { close?: (number | null)[] }[]; adjclose?: { adjclose?: (number | null)[] }[] } }
export function parseChart(chart: Chart, expectedSymbol: string, before: string): PublicHistory {
  if (chart.meta?.symbol?.toUpperCase() !== expectedSymbol.toUpperCase()) throw new Error('Unexpected instrument returned by provider')
  const currency = chart.meta?.currency
  if (!currency || !/^[A-Za-z]{3}$/.test(currency)) throw new Error('No supported currency provided')
  const dates = new Intl.DateTimeFormat('en-CA', { timeZone: chart.meta?.exchangeTimezoneName ?? 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' })
  const adjusted = chart.indicators?.adjclose?.[0]?.adjclose
  const closes = adjusted ?? chart.indicators?.quote?.[0]?.close
  if (!closes || !chart.timestamp?.length) throw new Error('No historical prices returned')
  const points: PricePoint[] = []
  for (let i = 0; i < chart.timestamp.length; i++) {
    const price = closes[i]
    // Missing candles are omitted, never replaced with zero or invented returns.
    if (price == null) continue
    if (!Number.isFinite(price) || price <= 0) throw new Error('Invalid historical price')
    const parts = dates.formatToParts(new Date(chart.timestamp[i] * 1000))
    const part = (type: string) => parts.find(p => p.type === type)?.value
    const date = `${part('year')}-${part('month')}-${part('day')}`
    if (date < before) points.push({ date, price })
  }
  if (!points.length) throw new Error('No completed daily prices returned')
  return { symbol: expectedSymbol, currency, points: cleanPrices(points), adjusted: !!adjusted }
}
export function validSymbol(symbol: string) { return /^[A-Za-z0-9^][A-Za-z0-9.^=_-]{0,39}$/.test(symbol) }
