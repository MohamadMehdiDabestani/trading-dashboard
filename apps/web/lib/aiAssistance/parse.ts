import type { Classification } from "./classifier";
import { detectCoin, extractAmount, mentionsDollar } from "./exctract";
import type { ParsedIntent } from "./schema";

const MIN_INTENT = 0.5; // زیر این مقدار: نامطمئن → UNKNOWN
const MIN_COIN = 0.7; // مدل مجبور به انتخاب است؛ حدس ضعیف قبول نیست

/** ترکیب تصمیم JEV + استخراج قطعی با کد → همان ParsedIntent قبلی (widget تغییری نمی‌کند) */
export function buildIntent(text: string, c: Classification): ParsedIntent {
  const base: ParsedIntent = {
    intent: "UNKNOWN",
    symbol: null,
    asset: null,
    amount: null,
    amountUnit: null,
    price: null,
    howto: null,
  };
  if (c.intent.confidence < MIN_INTENT) return base;

  const side = c.side.value === "SELL" ? "SELL" : "BUY";

  // کد اول، JEV برای حالت‌هایی که اسم صریح نبود
  let coin: string | null = detectCoin(text);
  if (!coin && c.coin.confidence >= MIN_COIN && c.coin.value && c.coin.value !== "NONE") {
    coin = c.coin.value;
  }
  const tradeCoin = coin && coin !== "USDT" ? coin : null;
  const symbol = tradeCoin ? `${tradeCoin}USDT` : null;

  switch (c.intent.value) {
    case "TRADE":
    case "QUICK_TRADE": {
      const a = extractAmount(text);
      const prefix = c.intent.value === "QUICK_TRADE" ? "QUICK_" : "";
      return {
        ...base,
        intent: `${prefix}${side}` as ParsedIntent["intent"],
        symbol: symbol as ParsedIntent["symbol"],
        ...a,
        amountUnit: a.unit,
        // قیمت فقط برای limit معنا دارد
        price: prefix ? null : a.price,
      } as ParsedIntent;
    }
    case "HOWTO": {
      const a = extractAmount(text);
      return { ...base, intent: "HOWTO", howto: side, symbol: symbol as ParsedIntent["symbol"], amount: a.amount, amountUnit: a.unit };
    }
    case "BALANCE": {
      const asset = coin ?? (mentionsDollar(text) ? "USDT" : null);
      return { ...base, intent: "BALANCE", asset };
    }
    case "OPEN_ORDERS":
      return { ...base, intent: "OPEN_ORDERS", symbol: symbol as ParsedIntent["symbol"] };
    default:
      return base;
  }
}