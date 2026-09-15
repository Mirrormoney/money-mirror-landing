import { prisma } from './prisma'
import { ApiError } from './http'
import { cleanPrices, pricesInEuro, type PricePoint } from './portfolio'
import type { Benchmark } from './benchmarks'
import type { Prisma } from '@prisma/client'

const pending = new Map<string, Promise<PricePoint[]>>()
const today = () => new Date().toISOString().slice(0, 10)
async function provider(path: string, params: Record<string, string> = {}) {
  const token = process.env.EODHD_API_KEY
  if (!token) throw new ApiError('Historical market data is being connected. Your spending is saved safely; comparisons will appear when data is available.', 503)
  const url = new URL(`https://eodhd.com/api/${path}`)
  url.search = new URLSearchParams({ ...params, api_token: token, fmt: 'json' }).toString()
  let response: Response
  try { response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) }) }
  catch { throw new ApiError('The market-data provider is temporarily unavailable. Please try again later.', 503) }
  if (!response.ok) throw new ApiError('Historical data is unavailable for this instrument or subscription. Please try another benchmark.', 503)
  return response.json()
}
export async function history(symbol: string): Promise<PricePoint[]> {
  if (!/^[A-Za-z0-9^_.-]{1,60}$/.test(symbol)) throw new ApiError('Invalid instrument.')
  const key = `eod:${symbol}`
  const active = pending.get(key)
  if (active) return active
  const promise = (async () => {
    const cached = await prisma.marketCache.findUnique({ where: { key } })
    if (cached && cached.fetchedAt.toISOString().slice(0, 10) === today()) return cleanPrices(cached.data as unknown as PricePoint[])
    // Fetch full history daily: adjusted prices can be restated after corporate actions.
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const data = await provider(`eod/${encodeURIComponent(symbol)}`, { from: '1970-01-01', to: yesterday, period: 'd', order: 'a' })
    if (!Array.isArray(data)) throw new ApiError('The provider returned no usable price history.', 503)
    const points = cleanPrices(data.map((p: Record<string, unknown>) => ({ date: String(p.date), price: Number(p.adjusted_close ?? p.close) }))).filter(p => p.date <= yesterday)
    if (!points.length) throw new ApiError('No price history is available for this instrument.', 422)
    await prisma.marketCache.upsert({ where: { key }, create: { key, data: points as unknown as Prisma.InputJsonValue }, update: { data: points as unknown as Prisma.InputJsonValue, fetchedAt: new Date() } })
    return points
  })()
  pending.set(key, promise)
  try { return await promise } finally { pending.delete(key) }
}
export async function euroHistory(instrument: Benchmark) {
  const prices = await history(instrument.id)
  const currency = instrument.currency === 'GBX' || instrument.currency === 'GBp' ? 'GBP' : instrument.currency.toUpperCase()
  if (currency === 'EUR') return prices
  if (!/^[A-Z]{3}$/.test(currency)) throw new ApiError('This instrument’s currency is not supported.', 422)
  return pricesInEuro(prices, await history(`EUR${currency}.FOREX`), instrument.currency === 'GBX' || instrument.currency === 'GBp' ? 0.01 : 1)
}
export async function searchInstruments(query: string): Promise<Benchmark[]> {
  const key = `search:${query.toUpperCase()}`
  const cached = await prisma.marketCache.findUnique({ where: { key } })
  if (cached && Date.now() - cached.fetchedAt.getTime() < 86400000) return cached.data as unknown as Benchmark[]
  const data = await provider(`search/${encodeURIComponent(query)}`, { limit: '15' })
  if (!Array.isArray(data)) throw new ApiError('Search is temporarily unavailable.', 503)
  const results: Benchmark[] = data.filter((p: Record<string, unknown>) => p.Code && p.Exchange && p.Currency && p.Name).map((p: Record<string, unknown>) => ({ id: `${p.Code}.${p.Exchange}`, name: String(p.Name), currency: String(p.Currency), exchange: String(p.Exchange), type: String(p.Type ?? 'Security'), isin: typeof p.ISIN === 'string' ? p.ISIN : null }))
  await prisma.marketCache.upsert({ where: { key }, create: { key, data: results as unknown as Prisma.InputJsonValue }, update: { data: results as unknown as Prisma.InputJsonValue, fetchedAt: new Date() } })
  // Store provider metadata server-side; the client cannot invent symbols/currencies.
  for (const item of results) await prisma.instrument.upsert({ where: { id: item.id }, create: item, update: item })
  return results
}
