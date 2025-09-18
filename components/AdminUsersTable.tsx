'use client'
import React from "react"

type Row = { email: string; isPremium: boolean; plan: "free" | "premium" }

export default function AdminUsersTable({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = React.useState<Row[]>(initialRows)
  const [busy, setBusy] = React.useState<string | null>(null)
  const [err, setErr] = React.useState<string | null>(null)

  const toggle = async (email: string, current: boolean) => {
    setBusy(email); setErr(null)
    try {
      const res = await fetch("/api/account/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, premium: !current })
      })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        throw new Error(j?.error || `HTTP ${res.status}`)
      }
      setRows(prev => prev.map(r => r.email === email ? { ...r, isPremium: !current, plan: !current ? "premium" : "free" } : r))
    } catch (e:any) {
      setErr(e?.message || "Failed to toggle")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="rounded-2xl border">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 px-3">Email</th>
              <th className="py-2 px-3">Plan</th>
              <th className="py-2 px-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.email} className="border-b">
                <td className="py-2 px-3">{r.email}</td>
                <td className="py-2 px-3">{r.isPremium ? "Premium" : "Free"}</td>
                <td className="py-2 px-3">
                  <button
                    onClick={() => toggle(r.email, r.isPremium)}
                    disabled={busy === r.email}
                    className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    {busy === r.email ? "Updating…" : (r.isPremium ? "Set Free" : "Set Premium")}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="py-6 px-3 text-gray-500" colSpan={3}>No users found. Ask someone to sign in first.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {err && <div className="p-3 text-sm text-red-600">{err}</div>}
    </div>
  )
}
