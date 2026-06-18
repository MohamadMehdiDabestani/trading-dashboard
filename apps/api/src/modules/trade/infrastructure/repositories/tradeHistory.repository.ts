import { DbTransaction, trades } from "@repo/db";
import { sql } from "drizzle-orm";
import { toDbDecimal } from "@/utils/scaleBigInt";

export class TradeHistoryTxRepository {
  constructor(private readonly tx: DbTransaction) {}

  async insertMany(items: Array<{
    id: string;
    symbol: string;
    buyOrderId: string;
    sellOrderId: string;
    buyerId: string;
    sellerId: string;
    price: bigint;
    quantity: bigint;
    quoteQuantity: bigint;
    executedAt: Date;
  }>) {
    if (items.length === 0) return;

    await this.tx.insert(trades).values(
      items.map((trade) => ({
        id: trade.id,
        symbol: trade.symbol,
        buyOrderId: trade.buyOrderId,
        sellOrderId: trade.sellOrderId,
        buyerId: trade.buyerId,
        sellerId: trade.sellerId,
        price: sql`${toDbDecimal(trade.price)}`,
        quantity: sql`${toDbDecimal(trade.quantity)}`,
        quoteQuantity: sql`${toDbDecimal(trade.quoteQuantity)}`,
        executedAt: trade.executedAt,
      })),
    );
  }
}
