import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/session'
import { hashPassword, validPassword, verifyPassword } from '@/lib/password'
import { apiError, sameOrigin, jsonBody, ApiError, limit } from '@/lib/http'
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    const user = await requireUser()
    await limit(`password:${user.id}`, 5, 900)
    const body = await jsonBody(request)
    if (!validPassword(body.password)) throw new ApiError('Use a password between 12 and 128 characters.')
    if (user.passwordHash && (typeof body.currentPassword !== 'string' || body.currentPassword.length > 128 || !(await verifyPassword(body.currentPassword, user.passwordHash)))) throw new ApiError('The current password is incorrect.', 403)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(body.password), sessionVersion: { increment: 1 } } })
    return NextResponse.json({ ok: true })
  } catch (error) { return apiError(error) }
}
