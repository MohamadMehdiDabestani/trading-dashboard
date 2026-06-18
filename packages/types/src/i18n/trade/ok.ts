

export const TRADE_SUUCEESS_CODES = [
  "ORDER_CANCELLED_SUCCESSFULLY",
] as const;

export type TradeSuccessCodes = (typeof TRADE_SUUCEESS_CODES)[number];
