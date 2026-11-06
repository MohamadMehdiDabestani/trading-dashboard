import "server-only";
import OpenAI from "openai";
import { detectCoin } from "./extract";

export type Pick = { value: string; confidence: number };
export type Classification = { intent: Pick; side: Pick; coin: Pick };

export interface Classifier {
  classify(text: string): Promise<Classification>;
}

const QUESTIONS = {
  intent: {
    type: "choice",
    instructions:
      "What does this crypto spot-exchange user want? The message is in Persian or English.",
    criteria: {
      TRADE:
        "wants to buy or sell a coin with a normal order, e.g. 'میخوام بیت کوین بخرم', '100 دلار اتریوم بفروشم', 'btc بخرم', 'buy $100 btc', 'sell eth'",
      QUICK_TRADE:
        "wants an immediate market order: words like سریع, فوری, مارکت, به قیمت بازار, تبدیل سریع, market, quick, instant, instantly, fast",
      BALANCE:
        "asks how much of ONE coin or of dollars/USDT they own: 'چقدر بیت کوین دارم', 'چند دلار دارم', 'موجودی من چقدره', 'how much btc do I have', 'my balance'",
      OPEN_ORDERS:
        "asks about their own open or pending orders: 'اوردر های باز من', 'سفارش باز اتریوم', 'my open orders', 'list open orders'",
      HOWTO:
        "asks HOW to buy or sell and wants instructions, not to place an order: 'چطوری بیت کوین بخرم', 'how to buy btc', 'how do I sell eth'",
      PRICE:
        "asks the current price of a coin: 'قیمت بیت کوین چنده', 'اتریوم الان چنده', 'btc price', 'price of eth', 'solana price'",
      PORTFOLIO:
        "asks the total value of ALL their holdings: 'ارزش کل دارایی من', 'پورتفوی من چقدره', 'portfolio value', 'total balance worth'",
      CANCEL:
        "wants to cancel or close an open order: 'اوردر بیت کوینم رو کنسل کن', 'لغو سفارش', 'cancel my order', 'cancel btc order'",
      UNKNOWN: "anything else: greetings, unrelated chat",
    },
  },
  side: {
    type: "choice",
    instructions:
      "Is the user buying or selling? If the message is not about trading, choose BUY.",
    criteria: {
      BUY: "خرید, بخرم, بخر, buy, purchase; converting tether/dollars into a coin",
      SELL: "فروش, بفروشم, بفروش, sell; converting a coin into tether/dollars",
    },
  },
  coin: {
    type: "choice",
    instructions: "Which coin is the message about?",
    criteria: {
      BTC: "بیت کوین, بیتکوین, btc, bitcoin",
      ETH: "اتریوم, اتر, eth, ethereum",
      BNB: "بایننس کوین, بی ان بی, bnb, binance",
      SOL: "سولانا, سول, sol, solana",
      XRP: "ریپل, xrp, ripple",
      ADA: "کاردانو, ada, cardano",
      USDT: "ONLY when asking about the user's own dollar/tether balance, e.g. 'چند دلار دارم', 'my usd balance'. NOT when 'دلار' or '$' is just the unit of an amount",
      NONE: "no specific coin is mentioned",
    },
  },
} as const;

/**
 * Fast deterministic heuristic classifier for English & Persian.
 * Used as a zero-latency fallback whenever LLM is unavailable or offline.
 */
export function heuristicClassify(text: string): Classification {
  const t = text.toLowerCase();
  const coin = detectCoin(text) ?? "NONE";

  let side = "BUY";
  if (/(sell|بفروش|بفروشم|فروش)/i.test(t)) {
    side = "SELL";
  }

  let intent = "UNKNOWN";
  if (/(how to|how do i|چطوری|چطور|آموزش)/i.test(t)) {
    intent = "HOWTO";
  } else if (/(cancel|لغو|کنسل)/i.test(t)) {
    intent = "CANCEL";
  } else if (
    /(portfolio|پورتفو|ارزش دارایی|کل دارایی|total asset|portfolio value|net worth)/i.test(
      t,
    )
  ) {
    intent = "PORTFOLIO";
  } else if (/(open order|اوردر.*باز|سفارش.*باز|open.*trade|active.*order)/i.test(t)) {
    intent = "OPEN_ORDERS";
  } else if (/(price|قیمت|چنده|چند است|worth)/i.test(t)) {
    intent = "PRICE";
  } else if (
    /(balance|موجودی|چقدر.*دارم|چند دلار|how much.*have|how many.*have|my usd|my tether)/i.test(
      t,
    )
  ) {
    intent = "BALANCE";
  } else if (
    /(quick|fast|instant|مارکت|سریع|فوری)/i.test(t) &&
    /(buy|sell|بخر|بفروش|خرید|فروش)/i.test(t)
  ) {
    intent = "QUICK_TRADE";
  } else if (/(buy|purchase|sell|بخر|بخرم|خرید|بفروش|بفروشم|فروش)/i.test(t)) {
    intent = "TRADE";
  }

  return {
    intent: { value: intent, confidence: intent === "UNKNOWN" ? 0 : 0.95 },
    side: { value: side, confidence: 0.95 },
    coin: { value: coin, confidence: coin === "NONE" ? 0 : 0.95 },
  };
}

/** TypeSafe JEV (BeatAPI): POST {LLM_BASE_URL} با body ‏{model,state,questions} */
class JevClassifier implements Classifier {
  async classify(text: string): Promise<Classification> {
    try {
      const url = (process.env.LLM_BASE_URL ?? "").replace(/\/+$/, "");
      if (!url || !process.env.LLM_API_KEY) {
        return heuristicClassify(text);
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL,
          state: text,
          questions: QUESTIONS,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        console.warn(
          "[assistant] JEV status",
          res.status,
          "- falling back to heuristic classifier",
        );
        return heuristicClassify(text);
      }

      const { answers } = (await res.json()) as {
        answers: Record<string, { choice: string; confidence: number }>;
      };
      const pick = (k: keyof typeof QUESTIONS): Pick => ({
        value: answers?.[k]?.choice ?? "",
        confidence: answers?.[k]?.confidence ?? 0,
      });
      return { intent: pick("intent"), side: pick("side"), coin: pick("coin") };
    } catch (e) {
      console.warn("[assistant] JEV classifier network error, using fallback:", e);
      return heuristicClassify(text);
    }
  }
}

/** OpenAI رسمی (یا هر سرویس سازگار که json_schema را پشتیبانی کند) */
const SYSTEM_PROMPT =
  "You classify messages from a user of a crypto spot exchange (Persian or English). " +
  "Answer every field. Never guess a coin that is not mentioned: use NONE.\n\n" +
  Object.entries(
    QUESTIONS as unknown as Record<
      string,
      { instructions: string; criteria: Record<string, string> }
    >,
  )
    .map(
      ([k, q]) =>
        `${k}: ${q.instructions}\n` +
        Object.entries(q.criteria)
          .map(([o, d]) => `- ${o}: ${d}`)
          .join("\n"),
    )
    .join("\n\n");

class OpenAIClassifier implements Classifier {
  private client = new OpenAI({
    apiKey: process.env.LLM_API_KEY || "missing",
    baseURL: process.env.LLM_BASE_URL || undefined,
    timeout: 10_000,
    maxRetries: 1,
  });

  async classify(text: string): Promise<Classification> {
    try {
      if (!process.env.LLM_API_KEY) {
        return heuristicClassify(text);
      }

      const res = await this.client.chat.completions.create({
        model: process.env.LLM_MODEL ?? "gpt-4o-mini",
        temperature: 0,
        max_tokens: 60,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "classification",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["intent", "side", "coin"],
              properties: {
                intent: {
                  type: "string",
                  enum: Object.keys(QUESTIONS.intent.criteria),
                },
                side: {
                  type: "string",
                  enum: Object.keys(QUESTIONS.side.criteria),
                },
                coin: {
                  type: "string",
                  enum: Object.keys(QUESTIONS.coin.criteria),
                },
              },
            },
          },
        },
      });

      let o: Partial<Record<"intent" | "side" | "coin", string>> = {};
      try {
        o = JSON.parse(res.choices[0]?.message?.content ?? "{}");
      } catch {
        /* UNKNOWN */
      }
      const pick = (v?: string, fallback = ""): Pick => ({
        value: v ?? fallback,
        confidence: v ? 1 : 0,
      });
      return {
        intent: pick(o.intent, "UNKNOWN"),
        side: pick(o.side, "BUY"),
        coin: pick(o.coin, "NONE"),
      };
    } catch (e) {
      console.warn("[assistant] OpenAI classifier error, using fallback:", e);
      return heuristicClassify(text);
    }
  }
}

let instance: Classifier | null = null;

/** LLM_PROVIDER=openai | jev (پیش‌فرض) */
export function getClassifier(): Classifier {
  return (instance ??=
    process.env.LLM_PROVIDER === "openai"
      ? new OpenAIClassifier()
      : new JevClassifier());
}
