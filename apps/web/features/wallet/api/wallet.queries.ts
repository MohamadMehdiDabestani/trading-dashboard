import { queryOptions } from "@tanstack/react-query";
import type { WalletHistoryFilters, WalletTrendRange } from "@repo/types";
import { marketKeys, walletKeys } from "./wallet.keys";
import { marketApi, walletApi } from "./index";

/**
 * Single source of truth for wallet query key + staleTime.
 * Client hooks use these as-is; the server prefetch spreads them and swaps
 * only `queryFn`, so the dehydrated cache lines up with the client keys.
 */
export const walletQueries = {
  balance: () =>
    queryOptions({
      queryKey: walletKeys.balance(),
      queryFn: walletApi.getBalance,
      staleTime: 10_000,
    }),

  notifications: (limit = 20) =>
    queryOptions({
      queryKey: walletKeys.notifications(limit),
      queryFn: () => walletApi.getNotifications(limit),
      staleTime: 10_000,
      refetchInterval: 15_000,
    }),

  asset: (
    asset: string,
    page: number,
    pageSize: number,
    filters: WalletHistoryFilters,
  ) =>
    queryOptions({
      queryKey: walletKeys.asset(asset, page, pageSize, filters),
      queryFn: () => walletApi.getAsset(asset, page, pageSize, filters),
      staleTime: 10_000,
    }),

  trend: (asset: string, range: WalletTrendRange) =>
    queryOptions({
      queryKey: walletKeys.trend(asset, range),
      queryFn: () => walletApi.getTrend(asset, range),
      staleTime: 30_000,
    }),

  marketPrices: () =>
    queryOptions({
      queryKey: marketKeys.prices,
      queryFn: marketApi.getPrices,
      staleTime: 60_000,
    }),
};
