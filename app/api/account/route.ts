import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, isAdmin } from '@/lib/session'
import { apiError, sameOrigin, jsonBody, ApiError } from '@/lib/http'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const user = await requireUser()
    return NextResponse.json({ name: user.name, email: user.email, premium: !!user.subscription?.isPremium, admin: isAdmin(user.email, user.id), passwordRecovery: !!(process.env.EMAIL_SERVER && process.env.EMAIL_FROM) }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return apiError(error) }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request)
    const user = await requireUser()
    const body = await jsonBody(request)
    if (body.confirmation !== 'DELETE') throw new ApiError('Type DELETE to confirm.')
    await prisma.user.delete({ where: { id: user.id } })
    return NextResponse.json({ ok: true })
  } catch (error) { return apiError(error) }
}
