import { OrderType, Side } from "../trading/order";

export interface CreateOrderDTO {
  userId: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  side: Side;
  type: OrderType;
  price: bigint;
  quantity: bigint;
}

export interface CancelOrderDTO {
  userId: string;
  symbol: string;
  orderId: string;
}
