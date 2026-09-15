import Link from 'next/link'
import { requireUser, isAdmin } from '@/lib/session'
import AdminUsersTable from '@/components/AdminUsersTable'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { ApiError } from '@/lib/http'
export const dynamic = 'force-dynamic'
export default async function AdminUsersPage() {
 let user
 try { user = await requireUser() } catch (e) { if (e instanceof ApiError && e.status === 401) redirect('/login'); throw e }
 if (!isAdmin(user.email, user.id)) notFound()
 const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 500, include: { subscription: true } })
 const rows = users.filter(u => u.email).map(u => ({ email: u.email!, isPremium: !!u.subscription?.isPremium, plan: (u.subscription?.isPremium ? 'premium' : 'free') as 'premium' | 'free' }))
 return <section className="container max-w-4xl py-14"><Link href="/account" className="text-sm text-emerald-300">← Account</Link><h1 className="my-6 text-3xl font-semibold">Manage Premium access</h1><AdminUsersTable initialRows={rows} /></section>
}
