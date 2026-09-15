import { NextResponse } from 'next/server'
import { FREE_BENCHMARKS } from '@/lib/benchmarks'
import { euroHistory } from '@/lib/market'
import { prisma } from '@/lib/prisma'
export const maxDuration = 60
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const custom = await prisma.instrument.findMany({ where: { users: { some: { user: { subscription: { isPremium: true } } } } } })
  const results = await Promise.allSettled([...FREE_BENCHMARKS, ...custom].map(euroHistory))
  await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } })
  await prisma.verificationToken.deleteMany({ where: { expires: { lt: new Date() } } })
  const failed = results.filter(r => r.status === 'rejected').length
  return NextResponse.json({ refreshed: results.length - failed, failed }, { status: failed ? 503 : 200 })
}
