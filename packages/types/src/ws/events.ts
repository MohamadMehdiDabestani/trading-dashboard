import { OrderBookLevelDelta } from "../trading/order";

export type MarketTradeEvent = {
  symbol: string;
  price: string;
  quantity: string;
  buyOrderId: string;
  sellOrderId: string;
  timestamp: number;
};

export type OrderBookDeltaEvent = {
  symbol: string;
  deltas: OrderBookLevelDelta[];
};

export type MarketEvent =
  | { type: "trade"; data: MarketTradeEvent }
  | { type: "orderbook_delta"; data: OrderBookDeltaEvent };