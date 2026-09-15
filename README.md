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
- Premium ISIN/ticker/name lookup through EODHD, saved custom instruments, maximum 20 per account.
- Historical cashflow calculation in EUR, first closing price on/after each expense, weekend cash treatment, historical FX, explicit missing-history errors.
- Persistent daily market cache; daily Vercel cron at 06:00 UTC. Data ends at the previous calendar day or earlier available trading close.
- Google and Apple providers activate when their credentials are present. Email links and password recovery activate with SMTP configuration.
- English/German responsive interface.

## Required service settings
Do not paste credentials into chat or commit them. Add them to this project's Vercel Environment Variables, then redeploy.

### Historical market data
`EODHD_API_KEY` is required. Choose access covering historical indices, forex/metals, crypto, securities, ISIN search, and the history depth you want to offer. For public/commercial redistribution, confirm licensing directly with EODHD.
- API and history: https://eodhd.com/financial-apis/api-for-historical-data-and-volumes
- ISIN search: https://eodhd.com/financial-apis/search-api-for-stocks-etfs-mutual-funds
- Commercial options: https://eodhd.com/commercial-pricing

Configured symbols: `GSPC.INDX`, `GDAXI.INDX`, `BTC-USD.CC`, `XAUUSD.FOREX`. Verify all four against the purchased account before declaring the data feature live; DAX coverage and metadata still require verification. EUR FX pairs are requested as `EUR{currency}.FOREX`.

The public test token was used locally to verify actual Bitcoin and EURUSD history. It is not installed in production, and its cached data was removed after testing. The application never uses invented growth rates as real historical returns.

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
S&P 500 is a price index; DAX is a performance index. Gold and Bitcoin use spot history. Security prices use provider-adjusted closes. These series differ in dividend treatment; the dashboard discloses it. Values exclude fees, taxes, spreads and interest on pending cash. Premium coverage is not universal; missing history fails explicitly. Trading gaps above seven days and FX gaps above seven days are rejected rather than silently approximated.

## Validation status
- Production build and TypeScript passed locally.
- Eight calculation/CSV tests passed.
- Local end-to-end API smoke tests passed: registration/login, persistence, edits/deletes, isolation, request-origin checks, four free benchmarks, premium and admin rejection, account deletion and invalidated sessions.
- Browser verified registration, saving, reload persistence, editing, real Bitcoin/EUR history, negative return display, desktop and phone-width layout.
- npm audit reported zero known vulnerabilities after updates.
- Full provider-account coverage, Google/Apple login, SMTP delivery and paid checkout remain external setup/validation items.
