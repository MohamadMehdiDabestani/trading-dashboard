import "server-only";
import OpenAI from "openai";

export type Pick = { value: string; confidence: number };
export type Classification = { intent: Pick; side: Pick; coin: Pick };

export interface Classifier {
  classify(text: string): Promise<Classification>;
}

const QUESTIONS = {
  intent: {
    type: "choice",
    instructions:
      "What does this crypto spot-exchange user want? The message is usually Persian, sometimes English.",
    criteria: {
      TRADE:
        "wants to buy or sell a coin with a normal order, e.g. 'میخوام بیت کوین بخرم', '100 دلار اتریوم بفروشم', 'btc بخرم'",
      QUICK_TRADE:
        "wants an immediate market order: words like سریع, فوری, مارکت, به قیمت بازار, تبدیل سریع",
      BALANCE:
        "asks how much of ONE coin or of dollars/USDT they own: 'چقدر بیت کوین دارم', 'چند دلار دارم', 'موجودی من چقدره'",
      OPEN_ORDERS:
        "asks about their own open or pending orders: 'اوردر های باز من', 'سفارش باز اتریوم'",
      HOWTO:
        "asks HOW to buy or sell and wants instructions, not to place an order: 'چطوری بیت کوین بخرم', 'چطوری 100 دلار بیت کوین بخرم'",
      PRICE:
        "asks the current price of a coin: 'قیمت بیت کوین چنده', 'اتریوم الان چنده'",
      PORTFOLIO:
        "asks the total value of ALL their holdings: 'ارزش کل دارایی من', 'پورتفوی من چقدره'",
      CANCEL:
        "wants to cancel or close an open order: 'اوردر بیت کوینم رو کنسل کن', 'لغو سفارش'",
      UNKNOWN: "anything else: greetings, unrelated chat",
    },
  },
  side: {
    type: "choice",
    instructions:
      "Is the user buying or selling? If the message is not about trading, choose BUY.",
    criteria: {
      BUY: "خرید, بخرم, بخر, buy; converting tether/dollars into a coin",
      SELL: "فروش, بفروشم, بفروش, sell; converting a coin into tether/dollars",
    },
  },
  coin: {
    type: "choice",
    instructions: "Which coin is the message about?",
    criteria: {
      BTC: "بیت کوین, بیتکوین, btc",
      ETH: "اتریوم, اتر, eth",
      BNB: "بایننس کوین, بی ان بی, bnb",
      SOL: "سولانا, سول, sol",
      XRP: "ریپل, xrp",
      ADA: "کاردانو, ada",
      USDT: "ONLY when asking about the user's own dollar/tether balance, e.g. 'چند دلار دارم'. NOT when 'دلار' is just the unit of an amount",
      NONE: "no specific coin is mentioned",
    },
  },
} as const;

/** TypeSafe JEV (BeatAPI): POST {LLM_BASE_URL} با body ‏{model,state,questions} */
class JevClassifier implements Classifier {
  async classify(text: string): Promise<Classification> {
    // LLM_BASE_URL خودش endpoint کامل است (BeatAPI: https://api.beatapi.io/v1/systemone)
    const url = (process.env.LLM_BASE_URL ?? "").replace(/\/+$/, "");

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
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.error(
        "[assistant] JEV",
        res.status,
        (await res.text()).slice(0, 300),
      );
      throw new Error(`JEV ${res.status}`);
    }

    const { answers } = (await res.json()) as {
      answers: Record<string, { choice: string; confidence: number }>;
    };
    const pick = (k: keyof typeof QUESTIONS): Pick => ({
      value: answers?.[k]?.choice ?? "",
      confidence: answers?.[k]?.confidence ?? 0,
    });
    return { intent: pick("intent"), side: pick("side"), coin: pick("coin") };
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
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_BASE_URL || undefined, // خالی = api.openai.com
    timeout: 15_000,
    maxRetries: 1,
  });

  async classify(text: string): Promise<Classification> {
    const res = await this.client.chat.completions.create({
      model: process.env.LLM_MODEL ?? "gpt-4o-mini",
      temperature: 0,
      max_tokens: 60,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      // مدل فقط می‌تواند یکی از مقدارهای مجاز را برگرداند
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
    // مدل chat احتمال (probability) نمی‌دهد؛ اعتبارسنجی نهایی با enum و کارت تأیید است
    const pick = (v?: string, fallback = ""): Pick => ({
      value: v ?? fallback,
      confidence: v ? 1 : 0,
    });
    return {
      intent: pick(o.intent, "UNKNOWN"),
      side: pick(o.side, "BUY"),
      coin: pick(o.coin, "NONE"),
    };
  }
}

let instance: Classifier | null = null;

/** LLM_PROVIDER=openai (پیش‌فرض) | jev */
export function getClassifier(): Classifier {
  return (instance ??=
    process.env.LLM_PROVIDER === "jev"
      ? new JevClassifier()
      : new OpenAIClassifier());
}
