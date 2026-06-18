import { type Db } from "@repo/db";
import { OrderTxRepository } from "../infrastructure/repositories/order.repository";
import { BalanceTxRepository } from "../infrastructure/repositories/balance.repository";
import { WalletLockTxRepository } from "../infrastructure/repositories/walletLock.repository";
import { TradeHistoryTxRepository } from "../infrastructure/repositories/tradeHistory.repository";
import { LedgerTxRepository } from "../infrastructure/repositories/ledger.repository";

export type DbTransaction = Parameters<Parameters<Db["transaction"]>[0]>[0];

export interface TradeUnitOfWorkContext {
  tx: DbTransaction;
  orders: OrderTxRepository;
  balances: BalanceTxRepository;
  walletLocks: WalletLockTxRepository;
  trades: TradeHistoryTxRepository;
  ledger: LedgerTxRepository;
}

export interface TradeUnitOfWork {
  run<T>(fn: (ctx: TradeUnitOfWorkContext) => Promise<T>): Promise<T>;
}
