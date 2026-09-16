import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { FREE_BENCHMARKS } from '@/lib/benchmarks'
import { euroHistory } from '@/lib/market'
import { calculatePortfolio } from '@/lib/portfolio'
import { ApiError, apiError, limit } from '@/lib/http'
export const maxDuration = 60
export async function GET(request: Request) {
  try {
    const user = await requireUser()
    await limit(`portfolio:${user.id}`, 90, 60)
    const id = new URL(request.url).searchParams.get('benchmark') ?? FREE_BENCHMARKS[0].id
    let instrument = FREE_BENCHMARKS.find(b => b.id === id)
    if (!instrument) {
      if (!user.subscription?.isPremium) throw new ApiError('This benchmark requires Premium.', 403)
      const saved = await prisma.userBenchmark.findUnique({ where: { userId_instrumentId: { userId: user.id, instrumentId: id } }, include: { instrument: true } })
      if (!saved) throw new ApiError('Add this benchmark before comparing it.', 404)
      instrument = saved.instrument
    }
    const spending = await prisma.expense.findMany({ where: { userId: user.id }, orderBy: { date: 'asc' } })
    if (!spending.length) return NextResponse.json({ empty: true })
    const history = await euroHistory(instrument)
    const prices = history.points
    let result
    try { result = calculatePortfolio(spending, prices, new Date().toISOString().slice(0, 10)) }
    catch (e) { throw new ApiError(e instanceof Error ? e.message : 'Unable to calculate this comparison.', 422) }
    return NextResponse.json({ ...result, instrument, source: history.source, sourceUrl: history.sourceUrl, fetchedAt: history.fetchedAt, historyStart: prices[0]?.date, adjusted: history.adjusted, cachedFallback: history.fallback, stale: !!result.priceDate && Date.now() - Date.parse(result.priceDate) > 7 * 86400000 }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return apiError(error) }
}
