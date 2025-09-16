export type Scenario = 'sp500' | 'msci' | 'btc';

export type Tx = {
  date: string;        // YYYY-MM-DD
  description: string; // free text
  amount: number;      // positive EUR
};

const KEYS = {
  items: 'mm.import.v1.items',
  scenario: 'mm.import.v1.scenario',
  asOf: 'mm.import.v1.asOf',
} as const;

type Persisted<T> = { v: 1; value: T };
type PersistedItems = { v: 1; items: Tx[] };

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export function loadImportState(): { items: Tx[]; scenario: Scenario; asOf: string | null } {
  if (typeof window === 'undefined') return { items: [], scenario: 'sp500', asOf: null };
  const itemsObj = safeParse<PersistedItems>(localStorage.getItem(KEYS.items));
  const scenarioObj = safeParse<Persisted<Scenario | string>>(localStorage.getItem(KEYS.scenario));
  const asOfObj = safeParse<Persisted<string | null>>(localStorage.getItem(KEYS.asOf));

  const scenarioRaw = (scenarioObj?.value ?? 'sp500') as string;
  const scenario: Scenario = (['sp500', 'msci', 'btc'].includes(scenarioRaw) ? scenarioRaw : 'sp500') as Scenario;

  return {
    items: itemsObj?.items ?? [],
    scenario,
    asOf: asOfObj?.value ?? null,
  };
}

export function saveImportState(data: { items: Tx[]; scenario: Scenario; asOf: string | null }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEYS.items, JSON.stringify({ v: 1, items: data.items } as PersistedItems));
    localStorage.setItem(KEYS.scenario, JSON.stringify({ v: 1, value: data.scenario } as Persisted<Scenario>));
    localStorage.setItem(KEYS.asOf, JSON.stringify({ v: 1, value: data.asOf } as Persisted<string | null>));
  } catch {}
}

export function clearImportState() {
  if (typeof window === 'undefined') return;
  try {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  } catch {}
}
