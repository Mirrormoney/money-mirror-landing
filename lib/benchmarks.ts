export type Benchmark = { id: string; name: string; currency: string; exchange: string; type: string; isin?: string | null; color?: string; symbol?: string; proxy?: string }
export const FREE_BENCHMARKS: Benchmark[] = [
  { id: 'GSPC.INDX', name: 'S&P 500', symbol: 'SPY', proxy: 'SPDR S&P 500 ETF Trust (SPY)', currency: 'USD', exchange: 'NYSE Arca', type: 'ETF', color: '#34d399' },
  { id: 'GDAXI.INDX', name: 'DAX', symbol: 'EXS1.DE', proxy: 'iShares Core DAX UCITS ETF (EXS1.DE)', currency: 'EUR', exchange: 'Xetra', type: 'ETF', color: '#60a5fa' },
  { id: 'BTC-USD.CC', name: 'Bitcoin', symbol: 'BTC-EUR', proxy: 'Bitcoin / EUR (BTC-EUR)', currency: 'EUR', exchange: 'Crypto', type: 'Crypto', color: '#fb923c' },
  { id: 'XAUUSD.FOREX', name: 'Gold', symbol: 'GLD', proxy: 'SPDR Gold Shares (GLD)', currency: 'USD', exchange: 'NYSE Arca', type: 'Gold trust', color: '#facc15' },
]
