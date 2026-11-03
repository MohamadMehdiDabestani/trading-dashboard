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
import { dbDecimalToScaledBigInt, fromScale, toDbDecimal } from "@/utils/scaleBigInt";
import { TradeUnitOfWork } from "../types/unitOfWork.repository";
import { MatchPersistenceService } from "./match-persistence.service";
import { OrderReadRepository } from "../infrastructure/repositories/order.repository";
import { KeyedMutex } from "@/utils/keyedMutex";
import { LedgerDraft } from "../infrastructure/repositories/ledger.repository";

export type QuoteInput = { side: Side; price: bigint; quantity: bigint };

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

      const matchResult = await this.symbolLock.run(symbol, () =>
        this.submitAndPersist(
          userId,
          symbol,
          baseAsset,
          quoteAsset,
          engineOrder,
          lockAsset,
          lockAmount,
        ),
      );

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
   * اگر persist یا submit شکست خورد:
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

    await this.resyncEngineFromDb(symbol);
  }

  /**
   * وقتی تیکر به‌دلیل self-trade (دو سفارش مخالف در یک قیمت از یک کاربر)
   * در engine رد شد، باید هم‌زمان در DB هم کنسل شود. در غیر این صورت
   * سفارش "کنسل‌نشده" در DB می‌ماند و با ری‌استارت سرور دوباره در بوک
   * ظاهر می‌شود (دو سفارش مخالف در یک قیمت).
   */
  private async cancelSelfTradeOrder(
    userId: string,
    symbol: string,
    orderId: string,
  ): Promise<void> {
    await this.uow.run(async ({ orders, walletLocks, balances, ledger }) => {
      const order = await orders.getOrderOwner(orderId);
      if (!order) return;
      if (order.status === "filled" || order.status === "cancelled") return;

      // رد کردن سفارش جدید
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
   * آزادسازی قفل سرمایه برای سفارش self-trade.
   * از آنجا که createOrder قفل را قبل از صدا زدن engine گرفته، باید
   * این قفل آزاد شود در غیر این صورت سرمایه کاربر برای همیشه درگیر می‌ماند.
   */
  private async cancelSelfTradeLock(
    userId: string,
    orderId: string,
    asset: string,
    amount: bigint,
  ): Promise<void> {
    await this.uow.run(async ({ balances, walletLocks, ledger }) => {
      const lock = await walletLocks.getByOrderIdForUpdate(orderId);
      if (!lock || lock.releasedAt) return;

      const { beforeAvailable, afterAvailable } = await balances.releaseLocked({
        userId,
        asset,
        amount,
      });

      await ledger.insertUnlock({
        userId,
        asset,
        amount,
        balanceBefore: beforeAvailable,
        balanceAfter: afterAvailable,
        orderId,
      });

      await walletLocks.releaseAll(lock.id);
    });
  }

  /**
   * submit به engine + persist + emit؛ باید داخل symbolLock صدا زده شود.
   */
  private async submitAndPersist(
    userId: string,
    symbol: string,
    baseAsset: string,
    quoteAsset: string,
    engineOrder: EngineOrder,
    lockAsset: string,
    lockAmount: bigint,
  ): Promise<MatchResult> {
    let result: MatchResult;

    try {
      result = this.engine.submitOrder(engineOrder);
      // Transaction ۲: persist
      await this.matchPersistence.persist(result, baseAsset, quoteAsset);
    } catch (err) {
      if (err instanceof Error && err.message === "SELF_TRADE_BLOCKED") {
        // self-trade: قفل آزاد و سفارش در DB کنسل می‌شود
        await this.cancelSelfTradeLock(
          userId,
          engineOrder.id,
          lockAsset,
          lockAmount,
        );
        await this.cancelSelfTradeOrder(userId, symbol, engineOrder.id);
        // ممکن است قبل از رسیدن به سفارش خودی، چند maker بهتر در حافظه fill شده باشند
        // (و چون persist نشده‌اند فقط در حافظه‌اند) → بوک را از DB برگردان
        await this.resyncEngineFromDb(symbol);
        throw new AppError("SELF_TRADE_BLOCKED");
      }
      // persist یا submit شکست خورد: بوک را از روی DB برگردان
      await this.recoverFromFailedMatch(userId, symbol, engineOrder.id);
      throw err;
    }

    // event ها فقط بعد از persist موفق ارسال می‌شوند (trade فانتوم پخش نمی‌شود)
    this.emitMarketEvents(symbol, result);
    return result;
  }

  /**
   * ثبت دسته‌ای سفارش‌های limit یک کاربر (مخصوص market maker).
   * quotes به ترتیب اولویت داده شود (نزدیک‌ترین به mid اول).
   * اگر موجودی همهٔ سطح‌ها را نپوشاند، فقط پیشوندی که جا می‌شود ثبت می‌شود.
   *
   * ۱ transaction برای reserve + lock + order + ledger همهٔ سفارش‌ها،
   * بعد یک‌بار گرفتن symbolLock برای submit همه در حافظه.
   */
  async createLimitOrdersBatch(
    userId: string,
    symbol: string,
    baseAsset: string,
    quoteAsset: string,
    quotes: QuoteInput[],
  ): Promise<{ placed: number; skippedBySide: Record<Side, number> }> {
    const skippedBySide: Record<Side, number> = { buy: 0, sell: 0 };
    if (quotes.length === 0) return { placed: 0, skippedBySide };

    try {
      const prepared = quotes.map((q) => {
        if (q.quantity <= 0n) throw new AppError("INVALID_QUANTITY");
        if (q.price <= 0n) throw new AppError("INVALID_PRICE");

        const lockAsset = q.side === "buy" ? quoteAsset : baseAsset;
        const lockAmount =
          q.side === "buy" ? (q.price * q.quantity) / SCALE : q.quantity;
        if (lockAmount <= 0n) throw new AppError("INVALID_LOCK_AMOUNT");

        return { ...q, orderId: randomUUID(), lockAsset, lockAmount };
      });
      type Prepared = (typeof prepared)[number];

      // Transaction ۱ (خارج از mutex؛ مستقل از بوک)
      const accepted = await this.uow.run(
        async ({ balances, walletLocks, orders, ledger }) => {
          const byAsset = new Map<string, Prepared[]>();
          for (const p of prepared) {
            const arr = byAsset.get(p.lockAsset) ?? [];
            arr.push(p);
            byAsset.set(p.lockAsset, arr);
          }

          const accepted: Prepared[] = [];
          const ledgerRows: LedgerDraft[] = [];

          // ترتیب ثابت روی asset → جلوگیری از deadlock روی balance rowها
          for (const asset of [...byAsset.keys()].sort()) {
            const list = byAsset.get(asset)!;
            const available = await balances.getAvailableForUpdate(
              userId,
              asset,
            );

            const fits: Prepared[] = [];
            let total = 0n;
            for (const p of list) {
              if (total + p.lockAmount > available) break;
              total += p.lockAmount;
              fits.push(p);
            }

            for (const p of list.slice(fits.length)) skippedBySide[p.side]++;
            if (fits.length === 0) continue;

            const { beforeAvailable } = await balances.reserve({
              userId,
              asset,
              amountDecimal: new Big(toDbDecimal(total)),
            });

            let running = beforeAvailable;
            for (const p of fits) {
              ledgerRows.push({
                userId,
                asset,
                amount: -p.lockAmount,
                type: "lock",
                refType: "order",
                refId: p.orderId,
                balanceBefore: running,
                balanceAfter: running - p.lockAmount,
              });
              running -= p.lockAmount;
            }
            accepted.push(...fits);
          }

          if (accepted.length === 0) return accepted;

          await walletLocks.createOpenOrderLocks(
            accepted.map((p) => ({
              userId,
              asset: p.lockAsset,
              amountDecimal: new Big(toDbDecimal(p.lockAmount)),
              orderId: p.orderId,
            })),
          );
          await orders.createOpenOrders(
            accepted.map((p) => ({
              id: p.orderId,
              userId,
              symbol,
              side: p.side,
              type: "limit" as OrderType,
              price: p.price,
              quantity: p.quantity,
            })),
          );
          await ledger.insertMany(ledgerRows);

          return accepted;
        },
      );

      if (accepted.length === 0) return { placed: 0, skippedBySide };

      // ترتیب اولویت اصلی حفظ شود (accepted بر اساس asset گروه‌بندی شده)
      const order = new Map(prepared.map((p, i) => [p.orderId, i]));
      accepted.sort((a, b) => order.get(a.orderId)! - order.get(b.orderId)!);

      let placed = 0;
      await this.symbolLock.run(symbol, async () => {
        for (const p of accepted) {
          const engineOrder: EngineOrder = {
            id: p.orderId,
            userId,
            symbol,
            side: p.side,
            type: "limit",
            price: p.price,
            quantity: p.quantity,
            filled: 0n,
            timestamp: Date.now(),
          };
          try {
            await this.submitAndPersist(
              userId,
              symbol,
              baseAsset,
              quoteAsset,
              engineOrder,
              p.lockAsset,
              p.lockAmount,
            );
            placed++;
          } catch (err) {
            console.error(
              `[batch][${symbol}] order ${p.orderId} (${p.side}) failed:`,
              err,
            );
          }
        }
      });

      return { placed, skippedBySide };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("createLimitOrdersBatch error:", error);
      throw new AppError("INTERNAL_SERVER_ERROR");
    }
  }

  /**
   * کنسل دسته‌ای: ۱ transaction برای کل سفارش‌ها + یک symbolLock.
   * سفارش‌هایی که وجود ندارند / مال کاربر نیستند / بسته شده‌اند بی‌صدا رد می‌شوند.
   * تعداد کنسل‌شده‌ها را برمی‌گرداند.
   */
  async cancelOrdersBatch(
    userId: string,
    symbol: string,
    orderIds: string[],
  ): Promise<number> {
    if (orderIds.length === 0) return 0;

    try {
      return await this.symbolLock.run(symbol, async () => {
        const cancelled = await this.cancelManyInDb(userId, symbol, orderIds);

        const merged: MatchResult = { trades: [], updates: [], deltas: [] };
        for (const id of cancelled) {
          const r = this.engine.cancelOrder(symbol, id);
          if (r) merged.deltas.push(...r.deltas);
        }

        this.emitOrderBookDeltas(symbol, merged);
        return cancelled.length;
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("cancelOrdersBatch error:", error);
      throw new AppError("INTERNAL_SERVER_ERROR");
    }
  }

  private async cancelManyInDb(
    userId: string,
    symbol: string,
    orderIds: string[],
  ): Promise<string[]> {
    return this.uow.run(async ({ orders, walletLocks, balances, ledger }) => {
      const rows = await orders.getOrderOwners(orderIds);
      const cancellable = rows
        .filter(
          (o) =>
            o.userId === userId &&
            o.symbol === symbol &&
            (o.status === "open" || o.status === "partial"),
        )
        .map((o) => o.id);

      if (cancellable.length === 0) return [];

      await orders.markCancelledMany(cancellable);

      const locks = (await walletLocks.getByOrderIdsForUpdate(cancellable))
        .filter((l) => !l.releasedAt);

      const byAsset = new Map<
        string,
        Array<{ orderId: string; amount: bigint }>
      >();
      const lockIdsToRelease: string[] = [];

      for (const l of locks) {
        lockIdsToRelease.push(l.id);
        const amount = walletLocks.toScaled(l);
        if (amount <= 0n) continue;

        const arr = byAsset.get(l.asset) ?? [];
        arr.push({ orderId: l.refId, amount });
        byAsset.set(l.asset, arr);
      }

      const ledgerRows: LedgerDraft[] = [];

      for (const asset of [...byAsset.keys()].sort()) {
        const items = byAsset.get(asset)!;
        const total = items.reduce((sum, it) => sum + it.amount, 0n);

        const { beforeAvailable } = await balances.releaseLocked({
          userId,
          asset,
          amount: total,
        });

        let running = beforeAvailable;
        for (const it of items) {
          ledgerRows.push({
            userId,
            asset,
            amount: it.amount,
            type: "unlock",
            refType: "order",
            refId: it.orderId,
            balanceBefore: running,
            balanceAfter: running + it.amount,
          });
          running += it.amount;
        }
      }

      await ledger.insertMany(ledgerRows);
      await walletLocks.releaseMany(lockIdsToRelease);

      return cancellable;
    });
  }

  /** بوک engine را از سفارش‌های فعال DB بازسازی می‌کند */
  private async resyncEngineFromDb(symbol: string) {
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