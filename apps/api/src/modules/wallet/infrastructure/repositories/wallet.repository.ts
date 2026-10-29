import { balances, Db, ledgerEntries } from "@repo/db";
import Big from "big.js";
import { and, asc, count, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { LedgerEntryType, PaginatedResult } from "@repo/types";
import { applyPagination } from "@/utils/pagination";

const balanceRowMap = {
  asset: balances.asset,
  locked: balances.locked,
  available: balances.available,
  id: balances.id,
};

export class WalletRepository {
  constructor(private db: Db) {}

  async getSingleAsset(
    userId: string,
    asset: string,
    page = 1,
    pageSize = 20,
    filters: { from?: Date; types?: LedgerEntryType[] } = {},
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
    // یک where مشترک برای لیست و شمارش (undefined توسط and نادیده گرفته می‌شود)
    const historyWhere = and(
      eq(ledgerEntries.userId, userId),
      eq(ledgerEntries.asset, asset),
      filters.from ? gte(ledgerEntries.createdAt, filters.from) : undefined,
      filters.types?.length
        ? inArray(ledgerEntries.type, filters.types)
        : undefined,
    );

    const historyBaseQuery = this.db
      .select({
        time: ledgerEntries.createdAt,
        amount: ledgerEntries.amount,
        type: ledgerEntries.type,
      })
      .from(ledgerEntries)
      .where(historyWhere)
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
        .where(historyWhere),
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

  /**
   * داده‌ی خام نمودار روند از ledger:
   * - rows: ورودی‌های ledger از `from` به بعد (صعودی) با balanceBefore/After
   * - openingBalance: balanceAfter آخرین ورودی قبل از `from` (اگر باشد)
   */
  async getBalanceTrend(userId: string, asset: string, from: Date) {
    const [rows, prev] = await Promise.all([
      this.db
        .select({
          time: ledgerEntries.createdAt,
          before: ledgerEntries.balanceBefore,
          after: ledgerEntries.balanceAfter,
        })
        .from(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.userId, userId),
            eq(ledgerEntries.asset, asset),
            gte(ledgerEntries.createdAt, from),
          ),
        )
        .orderBy(asc(ledgerEntries.createdAt)),

      this.db
        .select({ after: ledgerEntries.balanceAfter })
        .from(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.userId, userId),
            eq(ledgerEntries.asset, asset),
            lt(ledgerEntries.createdAt, from),
          ),
        )
        .orderBy(desc(ledgerEntries.createdAt))
        .limit(1),
    ]);

    return { rows, openingBalance: prev[0]?.after ?? null };
  }
}