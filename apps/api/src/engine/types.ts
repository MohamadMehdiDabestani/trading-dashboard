export type Side = "buy" | "sell";
export type OrderType = "limit" | "market";
export type OrderStatus = "open" | "partial" | "filled" | "cancelled";

export const SCALE = 10n ** 18n;

export interface EngineOrder {
  id: string;
  userId: string;
  symbol: string;
  side: Side;
  type: OrderType;
  price: bigint;       // scaled by SCALE (0 for market orders)
  quantity: bigint;    // scaled by SCALE
  filled: bigint;      // scaled by SCALE
  timestamp: number;
}

export interface EngineTrade {
  id: string;
  symbol: string;
  makerOrderId: string;
  takerOrderId: string;
  buyOrderId: string;
  sellOrderId: string;
  buyerId: string;
  sellerId: string;
  price: bigint;
  quantity: bigint;
  quoteQuantity: bigint;
  executedAt: Date;
}

export interface FilledOrderUpdate {
  orderId: string;
  filled: bigint;
  status: OrderStatus;
}

export interface MatchResult {
  trades: EngineTrade[];
  updates: FilledOrderUpdate[];
}

export interface PriceLevel {
  price: bigint;
  orders: EngineOrder[];   // FIFO queue — index 0 is oldest
}

export interface OrderBookSnapshot {
  symbol: string;
  bids: { price: string; quantity: string }[];
  asks: { price: string; quantity: string }[];
  timestamp: number;
}
