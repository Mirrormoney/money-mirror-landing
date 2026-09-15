import AccountPanel from '@/components/AccountPanel'
import { requireUser, isAdmin } from '@/lib/session'
import { redirect } from 'next/navigation'
import { ApiError } from '@/lib/http'
export const dynamic = 'force-dynamic'
export default async function AccountPage() {
  let user
  try { user = await requireUser() } catch (e) { if (e instanceof ApiError && e.status === 401) redirect('/login'); throw e }
  return <AccountPanel email={user.email ?? ''} name={user.name ?? ''} premium={!!user.subscription?.isPremium} admin={isAdmin(user.email, user.id)} hasPassword={!!user.passwordHash} />
}
