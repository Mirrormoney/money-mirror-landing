import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, isAdmin } from '@/lib/session'
import { apiError, ApiError, sameOrigin, jsonBody } from '@/lib/http'
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    const admin = await requireUser()
    if (!isAdmin(admin.email, admin.id)) throw new ApiError('Forbidden', 403)
    const body = await jsonBody(request)
    if (typeof body.email !== 'string' || typeof body.premium !== 'boolean') throw new ApiError('Invalid request')
    const user = await prisma.user.findUnique({ where: { email: body.email.trim().toLowerCase() } })
    if (!user) throw new ApiError('User not found.', 404)
    const data = { isPremium: body.premium, plan: body.premium ? 'premium' : 'free' }
    await prisma.subscription.upsert({ where: { userId: user.id }, create: { ...data, userId: user.id }, update: data })
    return NextResponse.json({ ok: true })
  } catch (e) { return apiError(e) }
}
