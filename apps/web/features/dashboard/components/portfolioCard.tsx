import { useMemo } from "react";
import { useWalletBalances } from "../hooks/useDashboard";
import { SymbolValue } from "@repo/types";
import { baseToSymbol } from "@/lib/marketSocket";
import { useLivePrices } from "@/hooks/useLivePrice";
import { Card, CardContent } from "@/components/ui/card";
import { Pulse } from "@/components/pulse";
import { Wallet } from "lucide-react";

const usd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const PortfolioCard = ()=> {
  const { data: balances, isLoading } = useWalletBalances();

  const symbols = useMemo(() => {
    const set = new Set<SymbolValue>();
    for (const b of balances ?? []) {
      const s = baseToSymbol[b.asset];
      if (s) set.add(s as SymbolValue);
    }
    return [...set].sort();
  }, [balances]);

  const { prices } = useLivePrices(symbols);

  const { total, locked, missing } = useMemo(() => {
    let total = 0, locked = 0, missing = false;
    for (const b of balances ?? []) {
      const av = Number(b.available), lk = Number(b.locked);
      if (av + lk <= 0) continue;
      const price =
        b.asset === "USDT"
          ? 1
          : Number(prices[baseToSymbol[b.asset] as SymbolValue]?.price);
      if (!price || Number.isNaN(price)) {
        missing = true;
        continue;
      }
      total += (av + lk) * price;
      locked += lk * price;
    }
    return { total, locked, missing };
  }, [balances, prices]);

  return (
    <Card className="overflow-hidden border border-border bg-card transition-all hover:shadow-sm">
      <CardContent className="p-6 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            ارزش کل دارایی‌ها (تخمینی)
          </span>
          {isLoading ? (
            <Pulse className="h-8 w-36" />
          ) : (
            <span dir="ltr" className="text-2xl font-bold tracking-tight text-start">
              {usd(total)}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            قفل‌شده در سفارش‌ها:{" "}
            <span dir="ltr" className="font-bold text-foreground">{usd(locked)}</span>
          </span>
          {missing && (
            <span className="text-[10px] text-amber-600">
              قیمت برخی دارایی‌ها در دسترس نیست و محاسبه نشده است
            </span>
          )}
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Wallet className="size-6" />
        </div>
      </CardContent>
    </Card>
  );
}