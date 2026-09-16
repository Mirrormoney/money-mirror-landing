import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculatePortfolio, pricesInEuro, validateSpending } from '../lib/portfolio.ts'

const spending = (date: string, amountCents: number) => ({ id: date, date, amountCents, description: 'Coffee', category: 'Other' })
test('each cashflow purchases its own units; gains never multiply principal', () => {
  const result = calculatePortfolio([spending('2025-01-01', 10000), spending('2025-01-03', 10000)], [{ date: '2025-01-01', price: 10 }, { date: '2025-01-03', price: 20 }, { date: '2025-01-04', price: 30 }], '2025-01-04')
  assert.equal(result.spent, 200)
  assert.equal(result.value, 450)
  assert.equal(result.gainPercent, 125)
})
test('weekend spending stays cash until the next trading close', () => {
  const result = calculatePortfolio([spending('2025-01-04', 10000)], [{ date: '2025-01-03', price: 10 }, { date: '2025-01-06', price: 20 }, { date: '2025-01-07', price: 30 }], '2025-01-07')
  assert.equal(result.points[0].value, 100)
  assert.equal(result.value, 150)
})
test('spending after the latest close remains cash', () => {
  const result = calculatePortfolio([spending('2025-01-04', 10000)], [{ date: '2025-01-03', price: 10 }], '2025-01-05')
  assert.equal(result.value, 100)
  assert.equal(result.pending, 100)
})
test('currency movement affects euro returns', () => {
  assert.deepEqual(pricesInEuro([{ date: '2025-01-03', price: 120 }, { date: '2025-01-06', price: 120 }], [{ date: '2025-01-03', price: 1.2 }, { date: '2025-01-06', price: 1 }]), [{ date: '2025-01-03', price: 100 }, { date: '2025-01-06', price: 120 }])
})
test('reject missing history and stale FX instead of inventing prices', () => {
  assert.throws(() => calculatePortfolio([spending('2020-01-01', 10000)], [{ date: '2025-01-01', price: 10 }], '2025-01-01'), /does not cover/)
  assert.throws(() => pricesInEuro([{ date: '2025-01-15', price: 10 }], [{ date: '2025-01-01', price: 1 }]), /Missing currency/)
})
test('validate real calendar dates and integer cents', () => {
  assert.throws(() => validateSpending({ date: '2025-02-30', amountCents: 100, description: 'test' }))
  assert.throws(() => validateSpending({ date: '2025-02-01', amountCents: 1.1, description: 'test' }))
  assert.throws(() => validateSpending({ date: '2025-02-01', amountCents: -1, description: 'test' }))
})
