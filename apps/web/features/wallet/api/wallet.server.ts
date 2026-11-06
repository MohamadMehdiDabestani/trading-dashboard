import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import type {
  MarketPricesReply,
  WalletAssetReply,
  WalletGetReply,
  WalletTrendReply,
} from "@repo/types";
import { serverFetch } from "@/lib/serverFetch";
import { walletPaths } from "./index";
import { walletQueries } from "./wallet.queries";
import {
  WALLET_DEFAULT_ASSET,
  WALLET_DEFAULT_RANGE,
  WALLET_PAGE_SIZE,
} from "../constants";

/**
 * Prefetch everything the wallet page renders in its initial state
 * (default asset, page 1, no filters, default trend range).
 */
export function prefetchWalletPage(qc: QueryClient) {
  const asset = WALLET_DEFAULT_ASSET;
  const range = WALLET_DEFAULT_RANGE;
  const filters = {};

  return Promise.all([
    qc.prefetchQuery({
      ...walletQueries.balance(),
      queryFn: () => serverFetch<WalletGetReply[]>(walletPaths.balance()),
    }),
    qc.prefetchQuery({
      ...walletQueries.asset(asset, 1, WALLET_PAGE_SIZE, filters),
      queryFn: () =>
        serverFetch<WalletAssetReply>(
          walletPaths.asset(asset, 1, WALLET_PAGE_SIZE, filters),
        ),
    }),
    qc.prefetchQuery({
      ...walletQueries.trend(asset, range),
      queryFn: () =>
        serverFetch<WalletTrendReply>(walletPaths.trend(asset, range)),
    }),
    qc.prefetchQuery({
      ...walletQueries.marketPrices(),
      queryFn: () =>
        serverFetch<MarketPricesReply>(walletPaths.marketPrices()),
    }),
  ]);
}
