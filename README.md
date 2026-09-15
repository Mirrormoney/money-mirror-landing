# MirrorMoney implementation and operations

## Project
- GitHub: https://github.com/Mirrormoney/money-mirror-landing
- Vercel: https://vercel.com/sven-mais-projects/money-mirror-landing
- Production URL: https://money-mirror-landing.vercel.app
- Database: Neon `mirrormoney-db`, free plan, Frankfurt. Connected with `MIRROR_` prefix to preserve older project database settings.

## Implemented
- Email/password account registration and sign-in; passwords hashed with Node scrypt.
- Server-authorized spending storage, editing, deletion, CSV import/export, and account deletion.
- Free benchmark allowlist: S&P 500, DAX, Bitcoin, Gold. Premium checks happen on every relevant API request.
- Premium ISIN/ticker/name lookup through the public Yahoo Finance search endpoint, saved custom instruments, maximum 20 per account.
- Historical cashflow calculation in EUR, first closing price on/after each expense, weekend cash treatment, historical FX, explicit missing-history errors.
- Persistent daily market cache; daily Vercel cron at 06:00 UTC. Data ends at the previous calendar day or earlier available trading close.
- Google and Apple providers activate when their credentials are present. Email links and password recovery activate with SMTP configuration.
- English/German responsive interface.

## Required service settings
Do not paste credentials into chat or commit them. Add them to this project's Vercel Environment Variables, then redeploy.

### Historical market data
No paid data account or key is used. This is a free prototype, not a verified licensed commercial feed.

- S&P 500: SPY (SPDR S&P 500 ETF Trust), USD, adjusted prices.
- DAX: EXS1.DE (iShares Core DAX UCITS ETF), EUR, accumulating fund.
- Bitcoin: BTC-EUR, EUR.
- Gold: GLD (SPDR Gold Shares), USD, fund expenses embedded.
- Market source: publicly accessible Yahoo Finance chart/search endpoints. No authentication bypass, cookie scraping or proxy rotation.
- FX source: Frankfurter v1 / ECB, from 1999. https://frankfurter.dev/
- Full daily histories refresh on demand once per UTC day to keep corporate-action adjustments consistent. Cron warms the four defaults only. No full-market database.
- Global budget: 500 upstream calls/day; 15-minute per-instrument retry cooldown. No auto-upgrades or paid fallback.
- Stale cache may be used for up to seven days with a visible warning. Missing history fails explicitly. Search returns up to four validated listings; ISIN coverage is best-effort.
- Premium remains manually enabled and costs users nothing during testing.

Commercial launch remains unresolved: Yahoo public availability is not a commercial redistribution license. Vercel Hobby is for personal/non-commercial projects. No new subscription was created, but existing account billing and future usage costs are not guaranteed zero. Do not market this as a licensed commercial service without reviewing those requirements.

### Google
Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from your Google OAuth application. Authorized redirect URI:
`https://money-mirror-landing.vercel.app/api/auth/callback/google`
Documentation: https://next-auth.js.org/providers/google

### Apple
Set `APPLE_CLIENT_ID` and `APPLE_CLIENT_SECRET` from your Apple Sign in with Apple setup. Redirect URI:
`https://money-mirror-landing.vercel.app/api/auth/callback/apple`
Apple client secrets expire and need rotation. Apple account/domain setup must be completed by the owner.
Documentation: https://next-auth.js.org/providers/apple

### Email recovery / magic links
Set `EMAIL_SERVER` to your authenticated SMTP connection string and `EMAIL_FROM` to an authorized sender. Password recovery and email sign-in cannot deliver messages until this is connected. `NEXTAUTH_URL` is set for production. Reset links expire after 30 minutes and are single-use; resetting invalidates existing sessions.

### Premium access and billing
Premium currently uses manual grants, with no checkout or charges. No price/payment-provider account has been authorized. After the owner creates an account, put that verified owner's exact database user ID in `ADMIN_USER_IDS`. Do not authorize by an unverified email string. `/admin/users` lets authorized owners grant/revoke Premium. No public endpoint can self-upgrade.

### Business information
The inherited Impressum and privacy pages contain missing operator details. Complete the legal entity/name, address, contact ownership and applicable privacy disclosures before public launch. The technical stack now includes account/spending data stored in Neon and Vercel hosting; the old placeholder privacy text needs that final review.

## Development
Use Node 22. Install with `npm ci`. Link the existing Vercel project and run `vercel env pull .env.local --yes` before database operations. Set `NODE_USE_SYSTEM_CA=1` on this Windows machine if Node requests need the system certificate store.

Commands:
- `npm run db:migrate`: applies ordered SQL migrations with a transaction, advisory lock and checksum tracking in `_MirrorMigrations`. Uses the Node Postgres driver because the Prisma Rust migration engine fails TLS negotiation in this Windows environment. Never run Prisma migrate deploy against this custom migration ledger.
- `npm run dev`
- `npm test`: cashflow, FX, missing-history, validation and CSV checks.
- `npm run typecheck`
- `npm run build`
- `node scripts/smoke.mjs`: creates and deletes disposable local test accounts. Tests authorization, persistence and tier enforcement. Set `TEST_URL` explicitly to target a deployed build.

Secrets: `MIRROR_DATABASE_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`. Existing `DATABASE_URL`/Prisma settings were retained without modification. The new application uses `MIRROR_DATABASE_URL`.

## Calculation limits
The fixed benchmarks use the fund/Bitcoin mappings above, not official index or gold spot feeds. Provider-adjusted closes are preferred; raw closes are used only if no adjusted series exists. Fund costs and tracking differences are embedded. Values exclude fees, taxes, spreads and interest on pending cash. Premium coverage is not universal; missing history fails explicitly. Trading gaps above seven days and FX gaps above seven days are rejected rather than silently approximated.

## Validation status
- Production build and TypeScript passed locally.
- Eleven parser/calculation/CSV tests passed.
- Local end-to-end API smoke tests passed: registration/login, persistence, edits/deletes, isolation, request-origin checks, four free benchmarks, premium and admin rejection, account deletion and invalidated sessions.
- Browser verified registration, saving, reload persistence, editing, real Bitcoin/EUR history, negative return display, desktop and phone-width layout.
- npm audit reported zero known vulnerabilities after updates.
- Google/Apple login, SMTP delivery and commercial licensing remain external setup/validation items. No checkout is configured.

Set TEST_MARKET=1 when running scripts/smoke.mjs to test all four live calculations and premium ISIN add/compare/remove. It grants premium only to a newly created disposable test account and removes it afterward. Requires local database env for that test grant.
