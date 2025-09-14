# Money‑Mirror — Legal Pages Patch

This patch adds three legal pages and updates the footer links.

## New routes
- `/impressum` — German legal notice (with placeholders to replace)
- `/datenschutz` — Basic GDPR privacy (German, short form; placeholders included)
- `/anlageberatung` — "No investment advice" disclaimer (DE + EN)

## Updated
- `components/Footer.tsx` — links to the pages
- `lib/i18n.tsx` — adds `impressum`, `datenschutz`, `disclaimer` labels for EN/DE

## How to apply
1. **Stop** your dev server (Ctrl+C) or open a second terminal.
2. Extract this ZIP **into your project root** (where `package.json` is), allowing it to **overwrite** existing files:
   - `components/Footer.tsx`
   - `lib/i18n.tsx`
   - `app/impressum/page.tsx`
   - `app/datenschutz/page.tsx`
   - `app/anlageberatung/page.tsx`
3. Run locally:
   ```bash
   npm run dev
   ```
4. Visit:
   - http://localhost:3000/impressum
   - http://localhost:3000/datenschutz
   - http://localhost:3000/anlageberatung
5. Commit & push:
   ```bash
   git add .
   git commit -m "add legal pages (de) + footer links"
   git push
   ```
6. Vercel will redeploy automatically and the pages will be live at the same routes.

> ⚠️ Replace placeholders on the Impressum/Datenschutz pages with your real details. This is a basic template and **not legal advice**.

— Generated 2025-09-14 (Europe/Berlin)
