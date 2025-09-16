// lib/providers/fx.ts
export async function eurFx(_dateISO: string, fromCcy: "USD" | "EUR"): Promise<number> {
  if (fromCcy === "EUR") return 1;
  return 1; // TODO: ECB daily rate
}
