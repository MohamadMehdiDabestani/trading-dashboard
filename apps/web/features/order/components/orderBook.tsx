import React, { useState, useMemo, Fragment } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronUp,
  ChevronDown,
  Layers,
  Play,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOrderBookSocket } from "../hooks/useOrderBookSocket";

type ViewMode = "both" | "buys" | "sells";

type OrderBookProps = {
  symbol: string; // مثلاً "BTCUSDT"
  baseAsset?: string;
  quoteAsset?: string;
};

const formatNumber = (num: number, decimals: number = 0) =>
  num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export const OrderBook = ({
  symbol,
  baseAsset = "BTC",
  quoteAsset = "USDT",
}: OrderBookProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [isLive, setIsLive] = useState(true);

  const { asks: sells, bids: buys, lastPrice, status } = useOrderBookSocket(
    symbol,
    !isLive,
  );

  const maxSellsAmount = useMemo(
    () => Math.max(...sells.map((s) => s.amount), 1e-9),
    [sells],
  );
  const maxBuysAmount = useMemo(
    () => Math.max(...buys.map((b) => b.amount), 1e-9),
    [buys],
  );

  return (
    <Fragment>
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-1.5 ps-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setViewMode("sells")}
                className={viewMode === "sells" ? "bg-primary/10" : ""}
              >
                <ChevronUp className="w-4 h-4 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>فقط سفارش های فروش</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setViewMode("buys")}
                className={viewMode === "buys" ? "bg-primary/10" : ""}
              >
                <ChevronDown className="w-4 h-4 text-emerald-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>فقط سفارش های خرید</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setViewMode("both")}
                className={viewMode === "both" ? "bg-primary/10" : ""}
              >
                <Layers className="w-4 h-4 rotate-90" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>همه ی موارد</TooltipContent>
          </Tooltip>
        </div>
        {status !== "live" && (
          <span className="pe-3 text-[10px] text-muted-foreground">
            {status === "connecting" ? "در حال اتصال..." : "اتصال مجدد..."}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border/30">
        <div className="text-right">قیمت ({quoteAsset})</div>
        <div className="text-center">مقدار ({baseAsset})</div>
        <div className="text-left">کل</div>
      </div>

      {(viewMode === "both" || viewMode === "sells") && (
        <div className="flex flex-col py-1 overflow-hidden">
          <ScrollArea className={cn(viewMode === "both" ? "h-50" : "h-[400px]")}>
            {sells.map((sell) => {
              const percentage = Math.min(
                (sell.amount / maxSellsAmount) * 100,
                100,
              );
              return (
                <div
                  key={`sell-${sell.price}`}
                  className="relative grid grid-cols-3 px-4 py-1 text-xs hover:bg-muted transition-colors duration-150 cursor-pointer items-center z-10"
                >
                  <div
                    className="absolute top-0 bottom-0 right-0 bg-rose-500/10 dark:bg-rose-500/15 pointer-events-none transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="text-right font-mono font-semibold text-rose-500 z-10">
                    {formatNumber(sell.price, 1)}
                  </div>
                  <div className="text-center font-mono text-foreground/90 z-10">
                    {sell.amount.toFixed(4)}
                  </div>
                  <div className="text-left font-mono text-foreground/80 z-10">
                    {formatNumber(sell.total, 1)}
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 my-1 border-y border-border/50 bg-muted/20">
        <Button
          onClick={() => setIsLive(!isLive)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          title={isLive ? "توقف به‌روزرسانی زنده" : "شروع به‌روزرسانی زنده"}
          variant="ghost"
        >
          {isLive ? (
            <Pause className="w-3 h-3 text-emerald-500" />
          ) : (
            <Play className="w-3 h-3" />
          )}
          <span>{isLive ? "Live" : "Static"}</span>
        </Button>

        {lastPrice ? (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-lg font-bold font-mono transition-colors duration-300",
                lastPrice.direction === "up"
                  ? "text-emerald-500"
                  : "text-rose-500",
              )}
            >
              {formatNumber(lastPrice.price, 2)}
            </span>
            {lastPrice.direction === "up" ? (
              <ArrowUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <ArrowDown className="w-4 h-4 text-rose-500" />
            )}
          </div>
        ) : (
          <span className="text-lg font-mono text-muted-foreground">—</span>
        )}
      </div>

      {(viewMode === "both" || viewMode === "buys") && (
        <div className="flex flex-col py-1 overflow-hidden">
          <ScrollArea className={cn(viewMode === "both" ? "h-50" : "h-[400px]")}>
            {buys.map((buy) => {
              const percentage = Math.min(
                (buy.amount / maxBuysAmount) * 100,
                100,
              );
              return (
                <div
                  key={`buy-${buy.price}`}
                  className="group relative grid grid-cols-3 px-4 py-1 text-xs hover:bg-muted transition-colors duration-150 cursor-pointer items-center z-10"
                >
                  <div
                    className="absolute inset-y-0 right-0 bg-emerald-500/10 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="text-right font-mono font-semibold text-emerald-500 z-10">
                    {formatNumber(buy.price, 1)}
                  </div>
                  <div className="text-center font-mono text-foreground/90 z-10">
                    {buy.amount.toFixed(4)}
                  </div>
                  <div className="text-left font-mono text-foreground/80 z-10">
                    {formatNumber(buy.total, 2)}
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </div>
      )}
    </Fragment>
  );
};