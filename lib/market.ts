import { prisma } from './prisma'
import { ApiError, limit } from './http'
import { cleanPrices, pricesInEuro } from './portfolio'
import { FREE_BENCHMARKS, type Benchmark } from './benchmarks'
import { parseChart, validSymbol, type PublicHistory } from './public-prices'
import type { Prisma } from '@prisma/client'
const DAY = 86400000
const today = () => new Date().toISOString().slice(0, 10)
type Loaded = PublicHistory & { fetchedAt: string; fallback: boolean }
const pending = new Map<string, Promise<Loaded>>()
async function json(url: URL) {
  // A shared ceiling stops requests; no paid service or automatic upgrade exists.
  await limit('public-market:daily', 500, 86400)
  let response: Response
  try { response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(12000) }) }
  catch { throw new ApiError('The free data source is temporarily unavailable. Please try again later.', 503) }
  if (!response.ok) throw new ApiError(response.status === 429 ? 'The free data source is busy. Please try again later.' : 'No usable history for this instrument. Try a different listing.', 503)
  return response.json()
}
async function chart(symbol: string) {
  if (!validSymbol(symbol)) throw new ApiError('Invalid instrument.')
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`)
  url.search = new URLSearchParams({ period1: '915148800', period2: String(Math.floor(Date.now() / 1000)), interval: '1d', events: 'history', includeAdjustedClose: 'true' }).toString()
  const data = await json(url)
  try { return parseChart(data.chart?.result?.[0] ?? {}, symbol, today()) }
  catch (error) { throw new ApiError(error instanceof Error ? error.message : 'No usable price history.', 422) }
}
async function cachedHistory(key: string, fetcher: () => Promise<PublicHistory>): Promise<Loaded> {
  const active = pending.get(key)
  if (active) return active
  const promise = (async () => {
    const cache = await prisma.marketCache.findUnique({ where: { key } })
    const data = cache?.data as unknown as PublicHistory | undefined
    const usable = data?.points?.length ? { ...data, points: cleanPrices(data.points), fetchedAt: cache!.fetchedAt.toISOString(), fallback: false } : null
    if (usable && cache!.fetchedAt.toISOString().slice(0, 10) === today()) return usable
    try {
      // Persisted cooldown prevents repeated outage calls across server instances.
      await limit(`market-refresh:${key}`, 1, 900)
      const result = await fetcher()
      const at = new Date()
      await prisma.marketCache.upsert({ where: { key }, create: { key, data: result as unknown as Prisma.InputJsonValue, fetchedAt: at }, update: { data: result as unknown as Prisma.InputJsonValue, fetchedAt: at } })
      return { ...result, fetchedAt: at.toISOString(), fallback: false }
    } catch (error) {
      if (usable && Date.now() - cache!.fetchedAt.getTime() <= 7 * DAY) return { ...usable, fallback: true }
      throw error
    }
  })()
  pending.set(key, promise)
  try { return await promise } finally { pending.delete(key) }
}
function symbolFor(instrument: Benchmark) {
  const fixed = FREE_BENCHMARKS.find(b => b.id === instrument.id)
  if (fixed?.symbol) return fixed.symbol
  if (instrument.id.startsWith('yahoo:')) return instrument.id.slice(6)
  if (/^[A-Z0-9.-]+\.US$/.test(instrument.id)) return instrument.id.slice(0, -3)
  throw new ApiError('Please remove this old listing and add it again using search.', 422)
}
export async function euroHistory(instrument: Benchmark) {
  const symbol = symbolFor(instrument)
  const data = await cachedHistory(`public-v1:${symbol}`, () => chart(symbol))
  const currency = data.currency === 'GBp' || data.currency === 'GBX' ? 'GBP' : data.currency.toUpperCase()
  if (currency === 'EUR') return { ...data, source: 'Yahoo Finance', sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/history/` }
  const fx = await cachedHistory(`fx-v1:${currency}`, async () => {
    const url = new URL(`https://api.frankfurter.dev/v1/1999-01-04..${today()}`)
    url.search = new URLSearchParams({ base: 'EUR', symbols: currency }).toString()
    const result = await json(url)
    const points = cleanPrices(Object.entries(result.rates ?? {}).map(([date, rates]) => ({ date, price: Number((rates as Record<string, unknown>)[currency]) }))).filter(p => p.date < today())
    if (!points.length) throw new ApiError('Historical euro conversion is unavailable for this currency.', 422)
    return { symbol: `EUR/${currency}`, currency, points, adjusted: false }
  })
  // Earlier spending fails explicitly; never invent exchange rates before their history.
  const available = data.points.filter(p => p.date >= fx.points[0].date)
  const points = pricesInEuro(available, fx.points, data.currency === 'GBp' || data.currency === 'GBX' ? 0.01 : 1)
  return { ...data, points, fallback: data.fallback || fx.fallback, fetchedAt: data.fetchedAt < fx.fetchedAt ? data.fetchedAt : fx.fetchedAt, source: 'Yahoo Finance · FX: Frankfurter / ECB', sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/history/` }
}
export async function searchInstruments(query: string): Promise<Benchmark[]> {
  const key = `public-search:${query.toUpperCase()}`
  const cached = await prisma.marketCache.findUnique({ where: { key } })
  if (cached && Date.now() - cached.fetchedAt.getTime() < DAY) return cached.data as unknown as Benchmark[]
  const url = new URL('https://query1.finance.yahoo.com/v1/finance/search')
  url.search = new URLSearchParams({ q: query, quotesCount: '6', newsCount: '0', enableFuzzyQuery: 'false' }).toString()
  const data = await json(url)
  const candidates = (Array.isArray(data.quotes) ? data.quotes : []).filter((p: Record<string, unknown>) => typeof p.symbol === 'string' && validSymbol(p.symbol) && ['ETF', 'EQUITY', 'MUTUALFUND', 'INDEX', 'CRYPTOCURRENCY'].includes(String(p.quoteType)))
  const results: Benchmark[] = []
  for (const p of candidates.slice(0, 4)) {
    try {
      const history = await cachedHistory(`public-v1:${p.symbol}`, () => chart(p.symbol))
      const item = { id: `yahoo:${p.symbol}`, name: String(p.longname ?? p.shortname ?? p.symbol), currency: history.currency, exchange: String(p.exchDisp ?? p.exchange ?? ''), type: String(p.quoteType), isin: null }
      await prisma.instrument.upsert({ where: { id: item.id }, create: item, update: item })
      results.push(item)
    } catch (error) { if (!(error instanceof ApiError)) throw error }
  }
  if (candidates.length && !results.length) throw new ApiError('Matching listings have no usable history right now. Try their exchange ticker or retry later.', 503)
  await prisma.marketCache.upsert({ where: { key }, create: { key, data: results as unknown as Prisma.InputJsonValue }, update: { data: results as unknown as Prisma.InputJsonValue, fetchedAt: new Date() } })
  return results
}
