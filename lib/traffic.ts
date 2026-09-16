import { createHmac } from 'node:crypto'
export const TRAFFIC_PATHS = ['/', '/import', '/demo', '/pricing', '/faq', '/login', '/account', '/impressum', '/datenschutz', '/anlageberatung', '/reset-password']
export function trafficDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)!.value).join('-')
}
export function visitorHash(day: string, ip: string, agent: string, secret: string) {
  const salt = createHmac('sha256', secret).update(`traffic:${day}`).digest()
  return createHmac('sha256', salt).update(`${ip}\n${agent}`).digest('hex')
}
