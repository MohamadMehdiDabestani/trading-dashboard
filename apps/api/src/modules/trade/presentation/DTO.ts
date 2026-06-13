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
    required: ["symbol" , "orderId"],
    properties: {
      symbol: { type: "string" },
      orderId: { type: "string", format: "uuid" }, // چک کردن صحت UUID
    },
  },
} as const;

export const getRecentTradeSchema = {
  querystring: {
    type: "object",
    required: ["symbol"],
    properties: {
      symbol: { type: "string" },
      limit: { type: "number", default: 50 },
    },
  },
} as const;
