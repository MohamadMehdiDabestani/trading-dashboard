import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import type {
  GetRecentTradesReply,
  MarketPricesReply,
  TradeStatsReply,
} from "@repo/types";
import { serverFetch } from "@/lib/serverFetch";
import { dashboardPaths } from "./dashboard.paths";
import {
  dashboardQueries,
  DEFAULT_DASHBOARD_ORDERS_PARAMS,
} from "./dashboard.queries";
import type { WalletBalance } from "./dashboard.types";

/**
 * Prefetches all critical queries for the Dashboard Overview page:
 * - Trade success statistics
 * - Wallet balances
 * - Market seed prices
 * - Default recent trade history orders (page 1, pageSize 10, newest first)
 * - Default open orders (page 1, pageSize 10)
 */
export function prefetchDashboardPage(qc: QueryClient) {
  const defaultParams = DEFAULT_DASHBOARD_ORDERS_PARAMS;

  return Promise.all([
    qc.prefetchQuery({
      ...dashboardQueries.stats(),
      queryFn: () => serverFetch<TradeStatsReply>(dashboardPaths.stats()),
    }),
    qc.prefetchQuery({
      ...dashboardQueries.balances(),
      queryFn: () =>
        serverFetch<WalletBalance[]>(dashboardPaths.balances()),
    }),
    qc.prefetchQuery({
      ...dashboardQueries.marketPrices(),
      queryFn: () =>
        serverFetch<MarketPricesReply>(dashboardPaths.marketPrices()),
    }),
    // History orders (active tab default)
    qc.prefetchQuery({
      ...dashboardQueries.orders("history", defaultParams),
      queryFn: () =>
        serverFetch<GetRecentTradesReply>(
          dashboardPaths.orders("history", defaultParams),
        ),
    }),
    // Open orders (tab switch instant)
    qc.prefetchQuery({
      ...dashboardQueries.orders("open", defaultParams),
      queryFn: () =>
        serverFetch<GetRecentTradesReply>(
          dashboardPaths.orders("open", defaultParams),
        ),
    }),
  ]);
}
