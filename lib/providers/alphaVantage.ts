// lib/providers/alphaVantage.ts
export type DailyAdjusted = Record<string, { adjClose: number }>;

function parseDailyAdjusted(json: any): DailyAdjusted {
  const series = json?.["Time Series (Daily)"];
  if (!series || typeof series !== "object") return {};
  const out: DailyAdjusted = {};
  for (const [date, row] of Object.entries<any>(series)) {
    const adj = Number((row && (row as any)["5. adjusted close"]) ?? NaN);
    if (isFinite(adj)) out[date] = { adjClose: adj };
  }
  return out;
}

export async function fetchDailyAdjusted(symbol: string, apikey: string, outputsize: "compact" | "full" = "full"): Promise<DailyAdjusted> {
  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "TIME_SERIES_DAILY_ADJUSTED");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("outputsize", outputsize);
  url.searchParams.set("apikey", apikey);
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`AlphaVantage HTTP ${res.status}`);
  const json = await res.json();
  if (json?.["Error Message"] || json?.["Note"]) {
    throw new Error(json?.["Error Message"] || json?.["Note"] || "AlphaVantage error");
  }
  return parseDailyAdjusted(json);
}

export function nearestAvailable(date: string, data: DailyAdjusted, direction: -1 | 1 = -1): string | null {
  const d = new Date(date + "T00:00:00Z");
  for (let i = 0; i < 366; i++) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const key = `${y}-${m}-${day}`;
    if (data[key]) return key;
    d.setUTCDate(d.getUTCDate() + direction);
  }
  return null;
}
