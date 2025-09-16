// lib/pricing.ts
import { Scenario } from "./symbols";

export function multiplier(scenario: Scenario, fromISO: string, toISO: string): number {
  const from = new Date(fromISO + "T00:00:00Z").getTime();
  const to = new Date(toISO + "T00:00:00Z").getTime();
  const years = Math.max(0, (to - from) / (365.25 * 86400_000));
  const rate = scenario === "sp500" ? 0.08 : scenario === "msci" ? 0.07 : 0.20;
  return Math.pow(1 + rate, years);
}

export { multiplier as getDeterministicMultiplier };

export async function getMultiplierAsync(scenario: Scenario, fromISO: string, toISO: string): Promise<number> {
  if (process.env.NEXT_PUBLIC_USE_REAL_DATA !== "1") {
    return multiplier(scenario, fromISO, toISO);
  }
  try {
    const base = typeof window !== "undefined" ? "" : "http://localhost";
    const url = new URL("/api/mm/multiplier", base || "http://localhost");
    url.searchParams.set("scenario", scenario);
    url.searchParams.set("from", fromISO);
    url.searchParams.set("to", toISO);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const m = Number(json?.multiplier);
    if (!isFinite(m) || m <= 0) throw new Error("bad multiplier");
    return m;
  } catch {
    return multiplier(scenario, fromISO, toISO);
  }
}
