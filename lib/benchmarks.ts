export type Benchmark = { id: string; name: string; currency: string; exchange: string; type: string; isin?: string | null; color?: string }
export const FREE_BENCHMARKS: Benchmark[] = [
  { id: 'GSPC.INDX', name: 'S&P 500', currency: 'USD', exchange: 'INDX', type: 'Index', color: '#34d399' },
  { id: 'GDAXI.INDX', name: 'DAX', currency: 'EUR', exchange: 'INDX', type: 'Index', color: '#60a5fa' },
  { id: 'BTC-USD.CC', name: 'Bitcoin', currency: 'USD', exchange: 'CC', type: 'Crypto', color: '#fb923c' },
  { id: 'XAUUSD.FOREX', name: 'Gold', currency: 'USD', exchange: 'FOREX', type: 'Commodity', color: '#facc15' },
]
