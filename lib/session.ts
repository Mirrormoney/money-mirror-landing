import { getServerSession } from 'next-auth'
import { authOptions } from './authOptions'
import { prisma } from './prisma'
import { ApiError } from './http'
export async function requireUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new ApiError('Please sign in to continue.', 401)
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { subscription: true } })
  if (!user || user.sessionVersion !== session.user.version) throw new ApiError('Please sign in again.', 401)
  return user
}
export function isAdmin(email: string | null, userId: string) {
  return (process.env.ADMIN_USER_IDS ?? '').split(',').map(id => id.trim()).filter(Boolean).includes(userId)
}
