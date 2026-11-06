import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import type {
  GetRecentTradesReply,
  MarketPricesReply,
  WalletGetReply,
} from "@repo/types";
import { serverFetch } from "@/lib/serverFetch";
import { tradePaths } from "./index";
import { tradeQueries } from "./trade.queries";
import type { RecentTradesFilters } from "./trade.keys";
import { walletPaths } from "@/features/wallet/api";
import { walletQueries } from "@/features/wallet/api/wallet.queries";

/**
 * Prefetches all initial data for the trade page on the server:
 * 1. Recent trades matching the active symbol and table filter/pagination/sort URL params.
 * 2. User wallet balances for OpenOrderForm (openOrderForm.tsx:L65).
 * 3. Market prices for live ticker seeding.
 */
export function prefetchTradePage(
  qc: QueryClient,
  filters: RecentTradesFilters,
) {
  return Promise.all([
    qc.prefetchQuery({
      ...tradeQueries.recent(filters),
      queryFn: () =>
        serverFetch<GetRecentTradesReply>(tradePaths.recentTrades(filters)),
    }),
    qc.prefetchQuery({
      ...walletQueries.balance(),
      queryFn: () => serverFetch<WalletGetReply[]>(walletPaths.balance()),
    }),
    qc.prefetchQuery({
      ...walletQueries.marketPrices(),
      queryFn: () =>
        serverFetch<MarketPricesReply>(walletPaths.marketPrices()),
    }),
  ]);
}
