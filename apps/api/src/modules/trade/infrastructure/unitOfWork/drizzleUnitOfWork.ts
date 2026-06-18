import { type Db } from "@repo/db";
import {
  TradeUnitOfWork,
  TradeUnitOfWorkContext,
} from "../../types/unitOfWork.repository";
import { OrderTxRepository } from "../repositories/order.repository";
import { BalanceTxRepository } from "../repositories/balance.repository";
import { WalletLockTxRepository } from "../repositories/walletLock.repository";
import { TradeHistoryTxRepository } from "../repositories/tradeHistory.repository";
import { LedgerTxRepository } from "../repositories/ledger.repository";

export class DrizzleTradeUnitOfWork implements TradeUnitOfWork {
  constructor(private readonly db: Db) {}

  async run<T>(fn: (ctx: TradeUnitOfWorkContext) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      const ctx: TradeUnitOfWorkContext = {
        tx,
        orders: new OrderTxRepository(tx),
        balances: new BalanceTxRepository(tx),
        walletLocks: new WalletLockTxRepository(tx),
        trades: new TradeHistoryTxRepository(tx),
        ledger: new LedgerTxRepository(tx),
      };

      return fn(ctx);
    });
  }
}
