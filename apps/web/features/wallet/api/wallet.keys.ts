import type { WalletHistoryFilters, WalletTrendRange } from "@repo/types";

export const walletKeys = {
  all: ["wallet"] as const,
  balance: () => [...walletKeys.all, "balance"] as const,
  asset: (
    asset: string,
    page: number,
    pageSize: number,
    filters: WalletHistoryFilters,
  ) => [...walletKeys.all, "asset", asset, page, pageSize, filters] as const,
  trend: (asset: string, range: WalletTrendRange) =>
    [...walletKeys.all, "trend", asset, range] as const,
};

export const marketKeys = {
  prices: ["market", "prices"] as const,
};