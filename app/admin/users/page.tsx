import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"
import AdminUsersTable from "@/components/AdminUsersTable"

type Row = { email: string; isPremium: boolean; plan: "free" | "premium" }

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-md px-4 py-16 space-y-3">
          <h1 className="text-2xl font-semibold">Admin · Users</h1>
          <p className="text-gray-700">You are not signed in.</p>
          <Link href="/login" className="underline">Go to login</Link>
        </div>
      </main>
    )
  }

  const admins = (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim()).filter(Boolean)
  const isAdmin = !!session.user?.email && admins.includes(session.user.email)

  if (!isAdmin) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-md px-4 py-16 space-y-3">
          <h1 className="text-2xl font-semibold">Admin · Users</h1>
          <p className="text-red-600">Forbidden. Your email is not in ADMIN_EMAILS.</p>
        </div>
      </main>
    )
  }

  if (!process.env.DATABASE_URL) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-lg px-4 py-16 space-y-3">
          <h1 className="text-2xl font-semibold">Admin · Users</h1>
          <p className="text-gray-700">A database is required to list users and toggle Premium.</p>
          <p className="text-sm text-gray-600">
            Set <code>DATABASE_URL</code>, run <code>npx prisma migrate dev</code>, and redeploy.
          </p>
        </div>
      </main>
    )
  }

  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    include: { subscription: true }
  })

  const rows: Row[] = users.map(u => ({
    email: u.email || "",
    isPremium: !!u.subscription?.isPremium,
    plan: (u.subscription?.plan as any) || "free"
  })).filter(r => !!r.email)

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-6">
        <h1 className="text-2xl font-semibold">Admin · Users</h1>
        <AdminUsersTable initialRows={rows} />
        <p className="text-xs text-gray-500">
          Tip: Ensure your admin email is listed in <code>ADMIN_EMAILS</code> (comma separated).
        </p>
      </div>
    </main>
  )
}
