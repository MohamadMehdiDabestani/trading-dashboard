import { walletLocks } from "@repo/db";
import { eq, inArray, sql } from "drizzle-orm";
import Big from "big.js";
import { dbDecimalToScaledBigInt, toDbDecimal } from "@/utils/scaleBigInt";
import { DbTransaction } from "../../types/unitOfWork.repository";

export class WalletLockTxRepository {
  constructor(private readonly tx: DbTransaction) {}

  async createOpenOrderLock(input: {
    userId: string;
    asset: string;
    amountDecimal: Big;
    orderId: string;
  }) {
    await this.tx.insert(walletLocks).values({
      userId: input.userId,
      asset: input.asset,
      amount: input.amountDecimal,
      remainingAmount: input.amountDecimal,
      reason: "open_order",
      refId: input.orderId,
    });
  }

  async getByOrderIdForUpdate(orderId: string) {
    const lock = await this.tx
      .select({
        id: walletLocks.id,
        refId: walletLocks.refId,
        userId: walletLocks.userId,
        asset: walletLocks.asset,
        remainingAmount: walletLocks.remainingAmount,
        releasedAt: walletLocks.releasedAt,
      })
      .from(walletLocks)
      .where(eq(walletLocks.refId, orderId))
      .for("update")
      .then((res) => res[0]);

    return lock ?? null;
  }

  async getByOrderIdsForUpdate(orderIds: string[]) {
    if (orderIds.length === 0) return [];

    return this.tx
      .select({
        id: walletLocks.id,
        refId: walletLocks.refId,
        userId: walletLocks.userId,
        asset: walletLocks.asset,
        remainingAmount: walletLocks.remainingAmount,
        releasedAt: walletLocks.releasedAt,
      })
      .from(walletLocks)
      .where(inArray(walletLocks.refId, orderIds))
      .for("update");
  }

  async updateRemaining(input: {
    id: string;
    remaining: bigint;
    releaseIfZero?: boolean;
  }) {
    await this.tx
      .update(walletLocks)
      .set({
        remainingAmount: sql`${toDbDecimal(input.remaining)}`,
        releasedAt:
          input.releaseIfZero && input.remaining === 0n ? new Date() : null,
      })
      .where(eq(walletLocks.id, input.id));
  }

  async releaseAll(id: string) {
    await this.tx
      .update(walletLocks)
      .set({
        remainingAmount: sql`0`,
        releasedAt: new Date(),
      })
      .where(eq(walletLocks.id, id));
  }

  toScaled(lock: { remainingAmount: string | number | Big }): bigint {
    return dbDecimalToScaledBigInt(lock.remainingAmount);
  }
}
