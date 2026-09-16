import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSpendingCsv, spendingCsv } from '../lib/csv.ts'
test('CSV handles quoted commas and decimal-comma semicolon exports', () => {
  const row = parseSpendingCsv('date,amount,description\n2025-01-15,4.50,"Coffee, cake"')[0]
  assert.equal(row.description, 'Coffee, cake')
  assert.equal(row.amountCents, 450)
  assert.equal(parseSpendingCsv('Datum;Betrag;Beschreibung\n2025-01-15;4,50;Kaffee')[0].amountCents, 450)
})
test('CSV reports invalid rows and protects spreadsheet formula exports', () => {
  assert.throws(() => parseSpendingCsv('date,amount,description\n2025-02-30,4.50,Coffee'), /Row 2/)
  assert.throws(() => parseSpendingCsv('date,amount,description\n2025-01-15,4.50,"Coffee'), /closing quote/)
  assert.match(spendingCsv([{ date: '2025-01-15', amountCents: 450, description: '=HYPERLINK("example")', category: 'Other' }]), /"'=HYPERLINK/)
})
