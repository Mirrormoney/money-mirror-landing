import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
const base = process.env.TEST_URL ?? 'http://localhost:3000'
const password = randomBytes(24).toString('base64url')
const accounts = []
function client() {
  const cookies = new Map()
  return async (path, method = 'GET', body, headers = {}) => {
    const response = await fetch(`${base}${path}`, { method, redirect: 'manual', headers: { cookie: [...cookies].map(([k,v]) => `${k}=${v}`).join('; '), origin: base, ...(process.env.TEST_BYPASS ? { 'x-vercel-protection-bypass': process.env.TEST_BYPASS } : {}), ...(body ? { 'content-type': 'application/json' } : {}), ...headers }, body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined })
    for (const cookie of response.headers.getSetCookie()) { const first = cookie.split(';')[0]; const i = first.indexOf('='); cookies.set(first.slice(0, i), first.slice(i + 1)) }
    const text = await response.text(); let data; try { data = JSON.parse(text) } catch { data = text }
    return { status: response.status, data }
  }
}
async function create(suffix) {
  const call = client(), email = `mm-smoke-${Date.now()}-${suffix}@example.com`
  assert.equal((await call('/api/register', 'POST', { email, password, name: 'Disposable smoke test' })).status, 201)
  const csrf = (await call('/api/auth/csrf')).data.csrfToken
  const login = await call('/api/auth/callback/credentials', 'POST', new URLSearchParams({ csrfToken: csrf, email, password, json: 'true', callbackUrl: `${base}/import` }).toString(), { 'content-type': 'application/x-www-form-urlencoded' })
  assert.equal(login.status, 200)
  assert.equal((await call('/api/account')).status, 200)
  accounts.push(call)
  return call
}
try {
  assert.equal((await client()('/api/spending')).status, 401)
  const alice = await create('a'), bob = await create('b')
  const entry = { date: '2025-01-15', amountCents: 450, description: 'Smoke test coffee', category: 'Other' }
  assert.equal((await alice('/api/spending', 'POST', entry)).status, 201)
  const row = (await alice('/api/spending')).data.spending[0]
  assert.equal(row.amountCents, 450)
  assert.equal((await bob('/api/spending')).data.spending.length, 0)
  assert.equal((await bob('/api/spending', 'PATCH', { ...entry, id: row.id })).status, 404)
  assert.equal((await bob('/api/spending', 'DELETE', { id: row.id })).status, 404)
  assert.equal((await alice('/api/spending', 'POST', entry, { origin: 'https://untrusted.example' })).status, 403)
  assert.equal((await alice('/api/spending', 'POST', { ...entry, amountCents: -1 })).status, 400)
  assert.equal((await alice('/api/benchmarks')).data.benchmarks.length, 4)
  assert.equal((await alice('/api/benchmarks?q=Apple')).status, 403)
  assert.equal((await alice('/api/portfolio?benchmark=AAPL.US')).status, 403)
  assert.equal((await alice('/api/account/plan', 'POST', { email: 'nobody@example.com', premium: true })).status, 403)
  assert.equal((await alice('/api/spending', 'PATCH', { ...entry, id: row.id, amountCents: 650 })).status, 200)
  assert.equal((await alice('/api/spending')).data.spending[0].amountCents, 650)
  assert.equal((await alice('/api/spending', 'DELETE', { id: row.id })).status, 200)
  assert.equal((await alice('/api/spending')).data.spending.length, 0)
  console.log('PASS: registration, sign-in, persistence, editing, deletion, user isolation, origin checks, validation, four free benchmarks, premium and admin authorization.')
} finally {
  for (const call of accounts) {
    assert.equal((await call('/api/account', 'DELETE', { confirmation: 'DELETE' })).status, 200)
    assert.equal((await call('/api/account')).status, 401)
  }
  console.log('Disposable test accounts removed; deleted-account sessions rejected.')
}
