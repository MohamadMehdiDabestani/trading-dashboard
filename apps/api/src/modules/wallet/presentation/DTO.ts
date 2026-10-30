import { LEDGER_ENTRY_TYPES } from "@repo/types";

export const walletDepositSchema = {
  body: {
    type: "object",
    required: ["asset", "amount"],
    properties: {
      asset: { type: "string", minLength: 2, maxLength: 10 },
      amount: { type: "string", pattern: "^[0-9.]+$" },
    },
  },
} as const;

export const walletTrendSchema = {
  querystring: {
    type: "object",
    properties: {
      range: { type: "string", enum: ["1D", "1W", "1M", "1Y"] },
    },
  },
} as const;

export const walletAssetSchema = {
  querystring: {
    type: "object",
    properties: {
      page: { type: "string" },
      pageSize: { type: "string" },
      period: { type: "string", enum: ["1D", "1W", "1M", "1Y"] },
      // ?type=deposit&type=withdraw  (یا یک مقدار تنها)
      type: {
        type: "array",
        maxItems: 9,
        items: {
          type: "string",
          enum: [...LEDGER_ENTRY_TYPES],
        },
      },
    },
  },
} as const;

export const walletWithdrawSchema = {
  body: {
    type: "object",
    required: ["asset", "amount"],
    additionalProperties: false,
    properties: {
      asset: { type: "string", minLength: 1, maxLength: 20 },
      amount: { type: "string", pattern: "^[0-9]+(\\.[0-9]{1,18})?$" },
      address: { type: "string", minLength: 1, maxLength: 128 },
    },
  },
} as const;