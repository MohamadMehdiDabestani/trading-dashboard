export const SYMBOLS = [
  { value: "BTCUSDT", label: "BTC/USDT", slug: 'btc' },
  { value: "ETHUSDT", label: "ETH/USDT", slug: 'eth' },
  { value: "BNBUSDT", label: "BNB/USDT", slug: 'bnb' },
  { value: "SOLUSDT", label: "SOL/USDT", slug: 'sol' },
  { value: "XRPUSDT", label: "XRP/USDT", slug: 'xrp' },
  { value: "ADAUSDT", label: "ADA/USDT", slug: 'ada' },
] as const;

export type SymbolValue = (typeof SYMBOLS)[number]["value"];