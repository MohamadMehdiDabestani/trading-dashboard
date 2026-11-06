import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type {
  GetRecentTradesReply,
  MarketPricesReply,
  TradeStatsReply,
} from "@repo/types";
import { apiFetch } from "@/lib/apiClient";
import { dashboardKeys } from "./dashboard.keys";
import { dashboardPaths } from "./dashboard.paths";
import type {
  DashboardOrdersKind,
  DashboardOrdersParams,
  WalletBalance,
} from "./dashboard.types";

export const DEFAULT_DASHBOARD_ORDERS_PARAMS: DashboardOrdersParams = {
  page: 1,
  pageSize: 10,
  sortBy: "createdAt",
  sortOrder: "desc",
};

/**
 * Single source of truth for dashboard query keys and staleTime.
 */
export const dashboardQueries = {
  stats: () =>
    queryOptions({
      queryKey: dashboardKeys.stats(),
      queryFn: () => apiFetch<TradeStatsReply>(dashboardPaths.stats()),
      staleTime: 60_000,
    }),

  balances: () =>
    queryOptions({
      queryKey: dashboardKeys.balances(),
      queryFn: () => apiFetch<WalletBalance[]>(dashboardPaths.balances()),
      staleTime: 15_000,
    }),

  marketPrices: () =>
    queryOptions({
      queryKey: dashboardKeys.marketPrices,
      queryFn: () => apiFetch<MarketPricesReply>(dashboardPaths.marketPrices()),
      staleTime: 60_000,
    }),

  orders: (kind: DashboardOrdersKind, p: DashboardOrdersParams) =>
    queryOptions({
      queryKey: dashboardKeys.orders(kind, p),
      queryFn: () =>
        apiFetch<GetRecentTradesReply>(dashboardPaths.orders(kind, p)),
      placeholderData: keepPreviousData,
      staleTime: 15_000,
      refetchInterval: kind === "open" ? 10_000 : false,
    }),
};
