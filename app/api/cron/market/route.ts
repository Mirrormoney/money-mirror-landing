import { NextResponse } from 'next/server'
import { FREE_BENCHMARKS } from '@/lib/benchmarks'
import { euroHistory } from '@/lib/market'
import { prisma } from '@/lib/prisma'
export const maxDuration = 60
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Warm only the four shared benchmarks. Custom histories refresh on demand.
  const results = await Promise.allSettled(FREE_BENCHMARKS.map(euroHistory))
  await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } })
  await prisma.verificationToken.deleteMany({ where: { expires: { lt: new Date() } } })
  await prisma.marketCache.deleteMany({ where: { fetchedAt: { lt: new Date(Date.now() - 30 * 86400000) } } })
  const failed = results.filter(r => r.status === 'rejected').length
  return NextResponse.json({ refreshed: results.length - failed, failed }, { status: failed ? 503 : 200 })
}
