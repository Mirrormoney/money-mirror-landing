// Simple deterministic price model for demo purposes (not real data).
export type Asset = 'SP500' | 'MSCI' | 'BTC'

const BASE_DATE = new Date('2024-01-01T00:00:00Z').getTime()
const MS_PER_DAY = 86400000

const DRIFT: Record<Asset, number> = {
  SP500: 0.08,
  MSCI: 0.07,
  BTC: 0.50,
}

function wobble(days: number, freq: number, amp: number) {
  return 1 + amp * Math.sin((2*Math.PI*freq*days)/365)
}

export function priceIndex(asset: Asset, when: Date): number {
  const days = Math.max(0, Math.floor((when.getTime() - BASE_DATE)/MS_PER_DAY))
  const years = days / 365
  const drift = DRIFT[asset]
  return 100 * Math.exp(drift * years) * wobble(days, asset === 'BTC' ? 4 : 2, asset === 'BTC' ? 0.2 : 0.05)
}

export function ratio(asset: Asset, fromDate: Date, toDate: Date): number {
  const a = Math.max(1e-6, priceIndex(asset, fromDate))
  const b = Math.max(1e-6, priceIndex(asset, toDate))
  return b / a
}

export function parseYMD(s: string): Date | null {
  const m = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(s)
  if (!m) return null
  const y = +m[1], mo = +m[2]-1, d = +m[3]
  const dt = new Date(Date.UTC(y, mo, d))
  return isNaN(dt.getTime()) ? null : dt
}
