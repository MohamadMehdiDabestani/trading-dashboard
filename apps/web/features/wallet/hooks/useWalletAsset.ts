"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { WalletHistoryFilters } from "@repo/types";
import { walletKeys } from "../api/wallet.keys";
import { walletApi } from "../api";

export function useWalletAsset(
  asset: string,
  page = 1,
  pageSize = 10,
  filters: WalletHistoryFilters = {},
) {
  return useQuery({
    queryKey: walletKeys.asset(asset, page, pageSize, filters),
    queryFn: () => walletApi.getAsset(asset, page, pageSize, filters),
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  });
}