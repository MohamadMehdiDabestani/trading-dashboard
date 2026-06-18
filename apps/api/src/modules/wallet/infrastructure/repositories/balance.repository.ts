import { balances, DbTransaction } from "@repo/db";
import Big from "big.js";
import { sql } from "drizzle-orm";
import { AppError } from "@/errors/appError";

export class BalanceRepository {
  constructor(private tx: DbTransaction) {}

  async creditAvailable(input: {
    userId: string;
    asset: string;
    amount: Big;
  }): Promise<{
    balanceBefore: Big;
    balanceAfter: Big;
  }> {
    const { userId, asset, amount } = input;

    const [balance] = await this.tx
      .insert(balances)
      .values({
        userId,
        asset,
        available: amount,
      })
      .onConflictDoUpdate({
        target: [balances.userId, balances.asset],
        set: {
          available: sql<Big>`${balances.available} + ${amount}`,
        },
      })
      .returning({
        available: balances.available,
      });

    if (!balance) {
      throw new AppError("DEPOSIT_FAILED");
    }

    const balanceAfter = balance.available;
    const balanceBefore = balanceAfter.minus(amount);

    return {
      balanceBefore,
      balanceAfter,
    };
  }
}
