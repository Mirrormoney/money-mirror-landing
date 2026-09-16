import Link from 'next/link'
import { requireUser, isAdmin } from '@/lib/session'
import AdminUsersTable from '@/components/AdminUsersTable'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { ApiError } from '@/lib/http'
import AdminTraffic from '@/components/AdminTraffic'
import { trafficDay } from '@/lib/traffic'
export const dynamic = 'force-dynamic'
export default async function AdminUsersPage() {
 let user
 try { user = await requireUser() } catch (e) { if (e instanceof ApiError && e.status === 401) redirect('/login'); throw e }
 if (!isAdmin(user.email, user.id)) notFound()
 const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 500, include: { subscription: true } })
 const rows = users.filter(u => u.email).map(u => ({ email: u.email!, isPremium: !!u.subscription?.isPremium, plan: (u.subscription?.isPremium ? 'premium' : 'free') as 'premium' | 'free' }))
 const today = trafficDay()
 const days = Array.from({ length: 30 }, (_, i) => ({ day: new Date(Date.parse(`${today}T12:00:00Z`) - (29-i)*86400000).toISOString().slice(0,10), views: 0, visitors: 0 }))
 const counts = await prisma.$queryRaw<{day: string; path: string; views: number; visitors: number}[]>`SELECT "day", "path", "views", "visitors" FROM "TrafficDay" WHERE "day" >= ${days[0].day} AND "day" <= ${today}`
 const pages = new Map<string, number>()
 for (const row of counts) { if (row.path === '*') { const day = days.find(d => d.day === row.day); if(day) { day.views = row.views; day.visitors = row.visitors } } else pages.set(row.path, (pages.get(row.path) ?? 0) + row.views) }
 return <section className="container max-w-4xl py-14"><Link href="/account" className="text-sm text-emerald-300">← Account / Konto</Link><h1 className="my-6 text-3xl font-semibold">Admin</h1><AdminTraffic days={days} pages={[...pages].map(([path,views])=>({path,views})).sort((a,b)=>b.views-a.views)} /><h2 className="mb-4 text-xl">Premium access / Premium-Zugang</h2><AdminUsersTable initialRows={rows} /></section>
}
