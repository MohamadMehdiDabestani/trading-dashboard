"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18nNavigation";
import { SYMBOLS, type SymbolValue } from "@repo/types";
import { useLivePrices } from "@/features/markets/hooks/useLivePrice";
import { cn } from "@/lib/cn";
import { TrendingUp, TrendingDown, Radio } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FEATURED_TICKERS } from "./constants";

const TICKER_SYMBOLS = FEATURED_TICKERS.map((t) => t.symbol) as SymbolValue[];

export function MarketTickers() {
  const t = useTranslations("navbar.live");
  const { prices, status } = useLivePrices(TICKER_SYMBOLS);

  const statusLabel = useMemo(() => {
    if (status === "live") return t("status");
    if (status === "reconnecting") return t("reconnecting");
    return t("connecting");
  }, [status, t]);

  return (
    <div className="hidden xl:flex items-center gap-2 min-w-0">
      {/* Live status badge */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/60 border border-border/50 text-[11px] font-medium text-muted-foreground cursor-default select-none shrink-0">
            <span className="relative flex size-2">
              {status === "live" && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={cn(
                  "relative inline-flex size-2 rounded-full",
                  status === "live"
                    ? "bg-emerald-500"
                    : status === "reconnecting"
                      ? "bg-amber-500"
                      : "bg-muted-foreground/50",
                )}
              />
            </span>
            <span className="hidden 2xl:inline">{statusLabel}</span>
            <Radio className="size-3 opacity-70 shrink-0" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{statusLabel}</p>
        </TooltipContent>
      </Tooltip>

      {/* Featured ticker pills: top 2 on xl, all 4 on 2xl */}
      <div className="flex items-center gap-1.5 min-w-0">
        {FEATURED_TICKERS.map((item, index) => {
          const coinMeta = SYMBOLS.find((s) => s.value === item.symbol);
          const live = prices[item.symbol as SymbolValue];
          const isUp = live?.direction === "up";
          const isDown = live?.direction === "down";

          const formattedPrice = live?.price
            ? Number(live.price).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "—";

          return (
            <Link
              key={item.symbol}
              href={`/dashboard/trade/${coinMeta?.slug ?? "btc"}`}
              className={cn(
                "group items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border/60 bg-background/50 hover:bg-accent/60 hover:border-border transition-all shrink-0",
                index >= 2 ? "hidden 2xl:flex" : "flex",
                isUp && "border-emerald-500/30 bg-emerald-500/5",
                isDown && "border-rose-500/30 bg-rose-500/5",
              )}
            >
              <span className={cn("font-bold text-[11px]", item.color)}>
                {item.label}
              </span>
              <span
                dir="ltr"
                className={cn(
                  "font-mono font-semibold text-[11px] transition-colors",
                  isUp && "text-emerald-600 dark:text-emerald-400",
                  isDown && "text-rose-600 dark:text-rose-400",
                  !isUp && !isDown && "text-foreground/90",
                )}
              >
                ${formattedPrice}
              </span>
              {isUp && (
                <TrendingUp className="size-3 text-emerald-500 shrink-0" />
              )}
              {isDown && (
                <TrendingDown className="size-3 text-rose-500 shrink-0" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
