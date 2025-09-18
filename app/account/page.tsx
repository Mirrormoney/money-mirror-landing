import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import Link from "next/link"

export default async function AccountPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-md px-4 py-16 space-y-3">
          <h1 className="text-2xl font-semibold">Account</h1>
          <p className="text-gray-700">You are not signed in.</p>
          <Link href="/login" className="underline">Go to login</Link>
        </div>
      </main>
    )
  }

  const email = session.user?.email || "Unknown"
  const plan = (session as any).premium ? "Premium" : "Free"

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-xl px-4 py-12 space-y-4">
        <h1 className="text-2xl font-semibold">Account</h1>
        <div className="rounded-xl border p-4">
          <div><span className="text-gray-600">Signed in as:</span> <strong>{email}</strong></div>
          <div><span className="text-gray-600">Plan:</span> <strong>{plan}</strong></div>
        </div>
        <p className="text-sm text-gray-600">Note: Premium toggling requires a database; otherwise plan is JWT-only.</p>
      </div>
    </main>
  )
}
