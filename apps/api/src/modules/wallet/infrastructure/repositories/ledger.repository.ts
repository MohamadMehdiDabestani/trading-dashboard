import { DbTransaction, ledgerEntries } from "@repo/db";
import Big from "big.js";

export class LedgerRepository {
  constructor(private tx: DbTransaction) {}

  async createDepositEntry(input: {
    userId: string;
    asset: string;
    amount: Big;
    balanceBefore: Big;
    balanceAfter: Big;
  }): Promise<void> {
    const { userId, asset, amount, balanceBefore, balanceAfter } = input;

    await this.tx.insert(ledgerEntries).values({
      userId,
      asset,
      type: "deposit",
      amount,
      balanceBefore,
      balanceAfter,
    });
  }
}
