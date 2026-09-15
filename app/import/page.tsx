import { requireUser } from '@/lib/session'
import { ApiError } from '@/lib/http'
import Dashboard from '@/components/Dashboard'
import GuestPreview from '@/components/GuestPreview'
export const dynamic = 'force-dynamic'
export default async function ImportPage() {
  try { await requireUser() } catch (e) {
    if (e instanceof ApiError && e.status === 401) return <GuestPreview />
    throw e
  }
  return <Dashboard />
}
