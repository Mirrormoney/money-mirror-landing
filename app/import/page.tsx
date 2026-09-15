import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { ApiError } from '@/lib/http'
import Dashboard from '@/components/Dashboard'
export const dynamic = 'force-dynamic'
export default async function ImportPage() {
  try { await requireUser() } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/login')
    throw e
  }
  return <Dashboard />
}
