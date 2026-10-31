// features/wallet/hooks/usePortfolioValuation.ts
"use client";

import { useMemo } from "react";
import { useWalletBalance } from "@/features/wallet/hooks/useWalletBalance";
import { useAssetPrices } from "@/hooks/useAssetPrice";

export type PortfolioRow = {
  asset: string;
  amount: number; // available + locked
  price: number; // USD
  value: number; // amount * price
  lockedValue: number; // locked * price
};

/**
 * ارزش دلاری دارایی‌های کاربر = موجودی (قابل‌استفاده + قفل‌شده) × قیمت لحظه‌ای.
 * دارایی‌هایی که قیمت ندارند در `missing` می‌آیند و در جمع حساب نمی‌شوند.
 */
export function usePortfolioValuation() {
  const balances = useWalletBalance();

  const assets = useMemo(
    () => (balances.data ?? []).map((b) => b.asset),
    [balances.data],
  );
  const { priceOf, status } = useAssetPrices(assets);

  const valuation = useMemo(() => {
    const rows: PortfolioRow[] = [];
    const missing: string[] = [];
    let total = 0;
    let lockedValue = 0;

    for (const b of balances.data ?? []) {
      const locked = Number(b.locked ?? 0);
      const amount = Number(b.available ?? 0) + locked;
      if (!(amount > 0)) continue;

      const price = priceOf(b.asset);
      if (price == null) {
        missing.push(b.asset);
        continue;
      }

      const value = amount * price;
      rows.push({
        asset: b.asset,
        amount,
        price,
        value,
        lockedValue: locked * price,
      });
      total += value;
      lockedValue += locked * price;
    }

    return { rows, missing, total, lockedValue };
  }, [balances.data, priceOf]);

  return {
    ...valuation,
    isLoading: balances.isPending,
    isError: balances.isError,
    status,
  };
}