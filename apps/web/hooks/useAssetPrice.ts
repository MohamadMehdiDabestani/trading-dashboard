"use client";

import { useCallback, useMemo } from "react";
import type { SymbolValue } from "@repo/types";
import { baseToSymbol } from "@/lib/marketSocket";
import { useLivePrices } from "./useLivePrice";

export function useAssetPrices(assets: readonly string[]) {
  const key = assets.join(",");

  const symbols = useMemo(() => {
    const set = new Set<SymbolValue>();
    for (const a of key ? key.split(",") : []) {
      const s = baseToSymbol[a];
      if (s) set.add(s as SymbolValue);
    }
    return [...set].sort();
  }, [key]);

  const { prices, status } = useLivePrices(symbols);

  const priceOf = useCallback(
    (asset: string): number | null => {
      if (asset === "USDT") return 1;
      const sym = baseToSymbol[asset];
      const n = Number(sym ? prices[sym as SymbolValue]?.price : NaN);
      return Number.isFinite(n) && n > 0 ? n : null;
    },
    [prices],
  );

  return { priceOf, prices, status };
}