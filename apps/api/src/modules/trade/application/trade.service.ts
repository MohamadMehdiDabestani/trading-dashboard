import {
  Side,
  OrderType,
  MatchResult,
  GetRecentTradesReply,
} from "@repo/types";
import { TradeRepositoryDrizzle } from "../infrastructure/repositories/trade.drizzle";
import { TradeRepository } from "../types/trade.repository";
import { AppError } from "@/errors/appError";

export class TradeService implements TradeRepository {
  constructor(private trade: TradeRepositoryDrizzle) {}
  async createOrder(
    userId: string,
    symbol: string,
    baseAsset: string,
    quoteAsset: string,
    side: Side,
    type: OrderType,
    price: bigint,
    quantity: bigint,
  ): Promise<{ orderId: string; matchResult: MatchResult }> {
    try {
      const res = await this.trade.createOrder(
        userId,
        symbol,
        baseAsset,
        quoteAsset,
        side,
        type,
        price,
        quantity,
      );
      return res;
    } catch (error) {
      throw new AppError("INTERNAL_SERVER_ERROR");
    }
  }
  async cancelOrder(
    userId: string,
    symbol: string,
    orderId: string,
  ): Promise<MatchResult> {
    const res = await this.trade.cancelOrder(userId, symbol, orderId);
    return res;
  }
  async getRecentOrders(
    symbol: string,
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<GetRecentTradesReply> {
    try {
      const res = await this.trade.getRecentOrders(
        symbol,
        userId,
        page,
        pageSize,
      );
      return res;
    } catch (error) {
      console.log(error);
      throw new AppError("INTERNAL_SERVER_ERROR");
    }
  }
}
