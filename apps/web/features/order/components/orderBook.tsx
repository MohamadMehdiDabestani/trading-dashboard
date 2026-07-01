import React, { useState, useEffect, useMemo, Fragment } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronUp,
  ChevronDown,
  Layers,
  Play,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/cn"; // متد استاندارد shadcn برای ادغام کلاس‌ها
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

// ساختار داده‌های دفتر سفارشات
interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

const initialSells: OrderBookEntry[] = [
  { price: 64245.0, amount: 0.1245, total: 8000.1 },
  { price: 64242.5, amount: 1.2, total: 77091.0 },
  { price: 64239.0, amount: 0.05, total: 3211.95 },
  { price: 64235.1, amount: 0.45, total: 28905.8 },
  { price: 64231.8, amount: 0.75, total: 48173.85 },
  { price: 64228.0, amount: 0.32, total: 20552.96 },
  { price: 64224.5, amount: 1.8, total: 115604.1 },
  { price: 64220.0, amount: 0.09, total: 5779.8 },
  { price: 64216.0, amount: 2.1, total: 134853.6 },
  { price: 64212.5, amount: 0.065, total: 4173.81 },
  { price: 64208.0, amount: 0.58, total: 37240.64 },
  { price: 64204.0, amount: 1.45, total: 93095.8 },
  { price: 64199.0, amount: 0.37, total: 23753.63 },
  { price: 64195.5, amount: 0.82, total: 52640.31 },
  { price: 64190.0, amount: 0.15, total: 9628.5 },
  { price: 64186.0, amount: 1.1, total: 70604.6 },
  { price: 64181.0, amount: 0.28, total: 17970.68 },
  { price: 64177.0, amount: 0.63, total: 40431.51 },
  { price: 64172.5, amount: 0.94, total: 60322.15 },
  { price: 64168.0, amount: 0.075, total: 4812.6 },
  { price: 64163.5, amount: 2.3, total: 147576.05 },
  { price: 64159.0, amount: 0.42, total: 26946.78 },
  { price: 64155.0, amount: 0.19, total: 12189.45 },
  { price: 64150.5, amount: 0.87, total: 55810.94 },
  { price: 64146.0, amount: 0.53, total: 33997.38 },
];

const initialBuys: OrderBookEntry[] = [
  { price: 64230.0, amount: 0.08, total: 5138.4 },
  { price: 64228.5, amount: 2.45, total: 157359.0 },
  { price: 64225.0, amount: 0.6, total: 38535.0 },
  { price: 64221.2, amount: 0.012, total: 770.65 },
  { price: 64218.0, amount: 1.35, total: 86694.3 },
  { price: 64214.5, amount: 0.23, total: 14769.34 },
  { price: 64211.0, amount: 0.78, total: 50084.58 },
  { price: 64207.0, amount: 0.045, total: 2889.32 },
  { price: 64203.5, amount: 1.65, total: 105935.78 },
  { price: 64200.0, amount: 0.31, total: 19902.0 },
  { price: 64196.0, amount: 0.92, total: 59060.32 },
  { price: 64192.5, amount: 0.17, total: 10912.73 },
  { price: 64188.0, amount: 2.1, total: 134794.8 },
  { price: 64184.5, amount: 0.44, total: 28241.18 },
  { price: 64180.0, amount: 0.56, total: 35940.8 },
  { price: 64176.5, amount: 0.095, total: 6096.77 },
  { price: 64172.0, amount: 1.4, total: 89840.8 },
  { price: 64168.0, amount: 0.27, total: 17325.36 },
  { price: 64164.0, amount: 0.83, total: 53256.12 },
  { price: 64160.0, amount: 0.13, total: 8340.8 },
  { price: 64156.5, amount: 1.9, total: 121897.35 },
  { price: 64152.0, amount: 0.48, total: 30792.96 },
  { price: 64148.5, amount: 0.36, total: 23093.46 },
  { price: 64144.0, amount: 0.7, total: 44900.8 },
  { price: 64140.5, amount: 0.21, total: 13469.51 },
];
type ViewMode = "both" | "buys" | "sells";

export const OrderBook = () => {
  const [sells, setSells] = useState<OrderBookEntry[]>(initialSells);
  const [buys, setBuys] = useState<OrderBookEntry[]>(initialBuys);
  const [lastPrice, setLastPrice] = useState({
    price: 64231.5,
    direction: "down" as "up" | "down",
  });
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [isLive, setIsLive] = useState(true);

  // شبیه‌ساز تغییرات زنده قیمت‌ها (Live updates simulation)
  useEffect(() => {
    if (!isLive) return;

    // const interval = setInterval(() => {
    //   // شبیه‌سازی تغییر قیمت لحظه‌ای
    //   setLastPrice((prev) => {
    //     const change = (Math.random() - 0.5) * 5;
    //     const nextPrice = +(prev.price + change).toFixed(2);
    //     return {
    //       price: nextPrice,
    //       direction: change >= 0 ? "up" : "down",
    //     };
    //   });

    //   // نوسان جزئی در حجم خریدها و فروش‌ها
    //   const updateEntries = (entries: OrderBookEntry[]) =>
    //     entries.map((item) => {
    //       if (Math.random() > 0.6) {
    //         const newAmount = +(
    //           item.amount *
    //           (0.9 + Math.random() * 0.2)
    //         ).toFixed(4);
    //         return {
    //           ...item,
    //           amount: newAmount,
    //           total: +(item.price * newAmount).toFixed(2),
    //         };
    //       }
    //       return item;
    //     });

    //   setSells((prev) => updateEntries(prev));
    //   setBuys((prev) => updateEntries(prev));
    // }, 1500);

    // return () => clearInterval(interval);
  }, [isLive]);

  // پیدا کردن بیشترین مقدار (Amount) برای محاسبه درصد عرض بارگراف پس‌زمینه
  const maxSellsAmount = useMemo(
    () => Math.max(...sells.map((s) => s.amount), 1),
    [sells],
  );
  const maxBuysAmount = useMemo(
    () => Math.max(...buys.map((b) => b.amount), 1),
    [buys],
  );

  // فرمت‌کننده اعداد با جداکننده هزارگان فارسی/انگلیسی استاندارد مالی
  const formatNumber = (num: number, decimals: number = 0) => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <Fragment>
      <div className="flex items-center justify-between  pb-2 border-b border-border/60">
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
                <Layers className="w-4 h-4 rotate-90 " />
              </Button>
            </TooltipTrigger>
            <TooltipContent>همه ی موارد</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* ستون‌های جدول */}
      <div className="grid grid-cols-3 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border/30">
        <div className="text-right">قیمت (USDT)</div>
        <div className="text-center">مقدار (BTC)</div>
        <div className="text-left">کل</div>
      </div>

      {/* بخش سفارش‌های فروش (قرمز رنگ) */}
      {(viewMode === "both" || viewMode === "sells") && (
        <div className="flex flex-col py-1 overflow-hidden">
          <ScrollArea className={cn(viewMode === "both" ? "h-50" : "h-[400]")}>
            {sells.map((sell, index) => {
              const percentage = Math.min(
                (sell.amount / maxSellsAmount) * 100,
                100,
              );
              return (
                <div
                  key={`sell-${index}`}
                  className="relative grid grid-cols-3 px-4 py-1 text-xs hover:bg-muted transition-colors duration-150 cursor-pointer items-center z-10"
                >
                  {/* افکت پس‌زمینه قرمز متناسب با حجم */}
                  <div
                    className="absolute top-0 bottom-0 right-0 bg-rose-500/10 dark:bg-rose-500/15 pointer-events-none transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />

                  {/* قیمت در سمت راست با رنگ قرمز */}
                  <div className="text-right font-mono font-semibold text-rose-500 z-10">
                    {formatNumber(sell.price, 1)}
                  </div>
                  {/* مقدار در وسط */}
                  <div className="text-center font-mono text-foreground/90 z-10">
                    {sell.amount.toFixed(4)}
                  </div>
                  {/* کل در سمت چپ */}
                  <div className="text-left font-mono text-foreground/80 z-10">
                    {formatNumber(sell.total, 1)}
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </div>
      )}

      {/* نوار میانی صرافی: نمایش آخرین قیمت و روند بازار */}
      <div className="flex items-center justify-between px-4 py-3 my-1 border-y border-border/50 bg-muted/20">
        {/* کنترل شبیه‌ساز زنده */}
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

        {/* قیمت لحظه‌ای با جهت فلش */}
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
            <ArrowUp className="w-4 h-4 text-emerald-500 animate-bounce" />
          ) : (
            <ArrowDown className="w-4 h-4 text-rose-500 animate-bounce" />
          )}
        </div>
      </div>

      {/* بخش سفارش‌های خرید (سبز رنگ) */}
      {(viewMode === "both" || viewMode === "buys") && (
        <div className="flex flex-col py-1 overflow-hidden">
          <ScrollArea className={cn(viewMode === "both" ? "h-50" : "h-[400]")}>
            {buys.map((buy, index) => {
              const percentage = Math.min(
                (buy.amount / maxBuysAmount) * 100,
                100,
              );
              return (
                <div
                  key={`buy-${index}`}
                  className="group relative grid grid-cols-3 px-4 py-1 text-xs hover:bg-muted transition-colors duration-150 cursor-pointer items-center z-10 "
                >
                  {/* افکت پس‌زمینه سبز متناسب با حجم */}
                  <div
                    className="absolute inset-y-0 right-0 bg-emerald-500/10  transition-all"
                    style={{ width: `${percentage}%` }}
                  />

                  {/* قیمت با رنگ سبز در سمت راست */}
                  <div className="text-right font-mono font-semibold text-emerald-500  z-10">
                    {formatNumber(buy.price, 1)}
                  </div>
                  {/* مقدار در وسط */}
                  <div className="text-center font-mono text-foreground/90 z-10">
                    {buy.amount.toFixed(4)}
                  </div>
                  {/* کل در سمت چپ */}
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
