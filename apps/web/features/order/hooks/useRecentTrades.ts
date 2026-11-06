"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { RecentTradesFilters } from "../api/trade.keys";
import { tradeQueries } from "../api/trade.queries";

const ACTIVE_POLL_MS = 10_000;

export function useRecentTrades(filters: RecentTradesFilters) {
  return useQuery({
    ...tradeQueries.recent(filters),
    enabled: Boolean(filters.symbol),
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
