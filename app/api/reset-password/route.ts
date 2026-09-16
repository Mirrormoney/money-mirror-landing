import { randomBytes, createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'
import { validPassword, hashPassword } from '@/lib/password'
import { apiError, ApiError, jsonBody, sameOrigin, limit } from '@/lib/http'
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    await limit(`reset:${request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'}`, 5, 900)
    const body = await jsonBody(request)
    if (typeof body.token === 'string') {
      if (!/^[a-f0-9]{64}$/.test(body.token) || !validPassword(body.password)) throw new ApiError('Use a valid reset link and a password of at least 12 characters.')
      const token = createHash('sha256').update(body.token).digest('hex')
      const passwordHash = await hashPassword(body.password)
      await prisma.$transaction(async tx => {
        const record = await tx.verificationToken.findUnique({ where: { token } })
        if (!record || !record.identifier.startsWith('reset:') || record.expires < new Date()) throw new ApiError('This reset link is invalid or has expired.')
        const consumed = await tx.verificationToken.deleteMany({ where: { token, expires: { gt: new Date() } } })
        if (!consumed.count) throw new ApiError('This reset link has already been used.')
        await tx.user.update({ where: { id: record.identifier.slice(6) }, data: { passwordHash, sessionVersion: { increment: 1 }, emailVerified: new Date() } })
      })
      return NextResponse.json({ ok: true })
    }
    if (!process.env.EMAIL_SERVER || !process.env.EMAIL_FROM || !process.env.NEXTAUTH_URL) throw new ApiError('Email recovery is not available yet. Please contact contact@mirrormoney.com for help.', 503)
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new ApiError('Enter a valid email address.')
    await limit(`reset-email:${email}`, 3, 3600)
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      const raw = randomBytes(32).toString('hex'), token = createHash('sha256').update(raw).digest('hex')
      await prisma.verificationToken.create({ data: { identifier: `reset:${user.id}`, token, expires: new Date(Date.now() + 30 * 60000) } })
      const link = `${process.env.NEXTAUTH_URL}/reset-password?token=${raw}`
      await nodemailer.createTransport(process.env.EMAIL_SERVER).sendMail({ from: process.env.EMAIL_FROM, to: email, subject: 'Reset your MirrorMoney password', text: `Use this link to reset your MirrorMoney password. It expires in 30 minutes.\n\n${link}\n\nIf you did not request this, ignore this email.` })
    }
    return NextResponse.json({ ok: true })
  } catch (e) { return apiError(e) }
}
