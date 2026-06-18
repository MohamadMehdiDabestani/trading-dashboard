import { DbTransaction, ledgerEntries } from "@repo/db";
import { sql } from "drizzle-orm";
import { toDbDecimal } from "@/utils/scaleBigInt";

export type LedgerDraft = {
  userId: string;
  asset: string;
  amount: bigint;
  type: "trade_buy" | "trade_sell" | "fee" | "unlock";
  refType: "close_trade" | "order";
  refId: string;
  balanceBefore?: bigint;
  balanceAfter?: bigint;
  meta?: Record<string, unknown> | null;
};

export class LedgerTxRepository {
  constructor(private readonly tx: DbTransaction) {}

  async insertMany(rows: LedgerDraft[]) {
    if (rows.length === 0) return;

    await this.tx.insert(ledgerEntries).values(
      rows.map((r) => ({
        userId: r.userId,
        asset: r.asset,
        amount: sql`${toDbDecimal(r.amount)}`,
        balanceBefore: sql`${toDbDecimal(r.balanceBefore ?? 0n)}`,
        balanceAfter: sql`${toDbDecimal(r.balanceAfter ?? 0n)}`,
        type: r.type,
        refType: r.refType,
        refId: r.refId,
        meta: r.meta ?? null,
      })),
    );
  }

  async insertUnlock(input: {
    userId: string;
    asset: string;
    amount: bigint;
    balanceBefore: bigint;
    balanceAfter: bigint;
    orderId: string;
    meta?: Record<string, unknown> | null;
  }) {
    await this.tx.insert(ledgerEntries).values({
      userId: input.userId,
      asset: input.asset,
      amount: sql`${toDbDecimal(input.amount)}`,
      balanceBefore: sql`${toDbDecimal(input.balanceBefore)}`,
      balanceAfter: sql`${toDbDecimal(input.balanceAfter)}`,
      type: "unlock",
      refType: "order",
      refId: input.orderId,
      meta: input.meta ?? null,
    });
  }
}
