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
  async createWithdrawEntry(input: {
  userId: string;
  asset: string;
  amount: Big;
  balanceBefore: Big;
  balanceAfter: Big;
  withdrawId: string;
  meta?: Record<string, unknown> | null;
}): Promise<void> {
  const { userId, asset, amount, balanceBefore, balanceAfter, withdrawId, meta } = input;

  await this.tx.insert(ledgerEntries).values({
    userId,
    asset,
    type: "withdraw",
    amount: amount.times(-1),
    balanceBefore,
    balanceAfter,
    refType: "withdrawal",
    refId: withdrawId,
    meta: meta ?? null,
  });
}
}
