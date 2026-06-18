import { OrderTxRepository } from "../infrastructure/repositories/order.repository";
import { BalanceTxRepository } from "../infrastructure/repositories/balance.repository";
import { WalletLockTxRepository } from "../infrastructure/repositories/walletLock.repository";
import { TradeHistoryTxRepository } from "../infrastructure/repositories/tradeHistory.repository";
import { LedgerTxRepository } from "../infrastructure/repositories/ledger.repository";
import { DbTransaction } from "@repo/db";


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
