import { orders } from "@repo/db";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { GetRecentTradesReply, OrderType, Side } from "@repo/types";
import { toDbDecimal } from "@/utils/scaleBigInt";
import { applyPagination } from "@/utils/pagination";
import { DbTransaction } from "../../types/unitOfWork.repository";

export class OrderTxRepository {
  constructor(private readonly tx: DbTransaction) {}

  async createOpenOrder(input: {
    id: string;
    userId: string;
    symbol: string;
    side: Side;
    type: OrderType;
    price: bigint;
    quantity: bigint;
  }) {
    await this.tx.insert(orders).values({
      id: input.id,
      userId: input.userId,
      symbol: input.symbol,
      side: input.side,
      type: input.type,
      price: sql`${toDbDecimal(input.price)}`,
      quantity: sql`${toDbDecimal(input.quantity)}`,
      status: "open",
    });
  }

  async getOrderOwner(orderId: string): Promise<{
    id: string;
    userId: string;
    symbol: string;
    status: string;
  } | null> {
    const row = await this.tx
      .select({
        id: orders.id,
        userId: orders.userId,
        symbol: orders.symbol,
        status: orders.status,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .then((res) => res[0]);

    return row ?? null;
  }

  async markCancelled(orderId: string) {
    await this.tx
      .update(orders)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
  }

  async batchUpdateFilledAndStatus(
    updates: Array<{
      orderId: string;
      filled: bigint;
      status: string;
    }>,
  ) {
    if (updates.length === 0) return;

    const orderIds = updates.map((u) => u.orderId);

    const filledCase = sql.join(
      updates.map(
        (u) =>
          sql`WHEN ${orders.id} = ${u.orderId} THEN ${toDbDecimal(u.filled)}`,
      ),
      sql` `,
    );

    const statusCase = sql.join(
      updates.map((u) => sql`WHEN ${orders.id} = ${u.orderId} THEN ${u.status}`),
      sql` `,
    );

    await this.tx
      .update(orders)
      .set({
        filledQuantity: sql`CASE ${filledCase} ELSE ${orders.filledQuantity} END`,
        status: sql`CASE ${statusCase} ELSE ${orders.status} END`,
        updatedAt: new Date(),
      })
      .where(inArray(orders.id, orderIds));
  }

  async getOrderRowsByIds(orderIds: string[]) {
    if (orderIds.length === 0) return [];

    return this.tx
      .select({
        id: orders.id,
        side: orders.side,
        price: orders.price,
        status: orders.status,
      })
      .from(orders)
      .where(inArray(orders.id, orderIds));
  }
}


export class OrderReadRepository {
  constructor(private readonly db: any) {}

  async getRecentOrders(
    symbol: string,
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<GetRecentTradesReply> {
    const historyQuery = this.db
      .select({
        id: orders.id,
        type: orders.type,
        symbol: orders.symbol,
        price: orders.price,
        quantity: orders.quantity,
        filledQuantity: orders.filledQuantity,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(and(eq(orders.symbol, symbol), eq(orders.userId, userId)))
      .orderBy(desc(orders.createdAt));

    const [list, totalRows] = await Promise.all([
      applyPagination(historyQuery.$dynamic(), page, pageSize),
      this.db
        .select({ value: count() })
        .from(orders)
        .where(and(eq(orders.symbol, symbol), eq(orders.userId, userId))),
    ]);

    const total = Number(totalRows[0]?.value ?? 0);

    return {
      items: list,
      page,
      pageSize,
      total,
      totalPage: Math.ceil(total / pageSize),
    };
  }
}
