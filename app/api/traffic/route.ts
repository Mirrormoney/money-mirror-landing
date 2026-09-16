import { prisma } from '@/lib/prisma'
import { sameOrigin, limit, ApiError } from '@/lib/http'
import { trafficDay, visitorHash, TRAFFIC_PATHS } from '@/lib/traffic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { isAdmin } from '@/lib/session'
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    if (request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1') return new Response(null, { status: 204 })
    const agent = (request.headers.get('user-agent') ?? '').slice(0, 500)
    if (/bot|crawler|spider|headless|preview|monitor/i.test(agent)) return new Response(null, { status: 204 })
    const raw = await request.text()
    if (raw.length > 200) return new Response(null, { status: 400 })
    const path = JSON.parse(raw)?.path
    if (typeof path !== 'string' || !TRAFFIC_PATHS.includes(path)) return new Response(null, { status: 400 })
    const session = await getServerSession(authOptions)
    if (session?.user?.id && isAdmin(session.user.email ?? null, session.user.id)) return new Response(null, { status: 204 })
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) return new Response(null, { status: 503 })
    // Vercel supplies this header. IP and user agent are never persisted by analytics.
    const ip = (request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
    const day = trafficDay()
    const hash = visitorHash(day, ip, agent, secret)
    await limit(`traffic:${hash}`, 120, 86400)
    await prisma.$transaction(async tx => {
      const inserted = await tx.$queryRaw<{ hash: string }[]>`INSERT INTO "TrafficVisitor" ("day", "hash", "expiresAt") VALUES (${day}, ${hash}, ${new Date(Date.now() + 48 * 3600000)}) ON CONFLICT DO NOTHING RETURNING "hash"`
      const first = inserted.length ? 1 : 0
      await tx.$executeRaw`INSERT INTO "TrafficDay" ("day", "path", "views", "visitors") VALUES (${day}, '*', 1, ${first}) ON CONFLICT ("day", "path") DO UPDATE SET "views" = "TrafficDay"."views" + 1, "visitors" = "TrafficDay"."visitors" + ${first}`
      await tx.$executeRaw`INSERT INTO "TrafficDay" ("day", "path", "views", "visitors") VALUES (${day}, ${path}, 1, 0) ON CONFLICT ("day", "path") DO UPDATE SET "views" = "TrafficDay"."views" + 1`
    })
    return new Response(null, { status: 204 })
  } catch (error) {
    if (error instanceof ApiError) return new Response(null, { status: error.status })
    if (error instanceof SyntaxError) return new Response(null, { status: 400 })
    console.error(JSON.stringify({ level: 'error', route: '/api/traffic', message: 'Traffic count failed' }))
    return new Response(null, { status: 503 })
  }
}
