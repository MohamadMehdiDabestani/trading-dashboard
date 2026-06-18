import { balances, DbTransaction } from "@repo/db";
import { and, eq, or, sql } from "drizzle-orm";
import Big from "big.js";
import { AppError } from "@/errors/appError";
import { dbDecimalToScaledBigInt, toDbDecimal } from "@/utils/scaleBigInt";

export type BalanceDelta = {
  userId: string;
  asset: string;
  available: bigint;
  locked: bigint;
};

export class BalanceTxRepository {
  constructor(private readonly tx: DbTransaction) {}

  async reserve(input: {
    userId: string;
    asset: string;
    amountDecimal: Big;
  }) {
    const userBalance = await this.tx
      .select()
      .from(balances)
      .where(
        and(
          eq(balances.userId, input.userId),
          eq(balances.asset, input.asset),
        ),
      )
      .for("update")
      .then((res) => res[0]);

    if (!userBalance || userBalance.available.lt(input.amountDecimal)) {
      throw new AppError("INSUFFICIENT_BALANCE");
    }

    await this.tx
      .update(balances)
      .set({
        available: sql`${balances.available} - ${input.amountDecimal}`,
        locked: sql`${balances.locked} + ${input.amountDecimal}`,
        updatedAt: new Date(),
      })
      .where(eq(balances.id, userBalance.id));
  }

  async releaseLocked(input: {
    userId: string;
    asset: string;
    amount: bigint;
  }): Promise<{
    beforeAvailable: bigint;
    afterAvailable: bigint;
  }> {
    const updatedBalance = await this.tx
      .update(balances)
      .set({
        available: sql`${balances.available} + ${toDbDecimal(input.amount)}`,
        locked: sql`${balances.locked} - ${toDbDecimal(input.amount)}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(balances.userId, input.userId),
          eq(balances.asset, input.asset),
        ),
      )
      .returning({
        available: balances.available,
      })
      .then((res) => res[0]);

    if (!updatedBalance) {
      throw new AppError("INTERNAL_SERVER_ERROR");
    }

    const afterAvailable = dbDecimalToScaledBigInt(updatedBalance.available);
    const beforeAvailable = afterAvailable - input.amount;

    return {
      beforeAvailable,
      afterAvailable,
    };
  }

  async lockAvailableRowsForLedger(
    keys: Array<{ userId: string; asset: string }>,
  ): Promise<Map<string, bigint>> {
    if (keys.length === 0) return new Map();

    const whereExpr = or(
      ...keys.map((p) =>
        and(eq(balances.userId, p.userId), eq(balances.asset, p.asset)),
      ),
    );

    const lockedRows = await this.tx
      .select({
        userId: balances.userId,
        asset: balances.asset,
        available: balances.available,
      })
      .from(balances)
      .where(whereExpr!)
      .for("update");

    const map = new Map<string, bigint>();

    for (const row of lockedRows) {
      map.set(
        `${row.userId}:${row.asset}`,
        dbDecimalToScaledBigInt(row.available),
      );
    }

    return map;
  }

  async applyDeltas(deltas: BalanceDelta[]) {
    if (deltas.length === 0) return;

    const rows = deltas.map((d) => ({
      userId: d.userId,
      asset: d.asset,
      available: toDbDecimal(d.available),
      locked: toDbDecimal(d.locked),
      raw: d,
    }));

    const insertRows = deltas.filter(
      (d) => d.available >= 0n && d.locked >= 0n,
    );

    const updatedRows = await this.tx.execute<{
      user_id: string;
      asset: string;
    }>(sql`
      UPDATE balances
      SET
        available  = balances.available + v.available_delta::numeric,
        locked     = balances.locked    + v.locked_delta::numeric,
        updated_at = now()
      FROM (VALUES ${sql.join(
        rows.map(
          (r) =>
            sql`(${r.userId}, ${r.asset}, ${r.available}::numeric, ${r.locked}::numeric)`,
        ),
        sql`, `,
      )}) AS v(user_id, asset, available_delta, locked_delta)
      WHERE balances.user_id = v.user_id::uuid
        AND balances.asset = v.asset
      RETURNING balances.user_id, balances.asset
    `);

    const updatedKeys = new Set(
      [...updatedRows].map((r) => `${r.user_id}:${r.asset}`),
    );

    const toInsert = insertRows.filter(
      (r) => !updatedKeys.has(`${r.userId}:${r.asset}`),
    );

    if (toInsert.length > 0) {
      await this.tx.insert(balances).values(
        toInsert.map((r) => ({
          userId: r.userId,
          asset: r.asset,
          available: sql`${toDbDecimal(r.available)}`,
          locked: sql`${toDbDecimal(r.locked)}`,
        })),
      );
    }

    for (const row of deltas) {
      const key = `${row.userId}:${row.asset}`;

      if (!updatedKeys.has(key)) {
        if (row.available < 0n || row.locked < 0n) {
          throw new AppError("BALANCE_ROW_NOT_FOUND");
        }
      }
    }
  }
}
