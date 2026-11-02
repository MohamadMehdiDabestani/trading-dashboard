import { z } from "zod";
import { SYMBOLS } from "@repo/types";

const symbolValues = SYMBOLS.map((s) => s.value) as [string, ...string[]];

export const IntentSchema = z.object({
  intent: z
    .enum([
      "BUY",
      "SELL",
      "QUICK_BUY",
      "QUICK_SELL",
      "BALANCE",
      "OPEN_ORDERS",
      "HOWTO",
      "PRICE",
      "PORTFOLIO",
      "CANCEL",
      "UNKNOWN",
    ])
    .catch("UNKNOWN"),
  symbol: z.enum(symbolValues).nullable().catch(null),
  asset: z.string().max(10).nullable().catch(null),
  amount: z.number().positive().finite().nullable().catch(null),
  amountUnit: z.enum(["USDT", "BASE"]).nullable().catch(null),
  price: z.number().positive().finite().nullable().catch(null),
  percent: z.number().positive().max(100).nullable().catch(null),
  howto: z.enum(["BUY", "SELL"]).nullable().catch(null),
});

export type ParsedIntent = z.infer<typeof IntentSchema>;