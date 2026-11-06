"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { WalletHistoryFilters } from "@repo/types";
import { walletQueries } from "../api/wallet.queries";

export function useWalletAsset(
  asset: string,
  page = 1,
  pageSize = 10,
  filters: WalletHistoryFilters = {},
) {
  return useQuery({
    ...walletQueries.asset(asset, page, pageSize, filters),
    placeholderData: keepPreviousData,
  });
}
