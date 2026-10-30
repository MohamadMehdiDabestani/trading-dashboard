import { balances, DbTransaction } from "@repo/db";
import Big from "big.js";
import { and, eq, gte, sql } from "drizzle-orm";
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
  async debitAvailable(input: {
    userId: string;
    asset: string;
    amount: Big;
  }): Promise<{ balanceBefore: Big; balanceAfter: Big }> {
    const { userId, asset, amount } = input;

    const [row] = await this.tx
      .update(balances)
      .set({
        available: sql<Big>`${balances.available} - ${amount}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(balances.userId, userId),
          eq(balances.asset, asset),
          gte(balances.available, amount),
        ),
      )
      .returning({ available: balances.available });

    if (!row) throw new AppError("INSUFFICIENT_BALANCE");

    const balanceAfter = row.available;
    return { balanceBefore: balanceAfter.plus(amount), balanceAfter };
  }
}
