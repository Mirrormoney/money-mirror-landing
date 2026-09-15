import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { prisma } from './prisma'
export class ApiError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}
export function apiError(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status })
  console.error('Request failed', error instanceof Error ? error.name : 'UnknownError')
  return NextResponse.json({ error: 'Something went wrong. Please try again shortly.' }, { status: 503 })
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin || origin !== new URL(request.url).origin) throw new ApiError('Please reload the page and try again.', 403)
}
export async function jsonBody(request: Request) {
  const body = await request.text()
  if (body.length > 500_000) throw new ApiError('This upload is too large.', 413)
  try { return JSON.parse(body) } catch { throw new ApiError('Invalid request') }
}
export async function limit(key: string, maximum: number, seconds: number) {
  const bucket = Math.floor(Date.now() / (seconds * 1000))
  const hashed = createHash('sha256').update(`${key}:${bucket}`).digest('hex')
  const record = await prisma.rateLimit.upsert({ where: { key: hashed }, create: { key: hashed, expiresAt: new Date((bucket + 1) * seconds * 1000) }, update: { hits: { increment: 1 } } })
  if (record.hits > maximum) throw new ApiError('Too many requests. Please wait a few minutes.', 429)
}
