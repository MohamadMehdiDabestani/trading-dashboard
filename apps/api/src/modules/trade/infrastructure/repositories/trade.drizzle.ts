import { randomUUID } from "crypto";
import {
  balances,
  orders,
  trades,
  walletLocks,
  ledgerEntries,
  type Db,
} from "@repo/db";
import { and, count, desc, eq, inArray, or, sql } from "drizzle-orm";
import {
  EngineOrder,
  GetRecentTradesReply,
  MatchResult,
  OrderType,
  SCALE,
  Side,
} from "@repo/types";
import { MatchingEngine } from "@/engine";
import { MarketEventBus } from "@/utils/eventBus";
import Big from "big.js";
import {
  dbDecimalToScaledBigInt,
  fromScale,
  toDbDecimal,
} from "@/utils/scaleBigInt";
import { AppError } from "@/errors/appError";
import { applyPagination } from "@/utils/pagination";
import { TradeRepository } from "../../types/trade.repository";
type Delta = { available: bigint; locked: bigint };

type DeltaRow = {
  userId: string;
  asset: string;
  available: string;
  locked: string;
};
type LedgerDraft = {
  userId: string;
  asset: string;
  amount: bigint;
  type: "trade_buy" | "trade_sell" | "fee" | "unlock";
  refType: "close_trade" | "order";
  refId: string;
  balanceBefore?: bigint;
  balanceAfter?: bigint;
  meta?: Record<string, unknown> | null;
};
export class TradeRepositoryDrizzle implements TradeRepository {
  constructor(
    private db: Db,
    private engine: MatchingEngine,
    private eventBus: MarketEventBus,
  ) {}
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

  // 10 / 10000 = 0.1%
  private readonly FEE_RATE_MAKER = 10n;
  private readonly FEE_RATE_TAKER = 10n;

  async createOrder(
    userId: string,
    symbol: string,
    baseAsset: string,
    quoteAsset: string,
    side: Side,
    type: OrderType,
    price: bigint,
    quantity: bigint,
  ) {
    const orderId = randomUUID();

    const lockAsset = side === "buy" ? quoteAsset : baseAsset;
    const lockAmount = side === "buy" ? (price * quantity) / SCALE : quantity;
    const lockAmountDecimal = new Big(lockAmount.toString()).div(
      new Big(SCALE.toString()),
    );

    await this.db.transaction(async (tx) => {
      const userBalance = await tx
        .select()
        .from(balances)
        .where(and(eq(balances.userId, userId), eq(balances.asset, lockAsset)))
        .for("update")
        .then((res) => res[0]);

      if (!userBalance || userBalance.available.lt(lockAmountDecimal)) {
        throw new AppError("VALIDATION_MAX_LENGTH");
      }

      await tx
        .update(balances)
        .set({
          available: sql`${balances.available} - ${lockAmountDecimal}`,
          locked: sql`${balances.locked} + ${lockAmountDecimal}`,
          updatedAt: new Date(),
        })
        .where(eq(balances.id, userBalance.id));

      await tx.insert(walletLocks).values({
        userId,
        asset: lockAsset,
        amount: lockAmountDecimal,
        remainingAmount: lockAmountDecimal,
        reason: "open_order",
        refId: orderId,
      });

      const priceDecimal = new Big(price.toString())
        .div(new Big(SCALE.toString()))
        .toFixed();
      const quantityDecimal = new Big(quantity.toString())
        .div(new Big(SCALE.toString()))
        .toFixed();

      await tx.insert(orders).values({
        id: orderId,
        userId,
        symbol,
        side,
        type,
        price: sql`${toDbDecimal(price)}`,
        quantity: sql`${toDbDecimal(quantity)}`,
        status: "open",
      });
    });

    const engineOrder: EngineOrder = {
      id: orderId,
      userId,
      symbol,
      side,
      type,
      price,
      quantity,
      filled: 0n,
      timestamp: Date.now(),
    };

    const matchResult = this.engine.submitOrder(engineOrder);

    if (matchResult.deltas.length > 0) {
      this.eventBus.emit({
        type: "orderbook_delta",
        data: {
          symbol,
          deltas: matchResult.deltas.map((d) => ({
            side: d.side,
            price: fromScale(d.price),
            quantity: fromScale(d.quantity),
          })),
        },
      });
    }

    matchResult.trades.forEach((trade) => {
      this.eventBus.emit({
        type: "trade",
        data: {
          symbol,
          price: fromScale(trade.price),
          quantity: fromScale(trade.quantity),
          buyOrderId: trade.buyOrderId,
          sellOrderId: trade.sellOrderId,
          timestamp: trade.executedAt.getTime(),
        },
      });
    });

    this.persistMatchResult(matchResult, baseAsset, quoteAsset).catch((err) => {
      console.error("Critical Error persisting match result:", err);
    });

    return { orderId, matchResult };
  }

  async cancelOrder(userId: string, symbol: string, orderId: string) {
    const matchResult = this.engine.cancelOrder(symbol, orderId);
    if (!matchResult) throw new AppError("USER_NOTFOUND");

    await this.db.transaction(async (tx) => {
      const order = await tx
        .select({
          id: orders.id,
          userId: orders.userId,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .then((res) => res[0]);

      if (!order || order.userId !== userId)
        throw new AppError("VALIDATION_REQUIRED");

      await tx
        .update(orders)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      const lock = await tx
        .select({
          id: walletLocks.id,
          asset: walletLocks.asset,
          remainingAmount: walletLocks.remainingAmount,
          releasedAt: walletLocks.releasedAt,
        })
        .from(walletLocks)
        .where(eq(walletLocks.refId, orderId))
        .for("update")
        .then((res) => res[0]);

      if (!lock || lock.releasedAt) return;

      const remainingScaled = dbDecimalToScaledBigInt(lock.remainingAmount);
      if (remainingScaled <= 0n) {
        await tx
          .update(walletLocks)
          .set({ releasedAt: new Date(), remainingAmount: sql`0` })
          .where(eq(walletLocks.id, lock.id));
        return;
      }

      const updatedBalance = await tx
        .update(balances)
        .set({
          available: sql`${balances.available} + ${toDbDecimal(remainingScaled)}`,
          locked: sql`${balances.locked} - ${toDbDecimal(remainingScaled)}`,
          updatedAt: new Date(),
        })
        .where(and(eq(balances.userId, userId), eq(balances.asset, lock.asset)))
        .returning({ available: balances.available })
        .then((res) => res[0]);

      if (!updatedBalance) throw new AppError("INTERNAL_SERVER_ERROR");

      const afterScaled = dbDecimalToScaledBigInt(updatedBalance.available);
      const beforeScaled = afterScaled - remainingScaled;

      await tx.insert(ledgerEntries).values({
        userId,
        asset: lock.asset,
        amount: sql`${toDbDecimal(remainingScaled)}`,
        balanceBefore: sql`${toDbDecimal(beforeScaled)}`,
        balanceAfter: sql`${toDbDecimal(afterScaled)}`,
        type: "unlock",
        refType: "order",
        refId: order.id,
        meta: null,
      });

      await tx
        .update(walletLocks)
        .set({
          remainingAmount: sql`0`,
          releasedAt: new Date(),
        })
        .where(eq(walletLocks.id, lock.id));
    });

    if (matchResult.deltas.length > 0) {
      this.eventBus.emit({
        type: "orderbook_delta",
        data: {
          symbol,
          deltas: matchResult.deltas.map((d) => ({
            side: d.side,
            price: fromScale(d.price),
            quantity: fromScale(d.quantity),
          })),
        },
      });
    }

    return matchResult;
  }

  private async persistMatchResult(
    result: MatchResult,
    baseAsset: string,
    quoteAsset: string,
  ) {
    if (result.trades.length === 0 && result.updates.length === 0) return;

    await this.db.transaction(async (tx) => {
      // A) Batch update orders (filled/status)
      if (result.updates.length > 0) {
        const orderIds = result.updates.map((u) => u.orderId);

        const filledCase = sql.join(
          result.updates.map(
            (u) =>
              sql`WHEN ${orders.id} = ${u.orderId} THEN ${toDbDecimal(u.filled)}`,
          ),
          sql` `,
        );
        const statusCase = sql.join(
          result.updates.map(
            (u) => sql`WHEN ${orders.id} = ${u.orderId} THEN ${u.status}`,
          ),
          sql` `,
        );

        await tx
          .update(orders)
          .set({
            filledQuantity: sql`CASE ${filledCase} ELSE ${orders.filledQuantity} END`,
            status: sql`CASE ${statusCase} ELSE ${orders.status} END`,
            updatedAt: new Date(),
          })
          .where(inArray(orders.id, orderIds));
      }

      const deltas = new Map<string, Delta>();

      const addDelta = (
        userId: string,
        asset: string,
        availableDelta: bigint,
        lockedDelta: bigint,
      ) => {
        const key = `${userId}:${asset}`;
        const prev = deltas.get(key) ?? { available: 0n, locked: 0n };
        deltas.set(key, {
          available: prev.available + availableDelta,
          locked: prev.locked + lockedDelta,
        });
      };

      const ledgerRows: LedgerDraft[] = [];

      // wallet lock consumption per order
      // buy => consume quote by quoteQuantity, possible refund on price improvement
      // sell => consume base by quantity
      const lockConsumeByOrder = new Map<string, bigint>();
      const lockRefundByOrder = new Map<string, bigint>(); // for buy remaining due to better price

      if (result.trades.length > 0) {
        await tx.insert(trades).values(
          result.trades.map((trade) => ({
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

        for (const trade of result.trades) {
          const isBuyerMaker = trade.makerOrderId === trade.buyOrderId;
          const buyerFeeRate = isBuyerMaker
            ? this.FEE_RATE_MAKER
            : this.FEE_RATE_TAKER;
          const sellerFeeRate = isBuyerMaker
            ? this.FEE_RATE_TAKER
            : this.FEE_RATE_MAKER;

          const buyerFeeBase = (trade.quantity * buyerFeeRate) / 10000n;
          const buyerReceiveBase = trade.quantity - buyerFeeBase;

          const sellerFeeQuote = (trade.quoteQuantity * sellerFeeRate) / 10000n;
          const sellerReceiveQuote = trade.quoteQuantity - sellerFeeQuote;

          addDelta(trade.buyerId, quoteAsset, 0n, -trade.quoteQuantity);
          addDelta(trade.buyerId, baseAsset, buyerReceiveBase, 0n);
          addDelta(trade.sellerId, baseAsset, 0n, -trade.quantity);
          addDelta(trade.sellerId, quoteAsset, sellerReceiveQuote, 0n);

          // fee ledger (optional but recommended)
          if (buyerFeeBase > 0n) {
            ledgerRows.push({
              userId: trade.buyerId,
              asset: baseAsset,
              amount: -buyerFeeBase,
              type: "fee",
              refType: "close_trade",
              refId: trade.id,
              meta: { side: "buy", feeAsset: baseAsset },
            });
          }
          if (sellerFeeQuote > 0n) {
            ledgerRows.push({
              userId: trade.sellerId,
              asset: quoteAsset,
              amount: -sellerFeeQuote,
              type: "fee",
              refType: "close_trade",
              refId: trade.id,
              meta: { side: "sell", feeAsset: quoteAsset },
            });
          }

          // trade ledger
          ledgerRows.push({
            userId: trade.buyerId,
            asset: baseAsset,
            amount: buyerReceiveBase,
            type: "trade_buy",
            refType: "close_trade",
            refId: trade.id,
          });
          ledgerRows.push({
            userId: trade.sellerId,
            asset: quoteAsset,
            amount: sellerReceiveQuote,
            type: "trade_sell",
            refType: "close_trade",
            refId: trade.id,
          });

          // lock consume tracking
          lockConsumeByOrder.set(
            trade.buyOrderId,
            (lockConsumeByOrder.get(trade.buyOrderId) ?? 0n) +
              trade.quoteQuantity,
          );
          lockConsumeByOrder.set(
            trade.sellOrderId,
            (lockConsumeByOrder.get(trade.sellOrderId) ?? 0n) + trade.quantity,
          );

          // TODO:
          // price improvement refund for buy side:
          // engine باید ideally reservedQuoteDelta بدهد؛ اینجا conservative:
          // refund = (buyOrderLimitPrice * qty - executedQuote) if positive
          // چون buy price را اینجا نداریم، این refund را از updates + orders می‌گیریم پایین‌تر.
        }
      }

      const affectedOrderIds = [...lockConsumeByOrder.keys()];
      if (affectedOrderIds.length > 0) {
        const ordRows = await tx
          .select({
            id: orders.id,
            side: orders.side,
            price: orders.price,
            status: orders.status,
          })
          .from(orders)
          .where(inArray(orders.id, affectedOrderIds));

        const ordMap = new Map(
          ordRows.map((o) => [
            o.id,
            {
              side: o.side as Side,
              priceScaled: o.price,
              status: o.status,
            },
          ]),
        );

        const lockRows = await tx
          .select({
            id: walletLocks.id,
            refId: walletLocks.refId,
            userId: walletLocks.userId,
            asset: walletLocks.asset,
            remainingAmount: walletLocks.remainingAmount,
            releasedAt: walletLocks.releasedAt,
          })
          .from(walletLocks)
          .where(inArray(walletLocks.refId, affectedOrderIds))
          .for("update");

        for (const lock of lockRows) {
          if (lock.releasedAt) continue;

          const consumed = lockConsumeByOrder.get(lock.refId) ?? 0n;
          if (consumed <= 0n) continue;

          const remainingScaled = dbDecimalToScaledBigInt(lock.remainingAmount);
          const nextRemaining = remainingScaled - consumed;
          if (nextRemaining < 0n) throw new AppError("INVALID_REFRESH");

          await tx
            .update(walletLocks)
            .set({
              remainingAmount: sql`${toDbDecimal(nextRemaining)}`,
              releasedAt: nextRemaining === 0n ? new Date() : null,
            })
            .where(eq(walletLocks.id, lock.id));
          // TODO:
          // اگر order buy و closed باشد، باقیمانده lock باید unlock/refund شود
          // (price improvement / unfilled tail)
          const ord = ordMap.get(lock.refId);
          if (!ord) continue;

          if (
            ord.side === "buy" &&
            (ord.status === "filled" || ord.status === "cancelled")
          ) {
            if (nextRemaining > 0n) {
              addDelta(lock.userId, lock.asset, nextRemaining, -nextRemaining);

              ledgerRows.push({
                userId: lock.userId,
                asset: lock.asset,
                amount: nextRemaining,
                type: "unlock",
                refType: "order",
                refId: lock.refId,
                meta: { reason: "buy_price_improvement_or_tail_release" },
              });

              await tx
                .update(walletLocks)
                .set({
                  remainingAmount: sql`0`,
                  releasedAt: new Date(),
                })
                .where(eq(walletLocks.id, lock.id));

              lockRefundByOrder.set(lock.refId, nextRemaining);
            }
          }
        }
      }

      // D) Build ledger before/after with row lock on balances
      if (ledgerRows.length > 0) {
        // deterministic ordering
        ledgerRows.sort((a, b) => {
          if (a.userId !== b.userId) return a.userId.localeCompare(b.userId);
          if (a.asset !== b.asset) return a.asset.localeCompare(b.asset);
          if (a.refId !== b.refId) return a.refId.localeCompare(b.refId);
          return a.type.localeCompare(b.type);
        });

        const groups = new Map<string, LedgerDraft[]>();
        for (const row of ledgerRows) {
          const key = `${row.userId}:${row.asset}`;
          const arr = groups.get(key) ?? [];
          arr.push(row);
          groups.set(key, arr);
        }

        const parsed = [...groups.keys()].map((k) => {
          const i = k.indexOf(":");
          return { userId: k.slice(0, i), asset: k.slice(i + 1), key: k };
        });

        const whereExpr = or(
          ...parsed.map((p) =>
            and(eq(balances.userId, p.userId), eq(balances.asset, p.asset)),
          ),
        );
        const lockedRows =
          parsed.length === 0
            ? []
            : await tx
                .select({
                  userId: balances.userId,
                  asset: balances.asset,
                  available: balances.available,
                })
                .from(balances)
                .where(whereExpr!)
                .for("update");

        const availableNow = new Map<string, bigint>();
        for (const r of lockedRows) {
          availableNow.set(
            `${r.userId}:${r.asset}`,
            dbDecimalToScaledBigInt(r.available),
          );
        }

        for (const p of parsed) {
          let running = availableNow.get(p.key) ?? 0n;
          for (const entry of groups.get(p.key) ?? []) {
            const after = running + entry.amount;
            if (after < 0n) throw new AppError("INVALID_REFRESH");
            entry.balanceBefore = running;
            entry.balanceAfter = after;
            running = after;
          }
          availableNow.set(p.key, running);
        }

        await tx.insert(ledgerEntries).values(
          ledgerRows.map((r) => ({
            userId: r.userId,
            asset: r.asset,
            amount: sql`${toDbDecimal(r.amount)}`,
            balanceBefore: sql`${toDbDecimal(r.balanceBefore ?? 0n)}`,
            balanceAfter: sql`${toDbDecimal(r.balanceAfter ?? 0n)}`,
            type: r.type,
            refType: r.refType,
            refId: r.refId,
            meta: r.meta ?? null,
          })),
        );
      }

      if (deltas.size > 0) {
        const rows: DeltaRow[] = [];
        const insertRows: Array<{
          userId: string;
          asset: string;
          available: bigint;
          locked: bigint;
        }> = [];

        for (const [key, delta] of deltas.entries()) {
          const i = key.indexOf(":");
          const userId = key.slice(0, i);
          const asset = key.slice(i + 1);
          if (!userId || !asset) continue;

          rows.push({
            userId,
            asset,
            available: toDbDecimal(delta.available),
            locked: toDbDecimal(delta.locked),
          });

          if (delta.available >= 0n && delta.locked >= 0n) {
            insertRows.push({
              userId,
              asset,
              available: delta.available,
              locked: delta.locked,
            });
          }
        }

        if (rows.length > 0) {
          const updatedRows = await tx.execute<{
            user_id: string;
            asset: string;
          }>(sql`
            UPDATE balances
            SET
              available  = balances.available + v.available_delta::numeric,
              locked     = balances.locked    + v.locked_delta::numeric,
              updated_at = now()
            FROM (VALUES ${sql.join(
              rows.map(
                (r) =>
                  sql`(${r.userId}, ${r.asset}, ${r.available}::numeric, ${r.locked}::numeric)`,
              ),
              sql`, `,
            )}) AS v(user_id, asset, available_delta, locked_delta)
            WHERE balances.user_id = v.user_id::uuid
              AND balances.asset = v.asset
            RETURNING balances.user_id, balances.asset
          `);

          const updatedKeys = new Set(
            [...updatedRows].map((r) => `${r.user_id}:${r.asset}`),
          );

          const toInsert = insertRows.filter(
            (r) => !updatedKeys.has(`${r.userId}:${r.asset}`),
          );

          if (toInsert.length > 0) {
            await tx.insert(balances).values(
              toInsert.map((r) => ({
                userId: r.userId,
                asset: r.asset,
                available: sql`${toDbDecimal(r.available)}`,
                locked: sql`${toDbDecimal(r.locked)}`,
              })),
            );
          }

          for (const r of rows) {
            if (!updatedKeys.has(`${r.userId}:${r.asset}`)) {
              const delta = deltas.get(`${r.userId}:${r.asset}`)!;
              if (delta.available < 0n || delta.locked < 0n) {
                throw new AppError("UNAUTHORIZED");
              }
            }
          }
        }
      }
    });
  }
}
