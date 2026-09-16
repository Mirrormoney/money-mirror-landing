export type Spending = { id: string; date: string; amountCents: number; description: string; category: string }
export type PricePoint = { date: string; price: number }
export type PortfolioPoint = { date: string; spent: number; value: number }

export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function validateSpending(input: unknown, today = new Date().toISOString().slice(0, 10)) {
  if (!input || typeof input !== 'object') throw new Error('Invalid spending entry')
  const row = input as Record<string, unknown>
  if (!validDate(row.date) || row.date > today || row.date < '1970-01-01') throw new Error('Choose a valid date in the past or today')
  if (typeof row.amountCents !== 'number' || !Number.isSafeInteger(row.amountCents) || row.amountCents <= 0 || row.amountCents > 100_000_000) throw new Error('Enter an amount between €0.01 and €1,000,000')
  if (typeof row.description !== 'string' || row.description.trim().length < 1 || row.description.trim().length > 160) throw new Error('Add a description of up to 160 characters')
  const categories = ['Food & drink', 'Shopping', 'Travel', 'Subscriptions', 'Other']
  return { date: row.date, amountCents: row.amountCents, description: row.description.trim(), category: categories.includes(String(row.category)) ? String(row.category) : 'Other' }
}

export function cleanPrices(input: PricePoint[]): PricePoint[] {
  const prices = new Map<string, number>()
  for (const p of input) {
    if (!validDate(p.date) || !Number.isFinite(p.price) || p.price <= 0) throw new Error('The data provider returned an invalid price')
    prices.set(p.date, p.price)
  }
  return [...prices].sort(([a], [b]) => a.localeCompare(b)).map(([date, price]) => ({ date, price }))
}

// EURXXX quotes express units of the foreign currency for one euro.
// Never carry an FX quote forward for more than seven days.
export function pricesInEuro(input: PricePoint[], fx: PricePoint[], unitScale = 1): PricePoint[] {
  const rates = cleanPrices(fx)
  let cursor = -1
  return cleanPrices(input).map(p => {
    while (cursor + 1 < rates.length && rates[cursor + 1].date <= p.date) cursor++
    const rate = rates[cursor]
    if (!rate || Date.parse(p.date) - Date.parse(rate.date) > 7 * 86400000) throw new Error(`Missing currency conversion for ${p.date}`)
    return { date: p.date, price: p.price * unitScale / rate.price }
  })
}

// Buy at the first available closing price ON OR AFTER the spending date.
// Until that close is available, contributions remain uninvested cash.
export function calculatePortfolio(spending: Spending[], input: PricePoint[], asOf: string) {
  if (!validDate(asOf)) throw new Error('Invalid valuation date')
  const prices = cleanPrices(input).filter(p => p.date <= asOf)
  const entries = spending.filter(s => s.date <= asOf).sort((a, b) => a.date.localeCompare(b.date))
  if (!entries.length) return { points: [] as PortfolioPoint[], spent: 0, value: 0, gain: 0, gainPercent: 0, pending: 0, priceDate: prices.at(-1)?.date ?? null }
  if (!prices.length) throw new Error('No historical prices are available for this period')
  // A missing early history must never silently buy years after the purchase.
  for (const entry of entries) {
    const first = prices.find(p => p.date >= entry.date)
    if (first && Date.parse(first.date) - Date.parse(entry.date) > 7 * 86400000) throw new Error(`Price history does not cover spending on ${entry.date}`)
  }
  const dates = [...new Set([...prices.map(p => p.date), ...entries.map(e => e.date), asOf])].filter(d => d >= entries[0].date).sort()
  let contribution = 0, pending = 0, units = 0, currentPrice = 0, entryIndex = 0, priceIndex = 0
  const points: PortfolioPoint[] = []
  for (const date of dates) {
    while (entryIndex < entries.length && entries[entryIndex].date <= date) {
      const amount = entries[entryIndex++].amountCents / 100
      contribution += amount
      pending += amount
    }
    while (priceIndex < prices.length && prices[priceIndex].date < date) currentPrice = prices[priceIndex++].price
    if (priceIndex < prices.length && prices[priceIndex].date === date) {
      currentPrice = prices[priceIndex++].price
      units += pending / currentPrice
      pending = 0
    }
    points.push({ date, spent: contribution, value: units * currentPrice + pending })
  }
  const last = points.at(-1)!
  return { points, spent: last.spent, value: last.value, gain: last.value - last.spent, gainPercent: last.spent ? (last.value / last.spent - 1) * 100 : 0, pending, priceDate: prices.at(-1)!.date }
}
