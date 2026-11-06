import { normalizeText } from "./normalize";

export type Coin = "BTC" | "ETH" | "BNB" | "SOL" | "XRP" | "ADA";

const prep = (s: string) => normalizeText(s).toLowerCase().replace(/\u200c/g, " ");

const ALIASES: Record<Coin, string[]> = {
  BTC: ["بیت کوین", "بیتکوین", "بیت", "btc", "bitcoin"],
  ETH: ["اتریوم", "اتر", "eth", "ethereum"],
  BNB: ["بایننس", "بینانس", "بی ان بی", "bnb", "binance coin"],
  SOL: ["سولانا", "سول", "sol", "solana"],
  XRP: ["ریپل", "xrp", "ripple"],
  ADA: ["کاردانو", "ada", "cardano"],
};

/** تشخیص قطعی نام کوین؛ مدل فقط وقتی لازم است که اسم صریح نبود (غلط املایی و ...) */
export function detectCoin(text: string): Coin | null {
  const t = prep(text);
  let best: { coin: Coin; idx: number } | null = null;
  for (const [coin, names] of Object.entries(ALIASES) as [Coin, string[]][]) {
    for (const n of names) {
      const idx = /^[a-z]+$/.test(n)
        ? t.search(new RegExp(`(?<![a-z])${n}(?![a-z])`))
        : t.indexOf(n);
      if (idx >= 0 && (!best || idx < best.idx)) best = { coin, idx };
    }
  }
  return best?.coin ?? null;
}

const WORDS: Record<string, number> = {
  یک: 1, یکی: 1, نیم: 0.5, دو: 2, سه: 3, چهار: 4, پنج: 5,
  ده: 10, بیست: 20, پنجاه: 50, صد: 100, هزار: 1000,
  one: 1, half: 0.5, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  twenty: 20, fifty: 50, hundred: 100, thousand: 1000,
};
const PERCENT_WORDS: Record<string, number> = {
  همه: 100, تمام: 100, کل: 100, همش: 100, نصف: 50,
  all: 100, half: 50, entire: 100, whole: 100,
};
const USDT_RE = /^(دلار|تتر|usdt|dollar|dollars|\$)/i;

export type Amount = {
  amount: number | null;
  unit: "USDT" | "BASE" | null;
  price: number | null;
  percent: number | null;
};

export function extractAmount(raw: string): Amount {
  let t = prep(raw).replace(/(\d),(?=\d{3}(?!\d))/g, "$1");

  let price: number | null = null;
  const pm = t.match(/(?:به قیمت|با قیمت|قیمت|price|at|@)\s*(\d+(?:\.\d+)?)/);
  if (pm) {
    price = Number(pm[1]) || null;
    t = t.replace(pm[0], " ");
  }
  const none: Amount = { amount: null, unit: null, price, percent: null };

  const pc = t.match(/(\d+(?:\.\d+)?)\s*(?:درصد|%|percent)/);
  if (pc) {
    const p = Number(pc[1]);
    return { ...none, percent: p > 0 && p <= 100 ? p : null };
  }

  let m = t.match(/\$\s*(\d+(?:\.\d+)?)/);
  if (m) return { ...none, amount: Number(m[1]) || null, unit: "USDT" };

  m = t.match(/(\d+(?:\.\d+)?)\s*(دلار|تتر|usdt|dollar|dollars|\$)?/i);
  if (m) {
    const n = Number(m[1]);
    return n > 0 ? { ...none, amount: n, unit: m[2] ? "USDT" : "BASE" } : none;
  }

  const tokens = t.split(" ");
  for (const tok of tokens) {
    const p = PERCENT_WORDS[tok];
    if (p) return { ...none, percent: p };
  }
  for (const [i, tok] of tokens.entries()) {
    const w = WORDS[tok];
    if (w) return { ...none, amount: w, unit: USDT_RE.test(tokens[i + 1] ?? "") ? "USDT" : "BASE" };
  }
  return none;
}

export const mentionsDollar = (text: string) => /(دلار|تتر|usdt|dollar|dollars|usd|\$)/i.test(prep(text));
