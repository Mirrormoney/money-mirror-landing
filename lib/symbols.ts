// lib/symbols.ts
export type Scenario = "sp500" | "msci" | "btc";

export function defaultSymbolFor(scenario: Scenario): { symbol?: string; coinId?: string } {
  const envSymSp = process.env.SYMBOL_SP500;
  const envSymMsci = process.env.SYMBOL_MSCI;
  if (scenario === "sp500") return { symbol: envSymSp || "SPY" };
  if (scenario === "msci") return { symbol: envSymMsci || "URTH" };
  return { coinId: "bitcoin" };
}
