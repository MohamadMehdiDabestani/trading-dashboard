import { randomUUID } from "crypto";
import Big from "big.js";
import {
  EngineOrder,
  GetRecentTradesReply,
  MatchResult,
  OrderSortField,
  OrderStatus,
  OrderType,
  SCALE,
  Side,
  SortDirection,
  TradeStatsReply,
} from "@repo/types";
import { MatchingEngine } from "@/engine";
import { MarketEventBus } from "@/utils/eventBus";
import { AppError } from "@/errors/appError";
import { dbDecimalToScaledBigInt, fromScale } from "@/utils/scaleBigInt";
import { TradeUnitOfWork } from "../types/unitOfWork.repository";
import { MatchPersistenceService } from "./match-persistence.service";
import { OrderReadRepository } from "../infrastructure/repositories/order.repository";
import { KeyedMutex } from "@/utils/keyedMutex";

export class TradeService {
  /**
   * همهٔ عملیات‌هایی که engine و DB را با هم تغییر می‌دهند (create-match-persist و cancel)
   * به ازای هر symbol سریالی اجرا می‌شوند. بدون این، cancel می‌توانست وسط
   * فاصلهٔ «match در engine» و «persist در DB» وارد شود و lock را دوبار آزاد کند.
   */
  private readonly symbolLock = new KeyedMutex();

  constructor(
    private readonly uow: TradeUnitOfWork,
    private readonly orderReadRepository: OrderReadRepository,
    private readonly engine: MatchingEngine,
    private readonly eventBus: MarketEventBus,
    private readonly matchPersistence: MatchPersistenceService,
  ) {}

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
      if (quantity <= 0n) {
        throw new AppError("INVALID_QUANTITY");
      }

      if (type === "limit" && price <= 0n) {
        throw new AppError("INVALID_PRICE");
      }

      const orderId = randomUUID();

      const lockAsset = side === "buy" ? quoteAsset : baseAsset;
      const lockAmount = side === "buy" ? (price * quantity) / SCALE : quantity;

      if (lockAmount <= 0n) {
        throw new AppError("INVALID_LOCK_AMOUNT");
      }

      const lockAmountDecimal = new Big(lockAmount.toString()).div(
        new Big(SCALE.toString()),
      );

      // Transaction ۱: reserve + lock + create order (خارج از mutex؛ مستقل از بوک است)
      await this.uow.run(async ({ balances, walletLocks, orders, ledger }) => {
        const { beforeAvailable, afterAvailable } = await balances.reserve({
          userId,
          asset: lockAsset,
          amountDecimal: lockAmountDecimal,
        });

        await walletLocks.createOpenOrderLock({
          userId,
          asset: lockAsset,
          amountDecimal: lockAmountDecimal,
          orderId,
        });

        await orders.createOpenOrder({
          id: orderId,
          userId,
          symbol,
          side,
          type,
          price,
          quantity,
        });

        await ledger.insertLock({
          userId,
          asset: lockAsset,
          amount: -lockAmount,
          balanceBefore: beforeAvailable,
          balanceAfter: afterAvailable,
          orderId,
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

      const matchResult = await this.symbolLock.run(symbol, async () => {
        let result: MatchResult;

        try {
          result = this.engine.submitOrder(engineOrder);
          // Transaction ۲: persist
          await this.matchPersistence.persist(result, baseAsset, quoteAsset);
        } catch (err) {
          // engine از DB جلو افتاده؛ DB منبع حقیقت است → بوک را به DB برگردان
          await this.recoverFromFailedMatch(userId, symbol, orderId);
          throw err;
        }

        // event ها فقط بعد از persist موفق ارسال می‌شوند (trade فانتوم پخش نمی‌شود)
        this.emitMarketEvents(symbol, result);
        return result;
      });

      return { orderId, matchResult };
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("createOrder error:", error);
      throw new AppError("INTERNAL_SERVER_ERROR");
    }
  }

  async cancelOrder(
    userId: string,
    symbol: string,
    orderId: string,
  ): Promise<MatchResult> {
    try {
      return await this.symbolLock.run(symbol, async () => {
        // اول DB (با بررسی owner/symbol/status)؛ اگر خطا بدهد engine دست‌نخورده می‌ماند.
        await this.cancelInDb(userId, symbol, orderId);

        // کنسل در حافظه است و fail نمی‌شود؛ اگر سفارش در engine نبود (مثلاً market) مهم نیست.
        const matchResult: MatchResult = this.engine.cancelOrder(
          symbol,
          orderId,
        ) ?? { trades: [], updates: [], deltas: [] };

        this.emitOrderBookDeltas(symbol, matchResult);
        return matchResult;
      });
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("cancelOrder error:", error);
      throw new AppError("INTERNAL_SERVER_ERROR");
    }
  }

  async getRecentOrders(params: {
    symbol?: string;
    userId: string;
    status?: OrderStatus[];
    sortBy?: OrderSortField;
    sortOrder?: SortDirection;
    page: number;
    pageSize: number;
  }): Promise<GetRecentTradesReply> {
    try {
      const { symbol, userId, status, page, pageSize, sortOrder, sortBy } =
        params;
      const safePage = Math.max(page, 1);
      const safePageSize = Math.min(Math.max(pageSize, 1), 100);

      return await this.orderReadRepository.getRecentOrders({
        symbol,
        userId,
        status,
        sortBy,
        sortOrder,
        page: safePage,
        pageSize: safePageSize,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("getRecentOrders error:", error);
      throw new AppError("INTERNAL_SERVER_ERROR");
    }
  }
  async getStats(userId: string): Promise<TradeStatsReply> {
    try {
      const DAY = 24 * 60 * 60 * 1000;
      const now = Date.now();
      const d30 = new Date(now - 30 * DAY);
      const d60 = new Date(now - 60 * DAY);

      const [all, cur, prev] = await Promise.all([
        this.orderReadRepository.getFinishedStats(userId),
        this.orderReadRepository.getFinishedStats(userId, d30),
        this.orderReadRepository.getFinishedStats(userId, d60, d30),
      ]);

      const rate = (s: { filled: number; total: number }) =>
        s.total > 0 ? (s.filled / s.total) * 100 : null;
      const r1 = (n: number) => Math.round(n * 10) / 10;

      const rAll = rate(all),
        rCur = rate(cur),
        rPrev = rate(prev);

      return {
        successRate: rAll === null ? null : r1(rAll),
        filled: all.filled,
        total: all.total,
        deltaPercent: rCur !== null && rPrev !== null ? r1(rCur - rPrev) : null,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("getStats error:", error);
      throw new AppError("INTERNAL_SERVER_ERROR");
    }
  }
  // ─── internals ────────────────────────────────────────────────────────────

  /** validate + mark cancelled + release remaining lock + ledger unlock، همه در یک transaction */
  private async cancelInDb(userId: string, symbol: string, orderId: string) {
    await this.uow.run(async ({ orders, walletLocks, balances, ledger }) => {
      const order = await orders.getOrderOwner(orderId);

      if (!order) throw new AppError("ORDER_NOT_FOUND");
      if (order.userId !== userId) throw new AppError("FORBIDDEN");
      if (order.symbol !== symbol) throw new AppError("INVALID_SYMBOL");
      if (order.status === "filled" || order.status === "cancelled") {
        throw new AppError("ORDER_NOT_OPEN");
      }

      await orders.markCancelled(orderId);

      const lock = await walletLocks.getByOrderIdForUpdate(orderId);
      if (!lock || lock.releasedAt) return;

      const remainingScaled = walletLocks.toScaled(lock);

      if (remainingScaled <= 0n) {
        await walletLocks.releaseAll(lock.id);
        return;
      }

      const { beforeAvailable, afterAvailable } = await balances.releaseLocked({
        userId,
        asset: lock.asset,
        amount: remainingScaled,
      });

      await ledger.insertUnlock({
        userId,
        asset: lock.asset,
        amount: remainingScaled,
        balanceBefore: beforeAvailable,
        balanceAfter: afterAvailable,
        orderId,
      });

      await walletLocks.releaseAll(lock.id);
    });
  }

  /**
   * اگر match در engine انجام شد ولی persist (یا خود submit) شکست خورد:
   * ۱) سفارش taker در DB کنسل و lock آزاد می‌شود،
   * ۲) بوک engine از روی سفارش‌های فعال DB بازسازی می‌شود (trade های persist‌نشده برمی‌گردند).
   */
  private async recoverFromFailedMatch(
    userId: string,
    symbol: string,
    takerOrderId: string,
  ) {
    try {
      await this.cancelInDb(userId, symbol, takerOrderId);
    } catch (err) {
      console.error(
        `[RECOVERY][${symbol}] failed to cancel taker ${takerOrderId} in DB:`,
        err,
      );
    }

    try {
      const rows =
        await this.orderReadRepository.getActiveOrdersBySymbol(symbol);

      const active: EngineOrder[] = rows.map((o: any) => ({
        id: o.id,
        userId: o.userId,
        symbol: o.symbol,
        side: o.side,
        type: o.type,
        price: dbDecimalToScaledBigInt(o.price ?? 0),
        quantity: dbDecimalToScaledBigInt(o.quantity),
        filled: dbDecimalToScaledBigInt(o.filledQuantity),
        timestamp: o.createdAt.getTime(),
      }));

      this.engine.replaceSymbolOrders(symbol, active);

      // ws هر event غیر ticker را «بوک عوض شد» می‌گیرد و snapshot کامل می‌فرستد
      this.eventBus.emit({
        type: "orderbook_delta",
        data: { symbol, deltas: [] },
      });
    } catch (err) {
      console.error(
        `[RECOVERY][${symbol}] CRITICAL: engine resync from DB failed:`,
        err,
      );
    }
  }

  private emitMarketEvents(symbol: string, matchResult: MatchResult) {
    this.emitOrderBookDeltas(symbol, matchResult);

    for (const trade of matchResult.trades) {
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
    }
  }

  private emitOrderBookDeltas(symbol: string, matchResult: MatchResult) {
    if (matchResult.deltas.length === 0) return;

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
}
