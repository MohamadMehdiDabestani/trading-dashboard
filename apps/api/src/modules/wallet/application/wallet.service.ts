import Big from "big.js";
import {
  WalletAssetReply,
  WalletHistoryFilters,
  WalletGetReply,
  WalletTrendRange,
  WalletTrendReply,
} from "@repo/types";
import { WalletRepository } from "../infrastructure/repositories/wallet.repository";
import { DrizzleWalletUnitOfWork } from "../infrastructure/unitOfWork/drizzleUnitOfWork";

const DAY = 24 * 60 * 60 * 1000;
const RANGE_MS: Record<WalletTrendRange, number> = {
  "1D": DAY,
  "1W": 7 * DAY,
  "1M": 30 * DAY,
  "1Y": 365 * DAY,
};
const MAX_POINTS = 120;

export class WalletService {
  constructor(
    private walletQuery: WalletRepository,
    private walletUow: DrizzleWalletUnitOfWork,
  ) {}

  async getSingleAsset(
    userId: string,
    asset: string,
    page = 1,
    pageSize = 20,
    filters: WalletHistoryFilters = {},
  ): Promise<WalletAssetReply> {
    const res = await this.walletQuery.getSingleAsset(
      userId,
      asset,
      page,
      pageSize,
      {
        from: filters.period
          ? new Date(Date.now() - RANGE_MS[filters.period])
          : undefined,
        types: filters.types,
      },
    );

    if (!res) {
      return {
        asset,
        locked: new Big("0"),
        available: new Big("0"),
        history: {
          items: [],
          page,
          pageSize,
          total: 0,
          totalPage: 0,
        },
      };
    }

    return res;
  }

  async getBalance(userId: string): Promise<WalletGetReply[]> {
    return this.walletQuery.getBalance(userId);
  }

  async getTrend(
    userId: string,
    asset: string,
    range: WalletTrendRange = "1M",
  ): Promise<WalletTrendReply> {
    const now = new Date();
    const from = new Date(now.getTime() - RANGE_MS[range]);

    const [{ rows, openingBalance }, balances] = await Promise.all([
      this.walletQuery.getBalanceTrend(userId, asset, from),
      this.walletQuery.getBalance(userId),
    ]);

    const current = balances.find((b) => b.asset === asset)?.available;

    const start: Big | null = openingBalance
      ? new Big(openingBalance)
      : rows[0]
        ? new Big(rows[0].before)
        : (current ?? null);

    if (!start) return { range, points: [], changePercent: null };

    let points: { time: Date; balance: Big }[] = [
      { time: from, balance: start },
      ...rows.map((r) => ({ time: r.time, balance: new Big(r.after) })),
    ];
    // نقطه‌ی «اکنون» = موجودی قابل‌استفاده‌ی فعلی
    points.push({ time: now, balance: current ?? points.at(-1)!.balance });

    if (points.length > MAX_POINTS) {
      const step = Math.ceil(points.length / MAX_POINTS);
      const last = points[points.length - 1]!;
      points = points.filter((_, i) => i % step === 0);
      if (points[points.length - 1] !== last) points.push(last);
    }

    const end = points[points.length - 1]!.balance;
    const changePercent = start.eq(0)
      ? null
      : Number(end.minus(start).div(start).times(100).toFixed(2));

    return {
      range,
      points: points.map((p) => ({
        time: p.time.toISOString(),
        balance: p.balance.toFixed(),
      })),
      changePercent,
    };
  }

  async deposit(userId: string, asset: string, amount: Big): Promise<void> {
    await this.walletUow.run(async ({ balance, ledger }) => {
      const { balanceBefore, balanceAfter } = await balance.creditAvailable({
        userId,
        asset,
        amount,
      });

      await ledger.createDepositEntry({
        userId,
        asset,
        amount,
        balanceBefore,
        balanceAfter,
      });
    });
  }
}