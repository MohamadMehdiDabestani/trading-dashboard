
export type MarketTradeEvent = {
  symbol: string;
  price: string;
  quantity: string;
  buyOrderId: string;
  sellOrderId: string;
  timestamp: number;
};
type OrderBookLevelDelta = {
  side: "bid" | "ask";
  price: string;
  quantity: string;
}
export type OrderBookDeltaEvent = {
  symbol: string;
  deltas: OrderBookLevelDelta[];
};

export type MarketEvent =
  | { type: "trade"; data: MarketTradeEvent }
  | { type: "orderbook_delta"; data: OrderBookDeltaEvent };