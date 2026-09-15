import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseChart, validSymbol } from '../lib/public-prices.ts'
const time = (date: string) => Date.parse(date) / 1000
test('use adjusted history consistently, skip gaps and exclude today', () => {
  const result = parseChart({ meta: { symbol: 'SPY', currency: 'USD' }, timestamp: [time('2025-01-01'), time('2025-01-02'), time('2025-01-03')], indicators: { quote: [{ close: [100, 110, 120] }], adjclose: [{ adjclose: [90, null, 108] }] } }, 'SPY', '2025-01-03')
  assert.deepEqual(result.points, [{ date: '2025-01-01', price: 90 }])
  assert.equal(result.adjusted, true)
})
test('exchange-local dates preserve Asian daily sessions', () => {
  const result = parseChart({ meta: { symbol: 'TEST', currency: 'JPY', exchangeTimezoneName: 'Asia/Tokyo' }, timestamp: [time('2025-01-01T23:30:00Z')], indicators: { quote: [{ close: [50] }] } }, 'TEST', '2025-01-03')
  assert.equal(result.points[0].date, '2025-01-02')
  assert.equal(result.adjusted, false)
})
test('reject wrong instruments, missing currency, invalid prices and path injection', () => {
  assert.throws(() => parseChart({ meta: { symbol: 'OTHER' } }, 'SPY', '2025-01-03'))
  assert.throws(() => parseChart({ meta: { symbol: 'SPY' } }, 'SPY', '2025-01-03'))
  assert.throws(() => parseChart({ meta: { symbol: 'SPY', currency: 'USD' }, timestamp: [time('2025-01-01')], indicators: { quote: [{ close: [0] }] } }, 'SPY', '2025-01-03'))
  assert.equal(validSymbol('../foo?bar'), false)
  assert.equal(validSymbol('EXS1.DE'), true)
})
