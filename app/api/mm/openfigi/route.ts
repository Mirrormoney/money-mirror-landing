// app/api/mm/openfigi/route.ts
import { NextRequest, NextResponse } from "next/server";

type FigiHit = {
  name?: string;
  ticker?: string;
  exchCode?: string;
  micCode?: string;
  securityType?: string;
  shareClassFIGI?: string;
  compositeFIGI?: string;
  isin?: string;
};

const OPENFIGI_SEARCH = "https://api.openfigi.com/v3/search";
const OPENFIGI_MAPPING = "https://api.openfigi.com/v3/mapping";

function isISIN(q: string) {
  return /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/i.test(q.trim());
}

async function doFetch(url: string, body: any, key?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key) headers["X-OPENFIGI-APIKEY"] = key;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenFIGI HTTP ${res.status}: ${txt.slice(0, 200)}`);
  }
  return res.json();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }
  const apikey = process.env.OPENFIGI_API_KEY || undefined;

  try {
    let hits: FigiHit[] = [];

    if (isISIN(q)) {
      const body = [{ idType: "ID_ISIN", idValue: q }];
      const json = await doFetch(OPENFIGI_MAPPING, body, apikey);
      const arr = Array.isArray(json) ? json : [];
      for (const block of arr) {
        const data = Array.isArray(block?.data) ? block.data : [];
        for (const d of data) {
          hits.push({
            name: d?.name,
            ticker: d?.ticker,
            exchCode: d?.exchCode,
            micCode: d?.micCode,
            securityType: d?.securityType,
            shareClassFIGI: d?.shareClassFIGI,
            compositeFIGI: d?.compositeFIGI,
            isin: q,
          });
        }
      }
    } else {
      const body = { query: q, limit: 15 };
      const json = await doFetch(OPENFIGI_SEARCH, body, apikey);
      const data = Array.isArray(json?.data) ? json.data : [];
      hits = data.map((d: any) => ({
        name: d?.name,
        ticker: d?.ticker,
        exchCode: d?.exchCode,
        micCode: d?.micCode,
        securityType: d?.securityType,
        shareClassFIGI: d?.shareClassFIGI,
        compositeFIGI: d?.compositeFIGI,
      }));
    }

    const seen = new Set<string>();
    const uniq: FigiHit[] = [];
    for (const h of hits) {
      const key = `${h.ticker || ""}|${h.micCode || ""}|${h.exchCode || ""}|${h.shareClassFIGI || ""}|${h.compositeFIGI || ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniq.push(h);
      }
    }

    return NextResponse.json({ query: q, results: uniq.slice(0, 12) });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err || "Unknown error") }, { status: 502 });
  }
}
