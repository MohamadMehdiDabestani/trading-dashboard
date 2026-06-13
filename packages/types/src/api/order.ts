import Big from "big.js";
import { PaginatedResult } from "../common";

export interface GetRecentTradesReply extends PaginatedResult<{
  id: string;
  type: string;
  symbol: string;
  price: Big | null;
  quantity: Big;
  filledQuantity: Big;
  createdAt: Date;
}> {}

export interface CreateOrderReply {
  orderId : string,
  status : string
}

export type CancelOrderReply = string 