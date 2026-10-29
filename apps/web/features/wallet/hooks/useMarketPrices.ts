"use client";

import { useQuery } from "@tanstack/react-query";
import { marketKeys } from "../api/wallet.keys";
import { marketApi } from "../api";

// قیمت‌ها هر ۵ ثانیه تازه می‌شوند تا ارزش دلاری زنده بماند
export function useMarketPrices() {
  return useQuery({
    queryKey: marketKeys.prices,
    queryFn: marketApi.getPrices,
    refetchInterval: 5_000,
    staleTime: 4_000,
  });
}