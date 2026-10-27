import { OrderType, Side } from "../trading/order";

export interface CreateOrderDTO {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  side: Side;
  type: OrderType;
  price: string;
  quantity: string;
}

export interface CancelOrderDTO {
  symbol: string;
  orderId: string;
}
