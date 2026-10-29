"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { WalletTrendRange } from "@repo/types";
import { walletKeys } from "../api/wallet.keys";
import { walletApi } from "../api";

export function useWalletTrend(asset: string, range: WalletTrendRange) {
  return useQuery({
    queryKey: walletKeys.trend(asset, range),
    queryFn: () => walletApi.getTrend(asset, range),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}