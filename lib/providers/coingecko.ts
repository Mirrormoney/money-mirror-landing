// lib/providers/coingecko.ts
export async function fetchPriceOnDayEUR(coinId: string, dateISO: string): Promise<number> {
  const from = Math.floor(new Date(dateISO + "T00:00:00Z").getTime() / 1000);
  const to = from + 86400 * 2;
  const url = new URL(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}/market_chart/range`);
  url.searchParams.set("vs_currency", "eur");
  url.searchParams.set("from", String(from));
  url.searchParams.set("to", String(to));
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  const json = await res.json();
  const prices: [number, number][] = json?.prices || [];
  if (!prices.length) throw new Error("No prices");
  const last = prices[prices.length - 1];
  return Number(last?.[1]);
}

export async function btcMultiplier(fromISO: string, toISO: string): Promise<number> {
  const p0 = await fetchPriceOnDayEUR("bitcoin", fromISO);
  const p1 = await fetchPriceOnDayEUR("bitcoin", toISO);
  if (!isFinite(p0) || !isFinite(p1) || p0 <= 0) throw new Error("Invalid BTC prices");
  return p1 / p0;
}
