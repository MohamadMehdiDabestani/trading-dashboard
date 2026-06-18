import { type Db } from "@repo/db";
import {
  WalletUnitOfWork,
  WalletUnitOfWorkContext,
} from "../../types/unitOfWork.repository";
import { BalanceRepository } from "../repositories/balance.repository";
import { LedgerRepository } from "../repositories/ledger.repository";

export class DrizzleWalletUnitOfWork implements WalletUnitOfWork {
  constructor(private readonly db: Db) {}

  async run<T>(fn: (ctx: WalletUnitOfWorkContext) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      const ctx: WalletUnitOfWorkContext = {
        tx,
        balance: new BalanceRepository(tx),
        ledger: new LedgerRepository(tx),
      };

      return fn(ctx);
    });
  }
}
