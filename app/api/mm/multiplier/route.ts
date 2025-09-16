// app/api/mm/multiplier/route.ts
import { NextRequest, NextResponse } from "next/server";
import { defaultSymbolFor } from "@/lib/symbols";
import { fetchDailyAdjusted, nearestAvailable } from "@/lib/providers/alphaVantage";
import { btcMultiplier } from "@/lib/providers/coingecko";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scenario = (searchParams.get("scenario") || "sp500") as "sp500" | "msci" | "btc";
  const fromISO = searchParams.get("from") || "";
  const toISO = searchParams.get("to") || "";

  if (!fromISO || !toISO) {
    return NextResponse.json({ error: "Missing from/to" }, { status: 400 });
  }

  if (process.env.NEXT_PUBLIC_USE_REAL_DATA !== "1") {
    return NextResponse.json({ error: "Real data disabled" }, { status: 400 });
  }

  try {
    if (scenario === "btc") {
      const m = await btcMultiplier(fromISO, toISO);
      return NextResponse.json({ multiplier: m, source: "coingecko" });
    }

    const key = process.env.ALPHA_VANTAGE_API_KEY || "";
    if (!key) return NextResponse.json({ error: "Missing ALPHA_VANTAGE_API_KEY" }, { status: 500 });

    const { symbol } = defaultSymbolFor(scenario);
    if (!symbol) return NextResponse.json({ error: "No symbol for scenario" }, { status: 400 });

    const daily = await fetchDailyAdjusted(symbol, key, "full");
    const d0 = nearestAvailable(fromISO, daily, -1);
    const d1 = nearestAvailable(toISO, daily, -1);
    if (!d0 || !d1) return NextResponse.json({ error: "No prices for dates" }, { status: 404 });

    const p0 = daily[d0]?.adjClose;
    const p1 = daily[d1]?.adjClose;
    if (!isFinite(p0 as number) || !isFinite(p1 as number) || (p0 as number) <= 0) return NextResponse.json({ error: "Bad price data" }, { status: 502 });

    const m = (p1 as number) / (p0 as number);
    return NextResponse.json({ multiplier: m, symbol, source: "alphavantage" });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err || "Unknown error") }, { status: 502 });
  }
}
