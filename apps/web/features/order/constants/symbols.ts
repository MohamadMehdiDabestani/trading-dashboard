export const SYMBOLS = [
  { value: "BTCUSDT", label: "BTC/USDT", slug: "btc", baseAsset: "BTC", quoteAsset: "USDT" },
  { value: "ETHUSDT", label: "ETH/USDT", slug: "eth", baseAsset: "ETH", quoteAsset: "USDT" },
  { value: "BNBUSDT", label: "BNB/USDT", slug: "bnb", baseAsset: "BNB", quoteAsset: "USDT" },
  { value: "SOLUSDT", label: "SOL/USDT", slug: "sol", baseAsset: "SOL", quoteAsset: "USDT" },
  { value: "XRPUSDT", label: "XRP/USDT", slug: "xrp", baseAsset: "XRP", quoteAsset: "USDT" },
  { value: "ADAUSDT", label: "ADA/USDT", slug: "ada", baseAsset: "ADA", quoteAsset: "USDT" },
] as const;


export type SymbolValue = (typeof SYMBOLS)[number]["value"];