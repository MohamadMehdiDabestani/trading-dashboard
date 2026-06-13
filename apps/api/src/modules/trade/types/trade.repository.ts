import { GetRecentTradesReply, MatchResult, OrderType, Side } from "@repo/types";

export interface TradeRepository {
  createOrder(
    userId: string,
    symbol: string,
    baseAsset: string,
    quoteAsset: string,
    side: Side,
    type: OrderType,
    price: bigint,
    quantity: bigint,
  ): Promise<{ orderId: string; matchResult: MatchResult }>;


  cancelOrder(
    userId: string,
    symbol: string,
    orderId: string,
  ): Promise<MatchResult>;

  getRecentOrders(
    symbol: string,
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<GetRecentTradesReply>;
}
