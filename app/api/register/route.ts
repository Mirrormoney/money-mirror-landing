import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, validPassword } from '@/lib/password'
import { ApiError, apiError, jsonBody, limit, sameOrigin } from '@/lib/http'
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    await limit(`register:${request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'}`, 5, 3600)
    const body = await jsonBody(request)
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new ApiError('Enter a valid email address.')
    if (!validPassword(body.password)) throw new ApiError('Use a password between 12 and 128 characters.')
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : ''
    const passwordHash = await hashPassword(body.password)
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) throw new ApiError('Unable to create this account. Try signing in or recovering access.', 409)
    await prisma.user.create({ data: { email, name, passwordHash } })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) { return apiError(error) }
}
