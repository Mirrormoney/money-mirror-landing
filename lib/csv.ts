import { validateSpending } from './portfolio.ts'
export function parseSpendingCsv(text: string) {
  if (text.length > 500000) throw new Error('CSV is too large. Import up to 500 rows at a time.')
  const delimiter = text.split(/\r?\n/)[0].includes(';') ? ';' : ','
  const rows: string[][] = []; let row: string[] = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') { if (quoted && text[i + 1] === '"') { field += '"'; i++ } else quoted = !quoted }
    else if (!quoted && c === delimiter) { row.push(field); field = '' }
    else if (!quoted && c === '\n') { row.push(field.replace(/\r$/, '')); if (row.some(v => v.trim())) rows.push(row); row = []; field = '' }
    else field += c
  }
  if (quoted) throw new Error('An opening quote in the CSV has no closing quote.')
  row.push(field.replace(/\r$/, '')); if (row.some(v => v.trim())) rows.push(row)
  const headers = rows.shift()?.map(h => h.replace(/^\uFEFF/, '').trim().toLowerCase()) ?? []
  const column = (...names: string[]) => headers.findIndex(h => names.includes(h))
  const date = column('date', 'datum'), amount = column('amount', 'amount (€)', 'betrag'), description = column('description', 'beschreibung'), category = column('category', 'kategorie')
  if (date < 0 || amount < 0 || description < 0) throw new Error('CSV needs date, amount and description columns.')
  if (!rows.length || rows.length > 500) throw new Error('Import between 1 and 500 rows.')
  return rows.map((r, i) => {
    try {
      const value = (r[amount] ?? '').trim().replace(',', '.')
      if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error('Use a positive amount with up to two decimals; no thousands separators.')
      return validateSpending({ date: r[date]?.trim(), amountCents: Math.round(Number(value) * 100), description: r[description]?.trim(), category: category >= 0 ? r[category]?.trim() : 'Other' })
    } catch (e) { throw new Error(`Row ${i + 2}: ${e instanceof Error ? e.message : 'Invalid entry'}`) }
  })
}
export function spendingCsv(rows: { date: string; amountCents: number; description: string; category: string }[]) {
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`
  // Prefix formula-leading text when exporting for spreadsheet applications.
  const safe = (value: string) => quote(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value)
  return ['date,amount,description,category', ...rows.map(r => `${r.date},${(r.amountCents / 100).toFixed(2)},${safe(r.description)},${safe(r.category)}`)].join('\r\n')
}
