import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLivePrices } from "@/hooks/useLivePrice";
import { cn } from "@/lib/cn";
import { SYMBOLS, SymbolValue } from "@repo/types";
import { Edit2 } from "lucide-react";

const WATCHLIST = [
  { symbol: "BTCUSDT", name: "Bitcoin", icon: "B", color: "text-orange-500" },
  { symbol: "ETHUSDT", name: "Ethereum", icon: "E", color: "text-blue-500" },
  { symbol: "SOLUSDT", name: "Solana", icon: "S", color: "text-purple-500" },
  { symbol: "BNBUSDT", name: "Binance coin", icon: "B", color: "text-yellow-500" },
] as const;
const WATCH_SYMBOLS = WATCHLIST.map((w) => w.symbol) as SymbolValue[];

export const  MarketWatchCard =  () =>{
  const { prices, status } = useLivePrices(WATCH_SYMBOLS);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center  justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-bold">مارکت لحظه ای</CardTitle>
        <div className="flex items-center gap-2">
          {status !== "live" && (
            <span className="text-[10px] text-muted-foreground">
              {status === "reconnecting" ? "اتصال مجدد..." : "در حال اتصال..."}
            </span>
          )}
          <Button variant="ghost" size="icon">
            <Edit2 />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {WATCHLIST.map((coin) => {
          const meta = SYMBOLS.find((s) => s.value === coin.symbol)!;
          const p = prices[coin.symbol];
          return (
            <div
              key={coin.symbol}
              className="flex items-center justify-between hover:bg-muted/50 p-1 rounded-md transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs", coin.color)}>
                  {coin.icon}
                </div>
                <div>
                  <p className="text-sm font-bold">{coin.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{meta.label}</p>
                </div>
              </div>
              <p
                dir="ltr"
                className={cn(
                  "font-mono text-sm font-bold transition-colors",
                  p?.direction === "up" && "text-emerald-500",
                  p?.direction === "down" && "text-red-500",
                )}
              >
                {p ? `$${Number(p.price).toLocaleString("en-US")}` : "—"}
              </p>
            </div>
          );
        })}
        <Button variant="outline" size="sm" className="w-full mt-2 border-dashed border-blue-200" color="primary">
          همه ی نماد ها
        </Button>
      </CardContent>
    </Card>
  );
}