import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/session'
import { ApiError, apiError, jsonBody, limit, sameOrigin } from '@/lib/http'
import { validateSpending } from '@/lib/portfolio'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const user = await requireUser()
    const spending = await prisma.expense.findMany({ where: { userId: user.id }, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }], select: { id: true, date: true, amountCents: true, description: true, category: true } })
    return NextResponse.json({ spending }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return apiError(error) }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    const user = await requireUser()
    await limit(`spending:${user.id}`, 120, 60)
    const body = await jsonBody(request)
    const rows: unknown[] = Array.isArray(body.entries) ? body.entries : [body]
    if (!rows.length || rows.length > 500) throw new ApiError('Import between 1 and 500 entries at a time.')
    let validated
    try { validated = rows.map(row => validateSpending(row)) } catch (e) { throw new ApiError(e instanceof Error ? e.message : 'Invalid entry') }
    await prisma.$transaction(async tx => {
      const count = await tx.expense.count({ where: { userId: user.id } })
      if (count + rows.length > 10000) throw new ApiError('Your account has reached the 10,000 entry limit.')
      await tx.expense.createMany({ data: validated.map(row => ({ ...row, userId: user.id })) })
    }, { isolationLevel: 'Serializable' })
    return NextResponse.json({ ok: true, count: rows.length }, { status: 201 })
  } catch (error) { return apiError(error) }
}
export async function PATCH(request: Request) {
  try {
    sameOrigin(request)
    const user = await requireUser()
    const body = await jsonBody(request)
    if (typeof body.id !== 'string') throw new ApiError('Missing entry.')
    let data
    try { data = validateSpending(body) } catch (e) { throw new ApiError(e instanceof Error ? e.message : 'Invalid entry') }
    const result = await prisma.expense.updateMany({ where: { id: body.id, userId: user.id }, data })
    if (!result.count) throw new ApiError('Entry not found.', 404)
    return NextResponse.json({ ok: true })
  } catch (error) { return apiError(error) }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request)
    const user = await requireUser()
    const body = await jsonBody(request)
    if (typeof body.id !== 'string') throw new ApiError('Missing entry.')
    const result = await prisma.expense.deleteMany({ where: { id: body.id, userId: user.id } })
    if (!result.count) throw new ApiError('Entry not found.', 404)
    return NextResponse.json({ ok: true })
  } catch (error) { return apiError(error) }
}
