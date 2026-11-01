import { DbTransaction, orders } from "@repo/db";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  lt,
  SQL,
  sql,
} from "drizzle-orm";
import {
  OrderStatus,
  OrderType,
  Side,
  OrderSortField,
  SortDirection,
} from "@repo/types";
import { toDbDecimal } from "@/utils/scaleBigInt";
import { applyPagination } from "@/utils/pagination";
import { PgColumn } from "drizzle-orm/pg-core";

const ORDER_SORT_COLUMNS: Record<OrderSortField, PgColumn> = {
  createdAt: orders.createdAt,
  symbol: orders.symbol,
  type: orders.type,
  side: orders.side,
  status: orders.status,
  price: orders.price,
  quantity: orders.quantity,
  filledQuantity: orders.filledQuantity,
} as const;

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
      updates.map(
        (u) => sql`WHEN ${orders.id} = ${u.orderId} THEN ${u.status}`,
      ),
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

  /** سفارش‌های فعال یک symbol؛ برای بازسازی بوک engine از DB */
  async getActiveOrdersBySymbol(symbol: string) {
    return this.db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.symbol, symbol),
          inArray(orders.status, ["open", "partial"]),
        ),
      )
      .orderBy(asc(orders.createdAt));
  }

  async getRecentOrders(params: {
    userId: string;
    symbol?: string;
    status?: OrderStatus[];
    page: number;
    pageSize: number;
    sortBy?: OrderSortField;
    sortOrder?: SortDirection;
  }) {
    const {
      userId,
      symbol,
      status,
      page,
      pageSize,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const sortColumn = ORDER_SORT_COLUMNS[sortBy] ?? orders.createdAt;
    const direction = sortOrder === "asc" ? asc : desc;

    const filters: SQL[] = [eq(orders.userId, userId)];

    if (symbol) filters.push(eq(orders.symbol, symbol.toUpperCase()));

    if (status?.length) {
      filters.push(inArray(orders.status, status));
    }

    const where = and(...filters);

    const query = this.db
      .select({
        id: orders.id,
        type: orders.type,
        side: orders.side,
        symbol: orders.symbol,
        status: orders.status,
        price: sql<string>`trim_scale(${orders.price})::text`,
        quantity: sql<string>`trim_scale(${orders.quantity})::text`,
        filledQuantity: sql<string>`trim_scale(${orders.filledQuantity})::text`,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(where)
      // id as tie-breaker => stable ordering between pages
      .orderBy(direction(sortColumn), desc(orders.id));

    const [items, totalRows] = await Promise.all([
      applyPagination(query.$dynamic(), page, pageSize),
      this.db.select({ value: count() }).from(orders).where(where),
    ]);

    const total = Number(totalRows[0]?.value ?? 0);

    return {
      items,
      page,
      pageSize,
      total,
      totalPage: Math.ceil(total / pageSize),
    };
  }
  async getFinishedStats(userId: string, from?: Date, to?: Date) {
    const rows = await this.db
      .select({ status: orders.status, n: count() })
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          inArray(orders.status, ["filled", "cancelled"]),
          from ? gte(orders.createdAt, from) : undefined,
          to ? lt(orders.createdAt, to) : undefined,
        ),
      )
      .groupBy(orders.status);

    const filled = Number(rows.find((r: any) => r.status === "filled")?.n ?? 0);
    const cancelled = Number(
      rows.find((r: any) => r.status === "cancelled")?.n ?? 0,
    );
    return { filled, total: filled + cancelled };
  }
}
