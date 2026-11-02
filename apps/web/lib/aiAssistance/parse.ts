import type { Classification } from "./classifier";
import { detectCoin, extractAmount, mentionsDollar } from "./extract";
import type { ParsedIntent } from "./schema";

const MIN_INTENT = 0.5; 
const MIN_COIN = 0.7; 

export function buildIntent(text: string, c: Classification): ParsedIntent {
  const base: ParsedIntent = {
    intent: "UNKNOWN",
    symbol: null,
    asset: null,
    amount: null,
    amountUnit: null,
    price: null,
    percent: null,
    howto: null,
  };
  if (c.intent.confidence < MIN_INTENT) return base;

  const side = c.side.value === "SELL" ? "SELL" : "BUY";

  let coin: string | null = detectCoin(text);
  if (!coin && c.coin.confidence >= MIN_COIN && c.coin.value && c.coin.value !== "NONE") {
    coin = c.coin.value;
  }
  const tradeCoin = coin && coin !== "USDT" ? coin : null;
  const symbol = (tradeCoin ? `${tradeCoin}USDT` : null) as ParsedIntent["symbol"];

  switch (c.intent.value) {
    case "TRADE":
    case "QUICK_TRADE": {
      const a = extractAmount(text);
      const quick = c.intent.value === "QUICK_TRADE";
      return {
        ...base,
        intent: `${quick ? "QUICK_" : ""}${side}` as ParsedIntent["intent"],
        symbol,
        amount: a.amount,
        amountUnit: a.unit,
        percent: a.percent,
        price: quick ? null : a.price,
      };
    }
    case "HOWTO": {
      const a = extractAmount(text);
      return { ...base, intent: "HOWTO", howto: side, symbol, amount: a.amount, amountUnit: a.unit };
    }
    case "BALANCE":
      return { ...base, intent: "BALANCE", asset: coin ?? (mentionsDollar(text) ? "USDT" : null) };
    case "OPEN_ORDERS":
    case "CANCEL":
    case "PRICE":
      return { ...base, intent: c.intent.value, symbol };
    case "PORTFOLIO":
      return { ...base, intent: "PORTFOLIO" };
    default:
      return base;
  }
}