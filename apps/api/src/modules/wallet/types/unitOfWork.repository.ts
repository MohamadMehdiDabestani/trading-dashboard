import { DbTransaction } from "@repo/db";
import { BalanceRepository } from "../infrastructure/repositories/balance.repository";
import { LedgerRepository } from "../infrastructure/repositories/ledger.repository";

export interface WalletUnitOfWorkContext {
  tx: DbTransaction;
  balance: BalanceRepository;
  ledger: LedgerRepository;
}

export interface WalletUnitOfWork {
  run<T>(fn: (ctx: WalletUnitOfWorkContext) => Promise<T>): Promise<T>;
}
