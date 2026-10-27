import { ValueOrderStatus , ValueOrderSortField ,ValueSortDirection} from "@repo/types";

export const createOrderSchema = {
  description: "Submit a new spot order",
  body: {
    type: "object",
    required: ["symbol", "side", "type", "quantity", "baseAsset", "quoteAsset"],
    properties: {
      symbol: { type: "string", minLength: 3 }, // e.g. BTCUSDT
      baseAsset: { type: "string" }, // e.g. BTC
      quoteAsset: { type: "string" }, // e.g. USDT
      side: { type: "string", enum: ["buy", "sell"] },
      type: { type: "string", enum: ["limit", "market"] },
      quantity: { type: "string", pattern: "^[0-9.]+$" },
      price: { type: "string", pattern: "^[0-9.]+$" },
    },
    if: {
      properties: { type: { const: "limit" } },
    },
    then: {
      required: ["price"],
    },
  },
} as const;

export const cancelOrderSchema = {
  description: "Cancel an open order",

  body: {
    type: "object",
    required: ["symbol", "orderId"],
    properties: {
      symbol: { type: "string" },
      orderId: { type: "string", format: "uuid" }, // چک کردن صحت UUID
    },
  },
} as const;

export const getRecentTradeSchema = {
  querystring: {
    type: "object",
    properties: {
      symbol: { type: "string", minLength: 1, maxLength: 20 },
      status: { type: "string", enum: ValueOrderStatus },
      page: { type: "integer", minimum: 1, default: 1 },
      pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      sortBy: { type: "string" , enum: ValueOrderSortField},
      sortOrder: { type: "string" , enum: ValueSortDirection},
    },
    additionalProperties: false,
  },
} as const;

export const getOpenPositionsSchema = {
  querystring: {
    type: "object",
    properties: {
      search: { type: "string", minLength: 0, maxLength: 50 },
    },
  },
} as const;
