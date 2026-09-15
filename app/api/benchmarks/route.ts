import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { FREE_BENCHMARKS } from '@/lib/benchmarks'
import { searchInstruments } from '@/lib/market'
import { ApiError, apiError, jsonBody, sameOrigin, limit } from '@/lib/http'
export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const q = new URL(request.url).searchParams.get('q')?.trim()
    if (q) {
      if (!user.subscription?.isPremium) throw new ApiError('ISIN and instrument search is included in Premium.', 403)
      if (q.length < 2 || q.length > 80) throw new ApiError('Search with 2–80 characters.')
      await limit(`search:${user.id}`, 20, 60)
      return NextResponse.json({ results: await searchInstruments(q) })
    }
    const custom = user.subscription?.isPremium ? await prisma.userBenchmark.findMany({ where: { userId: user.id }, include: { instrument: true }, orderBy: { createdAt: 'asc' } }) : []
    return NextResponse.json({ benchmarks: [...FREE_BENCHMARKS, ...custom.map(b => b.instrument)], premium: !!user.subscription?.isPremium }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return apiError(error) }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    const user = await requireUser()
    if (!user.subscription?.isPremium) throw new ApiError('Premium is required.', 403)
    const body = await jsonBody(request)
    if (typeof body.id !== 'string' || !await prisma.instrument.findUnique({ where: { id: body.id } })) throw new ApiError('Choose an instrument from the search results.')
    if (FREE_BENCHMARKS.some(b => b.id === body.id)) return NextResponse.json({ ok: true })
    const count = await prisma.userBenchmark.count({ where: { userId: user.id } })
    if (count >= 20) throw new ApiError('You can save up to 20 custom benchmarks. Remove one before adding another.')
    await prisma.userBenchmark.upsert({ where: { userId_instrumentId: { userId: user.id, instrumentId: body.id } }, create: { userId: user.id, instrumentId: body.id }, update: {} })
    return NextResponse.json({ ok: true })
  } catch (error) { return apiError(error) }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request)
    const user = await requireUser()
    const body = await jsonBody(request)
    if (typeof body.id !== 'string') throw new ApiError('Choose an instrument.')
    await prisma.userBenchmark.deleteMany({ where: { userId: user.id, instrumentId: body.id } })
    return NextResponse.json({ ok: true })
  } catch (error) { return apiError(error) }
}
