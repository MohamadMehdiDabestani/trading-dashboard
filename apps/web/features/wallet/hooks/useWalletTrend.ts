"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { WalletTrendRange } from "@repo/types";
import { walletQueries } from "../api/wallet.queries";

export function useWalletTrend(asset: string, range: WalletTrendRange) {
  return useQuery({
    ...walletQueries.trend(asset, range),
    placeholderData: keepPreviousData,
  });
}
