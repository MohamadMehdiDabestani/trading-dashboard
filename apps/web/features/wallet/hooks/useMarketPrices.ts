"use client";

import { useQuery } from "@tanstack/react-query";
import { walletQueries } from "../api/wallet.queries";

// قیمت‌ها هر ۵ ثانیه تازه می‌شوند تا ارزش دلاری زنده بماند
export function useMarketPrices() {
  return useQuery({
    ...walletQueries.marketPrices(),
    refetchInterval: 5_000,
    staleTime: 4_000,
  });
}