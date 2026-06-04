import { OrderSide, OrderType } from "../trading/order";

export interface CreateOrderRequest {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price?: number;
  quantity: number;
}

export interface CreateOrderResponse {
  orderId: string;
  status: string;
}
