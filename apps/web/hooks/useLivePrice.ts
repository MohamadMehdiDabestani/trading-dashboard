"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MarketPricesReply, SymbolValue } from "@repo/types";
import { apiFetch } from "@/lib/apiClient";
import {
  baseToSymbol,
  marketSocket,
  type LivePrice,
  type SocketStatus,
} from "@/lib/marketSocket";

const EMPTY: Record<string, LivePrice> = {};

/** قیمت اولیه از REST تا اولین tick برسد */
function useSeedPrices(enabled: boolean) {
  const q = useQuery({
    queryKey: ["market", "prices"],
    queryFn: () => apiFetch<MarketPricesReply>("market/prices"),
    staleTime: 60_000,
    enabled,
  });

  useEffect(() => {
    if (!q.data) return;
    const bySymbol: Record<string, string> = {};
    for (const [base, price] of Object.entries(q.data)) {
      const symbol = baseToSymbol[base];
      if (symbol) bySymbol[symbol] = price;
    }
    marketSocket.seed(bySymbol);
  }, [q.data]);
}

/** چند نماد همزمان */
export function useLivePrices(symbols: readonly SymbolValue[]) {
  const key = symbols.join(",");

  useEffect(() => {
    if (!key) return;
    return marketSocket.retain(key.split(","));
  }, [key]);

  useSeedPrices(symbols.length > 0);

  const all = useSyncExternalStore(
    marketSocket.subscribe,
    marketSocket.getPrices,
    () => EMPTY,
  );
  const status: SocketStatus = useSyncExternalStore(
    marketSocket.subscribe,
    marketSocket.getStatus,
    () => "idle",
  );

  const prices = useMemo(() => {
    const out: Partial<Record<SymbolValue, LivePrice>> = {};
    for (const s of key ? (key.split(",") as SymbolValue[]) : []) {
      if (all[s]) out[s] = all[s];
    }
    return out;
  }, [all, key]);

  return { prices, status };
}

/** یک نماد */
export function useLivePrice(symbol: SymbolValue | undefined) {
  useEffect(() => {
    if (!symbol) return;
    return marketSocket.retain([symbol]);
  }, [symbol]);

  useSeedPrices(Boolean(symbol));

  return useSyncExternalStore(
    marketSocket.subscribe,
    () => (symbol ? marketSocket.prices[symbol] : undefined),
    () => undefined,
  );
}