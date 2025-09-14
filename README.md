# MirrorMoney landing — EN/DE + CSV Import (demo model)

This build adds an **/import** page to upload a CSV and compute a simple "what-if" result using a deterministic demo price model (no external APIs).

## Run locally
```
npm install
npm run dev
```
Open http://localhost:3000

## CSV format
Header row required:
```
date,description,amount
2025-01-15,Coffee + snack,8.50
...
```
- Dates: YYYY-MM-DD
- Amounts: positive euros

## Notes
- Price model is a toy demo (education only), not real market data.
- To deploy privately, use Vercel and keep `public/robots.txt` as-is (no indexing).

— 2025-09-14
