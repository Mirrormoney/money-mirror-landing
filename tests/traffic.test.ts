import { test } from 'node:test'
import assert from 'node:assert/strict'
import { trafficDay, visitorHash, TRAFFIC_PATHS } from '../lib/traffic.ts'
test('traffic dates use Berlin midnight and handle summer time', () => {
 assert.equal(trafficDay(new Date('2026-09-15T22:30:00Z')), '2026-09-16')
 assert.equal(trafficDay(new Date('2026-01-15T22:30:00Z')), '2026-01-15')
})
test('visitor keys deduplicate within a day and rotate daily', () => {
 const key = visitorHash('2026-09-16','192.0.2.1','browser','test-secret')
 assert.equal(key, visitorHash('2026-09-16','192.0.2.1','browser','test-secret'))
 assert.notEqual(key, visitorHash('2026-09-17','192.0.2.1','browser','test-secret'))
 assert.notEqual(key, visitorHash('2026-09-16','192.0.2.2','browser','test-secret'))
 assert.equal(key.includes('192.0.2.1'), false)
 assert.equal(TRAFFIC_PATHS.includes('/admin/users'), false)
 assert.equal(TRAFFIC_PATHS.includes('/login?email=test'), false)
})
