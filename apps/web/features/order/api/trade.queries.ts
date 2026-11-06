import { queryOptions } from "@tanstack/react-query";
import { tradeKeys, type RecentTradesFilters } from "./trade.keys";
import { tradeApi } from "./index";

/**
 * Single source of truth for trade query options (queryKey + queryFn + staleTime).
 * Client hooks use these as-is; server prefetching spreads them and swaps queryFn with serverFetch.
 */
export const tradeQueries = {
  recent: (filters: RecentTradesFilters) =>
    queryOptions({
      queryKey: tradeKeys.recent(filters),
      queryFn: () => tradeApi.getRecentTrades(filters),
      staleTime: 15_000,
    }),
};
