import { PaginatedResult } from "../common";
import { OrderStatus, Side } from "../trading/order";

export interface GetRecentTradesReply extends PaginatedResult<{
  id: string;
  type: string;
  symbol: string;
  side: Side;
  status: OrderStatus;
  price: string;
  quantity: string;
  filledQuantity: string;
  createdAt: Date;
}> {}

export interface CreateOrderReply {
  orderId: string;
  status: string;
}

export type CancelOrderReply = string;
