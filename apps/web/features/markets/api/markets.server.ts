import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import type { MarketPricesReply } from "@repo/types";
import { serverFetch } from "@/lib/serverFetch";
import { marketsPaths } from "./markets.paths";
import { marketsQueries } from "./markets.queries";

/**
 * Prefetches all live market seed prices for SSR hydration.
 */
export function prefetchMarketsPage(qc: QueryClient) {
  return qc.prefetchQuery({
    ...marketsQueries.prices(),
    queryFn: () => serverFetch<MarketPricesReply>(marketsPaths.prices()),
  });
}
