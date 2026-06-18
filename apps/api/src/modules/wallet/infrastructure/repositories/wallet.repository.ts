import { balances, Db, ledgerEntries } from "@repo/db";
import Big from "big.js";
import { and, count, desc, eq } from "drizzle-orm";
import { PaginatedResult } from "@repo/types";
import { applyPagination } from "@/utils/pagination";

const balanceRowMap = {
  asset: balances.asset,
  locked: balances.locked,
  available: balances.available,
  id: balances.id,
};

export class WalletRepository  {
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
    const historyBaseQuery = this.db
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

    const [balanceRows, historyRows, totalRows] = await Promise.all([
      this.db
        .select(balanceRowMap)
        .from(balances)
        .where(and(eq(balances.userId, userId), eq(balances.asset, asset))),

      applyPagination(historyBaseQuery.$dynamic(), page, pageSize),

      this.db
        .select({ value: count() })
        .from(ledgerEntries)
        .where(
          and(eq(ledgerEntries.userId, userId), eq(ledgerEntries.asset, asset)),
        ),
    ]);

    const row = balanceRows[0];

    if (!row) {
      return undefined;
    }

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
    return this.db
      .select(balanceRowMap)
      .from(balances)
      .where(eq(balances.userId, userId));
  }
}
