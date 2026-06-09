import { balances, Db, ledgerEntries } from "@repo/db";
import { WalletRepository } from "../../types/wallet.repository";
import { Big } from "big.js";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { AppError } from "@/errors/appError";
import { PaginatedResult } from "@repo/types";
import { applyPagination } from "@/utils/pagination";
const balanceRowMap = {
  asset: balances.asset,
  locked: balances.locked,
  available: balances.available,
  id: balances.id,
};
export class WalletDrizzleRepository implements WalletRepository {
  constructor(private db: Db) {}

  async getSingleAsset(
    userId: string,
    asset: string,
    page = 1,
    pageSize = 20,
  ): Promise<
    | {
        asset: string;
        locked: Big;
        available: Big;
        history: PaginatedResult<{
          time: Date;
          amount: Big;
          type: string;
        }>;
      }
    | undefined
  > {
    const historyQuery = this.db
      .select({
        time: ledgerEntries.createdAt,
        amount: ledgerEntries.amount,
        type: ledgerEntries.type,
      })
      .from(ledgerEntries)
      .where(
        and(eq(ledgerEntries.userId, userId), eq(ledgerEntries.asset, asset)),
      )
      .orderBy(desc(ledgerEntries.createdAt));

    // ۲. اجرای همزمان (Parallel) برای پرفورمنس
    const [balanceRows, historyRows, totalRows] = await Promise.all([
      this.db
        .select(balanceRowMap)
        .from(balances)
        .where(and(eq(balances.userId, userId), eq(balances.asset, asset))),

      // استفاده از Helper برای اعمال limit/offset
      applyPagination(historyQuery.$dynamic(), page, pageSize),

      this.db
        .select({ value: count() })
        .from(ledgerEntries)
        .where(
          and(eq(ledgerEntries.userId, userId), eq(ledgerEntries.asset, asset)),
        ),
    ]);

    if (!balanceRows[0]) return undefined;
    const row = balanceRows[0];
    const total = Number(totalRows[0]?.value ?? 0);
    return {
      asset: row.asset,
      locked: row.locked,
      available: row.available,
      history: {
        items: historyRows.map((h) => ({
          time: h.time,
          amount: h.amount,
          type: h.type,
        })),
        page,
        pageSize,
        total,
        totalPage: Math.ceil(total / pageSize),
      },
    };
  }

  async getBalance(
    userId: string,
  ): Promise<{ id: string; asset: string; locked: Big; available: Big }[]> {
    const rows = await this.db
      .select(balanceRowMap)
      .from(balances)
      .where(and(eq(balances.userId, userId)));
    return rows;
  }
  async deposit(userId: string, asset: string, amount: Big): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [balance] = await tx
        .insert(balances)
        .values({
          asset,
          userId,
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
      if (!balance) throw new AppError("INTERNAL_SERVER_ERROR");
      const balanceAfter = balance.available;
      const balanceBefore = balanceAfter.minus(amount);

      await tx.insert(ledgerEntries).values({
        userId,
        asset,
        type: "deposit",
        amount,
        balanceBefore,
        balanceAfter,
      });
    });
  }
}
