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
  price: bigint; // scaled by SCALE (0 for market orders)
  quantity: bigint; // scaled by SCALE
  filled: bigint; // scaled by SCALE
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

export type OrderBookLevelDelta = {
  side: "bid" | "ask";
  price: bigint;
  quantity: bigint;
};

export type OrderBookDelta = {
  symbol: string;
  bids: OrderBookLevelDelta[];
  asks: OrderBookLevelDelta[];
};


export interface MatchResult {
  trades: EngineTrade[];
  updates: FilledOrderUpdate[];
  deltas: OrderBookLevelDelta[];
}

export interface PriceLevel {
  price: bigint;
  orders: EngineOrder[]; // FIFO queue — index 0 is oldest
  totalQuantity: bigint; // اضافه شد

}

export interface OrderBookSnapshot {
  symbol: string;
  bids: { price: string; quantity: string }[];
  asks: { price: string; quantity: string }[];
  timestamp: number;
}


export interface UserBalance {
  available: bigint; // مقیاس شده با SCALE (10^18)
  locked: bigint;    // مقیاس شده با SCALE (10^18)
}

export interface SpotSymbolInfo {
  symbol: string;     // مانند "BTCUSDT"
  baseAsset: string;  // مانند "BTC"
  quoteAsset: string; // مانند "USDT"
  minQty: bigint;     // حداقل مقدار مجاز خرید/فروش (scaled)
}