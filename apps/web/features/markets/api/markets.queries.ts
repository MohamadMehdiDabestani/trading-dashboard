import { queryOptions } from "@tanstack/react-query";
import type { MarketPricesReply } from "@repo/types";
import { apiFetch } from "@/lib/apiClient";
import { marketsKeys } from "./markets.keys";
import { marketsPaths } from "./markets.paths";

export const marketsQueries = {
  prices: () =>
    queryOptions({
      queryKey: marketsKeys.prices,
      queryFn: () => apiFetch<MarketPricesReply>(marketsPaths.prices()),
      staleTime: 60_000,
    }),
};
