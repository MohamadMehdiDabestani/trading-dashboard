import { MatchResult, Side } from "@repo/types";
import { AppError } from "@/errors/appError";
import { dbDecimalToScaledBigInt } from "@/utils/scaleBigInt";
import { TradeUnitOfWork } from "../types/unitOfWork.repository";
import { BalanceDelta } from "../infrastructure/repositories/balance.repository";
import { LedgerDraft } from "../infrastructure/repositories/ledger.repository";

type Delta = {
  available: bigint;
  locked: bigint;
};

export class MatchPersistenceService {
  private readonly FEE_RATE_MAKER = 10n;
  private readonly FEE_RATE_TAKER = 10n;

  constructor(private readonly uow: TradeUnitOfWork) {}

  async persist(
    result: MatchResult,
    baseAsset: string,
    quoteAsset: string,
  ): Promise<void> {
    if (result.trades.length === 0 && result.updates.length === 0) return;

    await this.uow.run(async ({ orders, trades, walletLocks, balances, ledger }) => {
      if (result.updates.length > 0) {
        await orders.batchUpdateFilledAndStatus(result.updates);
      }

      const deltas = new Map<string, Delta>();

      const addDelta = (
        userId: string,
        asset: string,
        availableDelta: bigint,
        lockedDelta: bigint,
      ) => {
        const key = `${userId}:${asset}`;
        const prev = deltas.get(key) ?? {
          available: 0n,
          locked: 0n,
        };

        deltas.set(key, {
          available: prev.available + availableDelta,
          locked: prev.locked + lockedDelta,
        });
      };

      const ledgerRows: LedgerDraft[] = [];

      const lockConsumeByOrder = new Map<string, bigint>();

      if (result.trades.length > 0) {
        await trades.insertMany(result.trades);

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

          const sellerFeeQuote =
            (trade.quoteQuantity * sellerFeeRate) / 10000n;

          const sellerReceiveQuote = trade.quoteQuantity - sellerFeeQuote;

          addDelta(trade.buyerId, quoteAsset, 0n, -trade.quoteQuantity);
          addDelta(trade.buyerId, baseAsset, buyerReceiveBase, 0n);

          addDelta(trade.sellerId, baseAsset, 0n, -trade.quantity);
          addDelta(trade.sellerId, quoteAsset, sellerReceiveQuote, 0n);

          if (buyerFeeBase > 0n) {
            ledgerRows.push({
              userId: trade.buyerId,
              asset: baseAsset,
              amount: -buyerFeeBase,
              type: "fee",
              refType: "close_trade",
              refId: trade.id,
              meta: {
                side: "buy",
                feeAsset: baseAsset,
              },
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
              meta: {
                side: "sell",
                feeAsset: quoteAsset,
              },
            });
          }

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

          lockConsumeByOrder.set(
            trade.buyOrderId,
            (lockConsumeByOrder.get(trade.buyOrderId) ?? 0n) +
              trade.quoteQuantity,
          );

          lockConsumeByOrder.set(
            trade.sellOrderId,
            (lockConsumeByOrder.get(trade.sellOrderId) ?? 0n) + trade.quantity,
          );
        }
      }

      const affectedOrderIds = [...lockConsumeByOrder.keys()];

      if (affectedOrderIds.length > 0) {
        const ordRows = await orders.getOrderRowsByIds(affectedOrderIds);

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

        const lockRows = await walletLocks.getByOrderIdsForUpdate(
          affectedOrderIds,
        );

        for (const lock of lockRows) {
          if (lock.releasedAt) continue;

          const consumed = lockConsumeByOrder.get(lock.refId) ?? 0n;
          if (consumed <= 0n) continue;

          const remainingScaled = dbDecimalToScaledBigInt(
            lock.remainingAmount,
          );

          const nextRemaining = remainingScaled - consumed;

          if (nextRemaining < 0n) {
            throw new AppError("INVALID_BALANCE_LOCK_STATE");
          }

          await walletLocks.updateRemaining({
            id: lock.id,
            remaining: nextRemaining,
            releaseIfZero: true,
          });

          const ord = ordMap.get(lock.refId);
          if (!ord) continue;

          if (
            ord.side === "buy" &&
            (ord.status === "filled" || ord.status === "cancelled") &&
            nextRemaining > 0n
          ) {
            addDelta(lock.userId, lock.asset, nextRemaining, -nextRemaining);

            ledgerRows.push({
              userId: lock.userId,
              asset: lock.asset,
              amount: nextRemaining,
              type: "unlock",
              refType: "order",
              refId: lock.refId,
              meta: {
                reason: "buy_price_improvement_or_tail_release",
              },
            });

            await walletLocks.releaseAll(lock.id);
          }
        }
      }

      if (ledgerRows.length > 0) {
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

        const parsed = [...groups.keys()].map((key) => {
          const i = key.indexOf(":");

          return {
            userId: key.slice(0, i),
            asset: key.slice(i + 1),
            key,
          };
        });

        const availableNow = await balances.lockAvailableRowsForLedger(
          parsed.map((p) => ({
            userId: p.userId,
            asset: p.asset,
          })),
        );

        for (const p of parsed) {
          let running = availableNow.get(p.key) ?? 0n;

          for (const entry of groups.get(p.key) ?? []) {
            const after = running + entry.amount;

            if (after < 0n) {
              throw new AppError("NEGATIVE_LEDGER_BALANCE");
            }

            entry.balanceBefore = running;
            entry.balanceAfter = after;
            running = after;
          }

          availableNow.set(p.key, running);
        }

        await ledger.insertMany(ledgerRows);
      }

      if (deltas.size > 0) {
        const balanceDeltas: BalanceDelta[] = [];

        for (const [key, delta] of deltas.entries()) {
          const i = key.indexOf(":");
          const userId = key.slice(0, i);
          const asset = key.slice(i + 1);

          if (!userId || !asset) continue;

          balanceDeltas.push({
            userId,
            asset,
            available: delta.available,
            locked: delta.locked,
          });
        }

        await balances.applyDeltas(balanceDeltas);
      }
    });
  }
}
