"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { tradeKeys, type RecentTradesFilters } from "../api/trade.keys";
import { tradeApi } from "../api";

const ACTIVE_POLL_MS = 10_000;

export function useRecentTrades(filters: RecentTradesFilters) {
  return useQuery({
    queryKey: tradeKeys.recent(filters),
    queryFn: () => tradeApi.getRecentTrades(filters),
    enabled: Boolean(filters.symbol),
    staleTime: 15_000,
    // keep the old rows on screen while the next page / sort loads (no flicker)
    placeholderData: keepPreviousData,
    // auto refresh only while there are orders that can still change
    refetchInterval: (query) => {
      const items = query.state.data?.items;
      const hasActive = items?.some(
        (o) => o.status === "open" || o.status === "partial",
      );
      return hasActive ? ACTIVE_POLL_MS : false;
    },
  });
}