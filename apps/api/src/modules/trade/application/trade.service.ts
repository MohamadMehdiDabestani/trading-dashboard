import { randomUUID } from "crypto";
import Big from "big.js";
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
import { AppError } from "@/errors/appError";
import { fromScale } from "@/utils/scaleBigInt";
import { TradeUnitOfWork } from "../types/unitOfWork.repository";
import { MatchPersistenceService } from "./match-persistence.service";
import { OrderReadRepository } from "../infrastructure/repositories/order.repository";

export class TradeService {
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

      const lockAmount =
        side === "buy" ? (price * quantity) / SCALE : quantity;

      if (lockAmount <= 0n) {
        throw new AppError("INVALID_LOCK_AMOUNT");
      }

      const lockAmountDecimal = new Big(lockAmount.toString()).div(
        new Big(SCALE.toString()),
      );

      /**
       * Transaction شماره ۱:
       * فقط reserve balance + create wallet lock + create order.
       * کوتاه، سریع، atomic.
       */
      await this.uow.run(async ({ balances, walletLocks, orders }) => {
        await balances.reserve({
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
      });

      /**
       * Engine خارج از transaction.
       * این خیلی مهم است.
       */
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

      this.emitMarketEvents(symbol, matchResult);

      /**
       * Transaction شماره ۲:
       * persist کردن match result.
       *
       * اگر نمی‌خواهی request منتظر این بماند، می‌توانی await را برداری،
       * ولی برای consistency بهتر است فعلاً await شود.
       */
      await this.matchPersistence.persist(
        matchResult,
        baseAsset,
        quoteAsset,
      );

      return {
        orderId,
        matchResult,
      };
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
      /**
       * اول owner بودن سفارش را validate می‌کنیم.
       * در کد قبلی، engine قبل از auth DB cancel می‌شد؛
       * آن می‌توانست bug امنیتی بسازد.
       */
      await this.uow.run(async ({ orders }) => {
        const order = await orders.getOrderOwner(orderId);

        if (!order) {
          throw new AppError("ORDER_NOT_FOUND");
        }

        if (order.userId !== userId) {
          throw new AppError("FORBIDDEN");
        }

        if (order.symbol !== symbol) {
          throw new AppError("INVALID_SYMBOL");
        }

        if (order.status === "filled" || order.status === "cancelled") {
          throw new AppError("ORDER_NOT_OPEN");
        }
      });

      const matchResult = this.engine.cancelOrder(symbol, orderId);

      if (!matchResult) {
        throw new AppError("ORDER_NOT_FOUND_IN_ENGINE");
      }

      /**
       * Transaction:
       * mark cancelled + release remaining lock + ledger unlock.
       */
      await this.uow.run(async ({ orders, walletLocks, balances, ledger }) => {
        const order = await orders.getOrderOwner(orderId);

        if (!order || order.userId !== userId) {
          throw new AppError("FORBIDDEN");
        }

        await orders.markCancelled(orderId);

        const lock = await walletLocks.getByOrderIdForUpdate(orderId);

        if (!lock || lock.releasedAt) return;

        const remainingScaled = walletLocks.toScaled(lock);

        if (remainingScaled <= 0n) {
          await walletLocks.releaseAll(lock.id);
          return;
        }

        const { beforeAvailable, afterAvailable } =
          await balances.releaseLocked({
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

      this.emitOrderBookDeltas(symbol, matchResult);

      return matchResult;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("cancelOrder error:", error);
      throw new AppError("INTERNAL_SERVER_ERROR");
    }
  }

  async getRecentOrders(
    symbol: string,
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<GetRecentTradesReply> {
    try {
      const safePage = Math.max(page, 1);
      const safePageSize = Math.min(Math.max(pageSize, 1), 100);

      return this.orderReadRepository.getRecentOrders(
        symbol,
        userId,
        safePage,
        safePageSize,
      );
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("getRecentOrders error:", error);
      throw new AppError("INTERNAL_SERVER_ERROR");
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
