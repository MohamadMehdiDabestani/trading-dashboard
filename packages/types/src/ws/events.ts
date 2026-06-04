export interface TradeEvent {
  symbol: string;
  price: number;
  quantity: number;
  timestamp: number;
}

export interface OrderbookLevel {
  price: number;
  quantity: number;
}
