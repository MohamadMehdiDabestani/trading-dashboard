"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Cpu,
  Radio,
  Sparkles,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { SymbolValue } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLivePrices } from "@/hooks/useLivePrice";
import { cn } from "@/lib/cn";
import { Link } from "@/lib/i18nNavigation";

const DEMO_SYMBOLS: readonly SymbolValue[] = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
];

const FALLBACK_PRICES: Record<string, number> = {
  BTCUSDT: 94280.5,
  ETHUSDT: 2745.2,
  SOLUSDT: 188.65,
  BNBUSDT: 632.4,
};

const SLUG_BY_SYMBOL: Record<string, string> = {
  BTCUSDT: "btc",
  ETHUSDT: "eth",
  SOLUSDT: "sol",
  BNBUSDT: "bnb",
};

type Level = { price: number; amount: number; total: number };
type FillEvent = {
  id: number;
  side: "buy" | "sell";
  price: number;
  amount: number;
  source: "MM" | "USER";
  latencyMs: string;
};

function buildBook(mid: number): { asks: Level[]; bids: Level[] } {
  const step = mid > 10000 ? 6.5 : mid > 500 ? 0.85 : 0.12;
  const asks: Level[] = [];
  const bids: Level[] = [];
  for (let i = 4; i >= 1; i--) {
    const price = Number((mid + i * step).toFixed(2));
    const amount = Number((0.18 + ((i * 7) % 5) * 0.14).toFixed(4));
    asks.push({ price, amount, total: Number((price * amount).toFixed(2)) });
  }
  for (let i = 1; i <= 4; i++) {
    const price = Number((mid - i * step).toFixed(2));
    const amount = Number((0.22 + ((i * 5) % 6) * 0.13).toFixed(4));
    bids.push({ price, amount, total: Number((price * amount).toFixed(2)) });
  }
  return { asks, bids };
}

export function LiveEngineShowcase() {
  const t = useTranslations("landing.hero");
  const { prices, status } = useLivePrices(DEMO_SYMBOLS);

  const [selectedSymbol, setSelectedSymbol] = useState<SymbolValue>("BTCUSDT");
  const [tickDelta, setTickDelta] = useState(0);
  const [flashSide, setFlashSide] = useState<"buy" | "sell" | null>(null);

  const liveRaw = Number(prices[selectedSymbol]?.price ?? NaN);
  const baseMid =
    Number.isFinite(liveRaw) && liveRaw > 0
      ? liveRaw
      : (FALLBACK_PRICES[selectedSymbol] ?? 94280.5);

  const effectiveMid = Number((baseMid + tickDelta).toFixed(2));

  const book = useMemo(() => buildBook(effectiveMid), [effectiveMid]);

  const [fills, setFills] = useState<FillEvent[]>([
    {
      id: 1,
      side: "buy",
      price: 94284.0,
      amount: 0.142,
      source: "MM",
      latencyMs: "0.24",
    },
    {
      id: 2,
      side: "sell",
      price: 94277.5,
      amount: 0.085,
      source: "MM",
      latencyMs: "0.31",
    },
    {
      id: 3,
      side: "buy",
      price: 94281.0,
      amount: 0.31,
      source: "MM",
      latencyMs: "0.19",
    },
  ]);

  // Autonomous local market maker simulation so the preview is always kinetic
  useEffect(() => {
    const id = setInterval(() => {
      const dir: "buy" | "sell" = Math.random() > 0.48 ? "buy" : "sell";
      const step = baseMid > 10000 ? 2.5 : baseMid > 500 ? 0.35 : 0.05;
      const delta = (dir === "buy" ? 1 : -1) * step;

      setTickDelta((prev) => {
        const next = prev + delta;
        return Math.abs(next) > step * 6 ? 0 : next;
      });

      const fillPrice = Number((baseMid + delta).toFixed(2));
      const fillAmt = Number((0.04 + Math.random() * 0.38).toFixed(4));
      const latency = (0.14 + Math.random() * 0.25).toFixed(2);

      setFills((prev) => [
        {
          id: Date.now(),
          side: dir,
          price: fillPrice,
          amount: fillAmt,
          source: "MM",
          latencyMs: latency,
        },
        ...prev.slice(0, 3),
      ]);
    }, 2400);

    return () => clearInterval(id);
  }, [baseMid]);

  const injectUserOrder = (side: "buy" | "sell") => {
    const step = baseMid > 10000 ? 5 : baseMid > 500 ? 0.6 : 0.1;
    const delta = side === "buy" ? step : -step;
    setTickDelta((prev) => prev + delta);
    setFlashSide(side);
    setTimeout(() => setFlashSide(null), 550);

    const bestLevel =
      side === "buy"
        ? (book.asks[book.asks.length - 1]?.price ?? effectiveMid)
        : (book.bids[0]?.price ?? effectiveMid);

    setFills((prev) => [
      {
        id: Date.now(),
        side,
        price: bestLevel,
        amount: Number((0.25 + Math.random() * 0.45).toFixed(4)),
        source: "USER",
        latencyMs: (0.11 + Math.random() * 0.15).toFixed(2),
      },
      ...prev.slice(0, 3),
    ]);
  };

  const maxAmount = useMemo(() => {
    const all = [...book.asks, ...book.bids].map((l) => l.amount);
    return Math.max(...all, 0.5);
  }, [book]);

  const bestAsk = book.asks[book.asks.length - 1]?.price ?? effectiveMid;
  const bestBid = book.bids[0]?.price ?? effectiveMid;
  const spread = Math.max(0.01, bestAsk - bestBid);

  return (
    <div className="relative rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Top glow bar */}
      <div className="pointer-events-none absolute -top-24 inset-x-10 h-44 bg-gradient-to-r from-primary/25 via-emerald-500/20 to-primary/25 blur-3xl" />

      {/* Terminal Header */}
      <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-destructive/80" />
            <span className="size-2.5 rounded-full bg-amber-400/80" />
            <span className="size-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-bold tracking-tight text-foreground">
            {t("livePreview")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="gap-1.5 bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[11px]"
          >
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
            </span>
            <Bot className="size-3" />
            <span>{t("marketMakerActive")}</span>
          </Badge>

          <Badge
            variant="outline"
            className="font-mono text-[10px] uppercase hidden sm:inline-flex"
          >
            <Radio className="size-3 text-primary" />
            {status === "live" ? "WS LIVE" : "SSR SEEDED"}
          </Badge>
        </div>
      </div>

      {/* Symbol Switcher Tabs */}
      <div
        className="grid grid-cols-4 gap-1.5 border-b border-border/60 bg-background/40 p-2"
        dir="ltr"
      >
        {DEMO_SYMBOLS.map((sym) => {
          const raw = Number(prices[sym]?.price ?? NaN);
          const p =
            Number.isFinite(raw) && raw > 0
              ? raw
              : (FALLBACK_PRICES[sym] ?? 0);
          const dir = prices[sym]?.direction ?? "flat";
          const active = sym === selectedSymbol;

          return (
            <button
              key={sym}
              type="button"
              onClick={() => {
                setSelectedSymbol(sym);
                setTickDelta(0);
              }}
              className={cn(
                "rounded-xl border px-2.5 py-2 text-left transition-all cursor-pointer",
                active
                  ? "border-primary bg-primary/10 shadow-xs"
                  : "border-transparent bg-muted/40 hover:bg-muted/80",
              )}
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span>{sym.replace("USDT", "/USDT")}</span>
                {dir === "up" ? (
                  <ArrowUpRight className="size-3 text-emerald-500" />
                ) : dir === "down" ? (
                  <ArrowDownRight className="size-3 text-destructive" />
                ) : null}
              </div>
              <div className="mt-0.5 font-mono text-xs font-bold tabular-nums text-foreground">
                $
                {p.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </button>
          );
        })}
      </div>

      {/* OrderBook + Execution Stream */}
      <div className="grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-border/60">
        {/* L2 OrderBook Column */}
        <div className="sm:col-span-7 p-4 space-y-2.5" dir="ltr">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Cpu className="size-3.5 text-primary" />
              {t("depth")} (B-Tree L2)
            </span>
            <span>
              {t("spread")}: <span  className="font-mono">${spread.toFixed(2)}</span>
            </span>
          </div>

          <div className="grid grid-cols-3 text-[10px] uppercase tracking-wider text-muted-foreground pb-1 border-b border-border/50">
            <span>{t("price")}</span>
            <span className="text-right">{t("amount")}</span>
            <span className="text-right">{t("total")}</span>
          </div>

          {/* Asks */}
          <div className="space-y-1">
            {book.asks.map((lvl) => {
              const pct = Math.min(100, Math.round((lvl.amount / maxAmount) * 100));
              return (
                <div
                  key={`ask-${lvl.price}`}
                  className="relative grid grid-cols-3 items-center px-2 py-1 rounded-md text-xs font-mono tabular-nums overflow-hidden"
                >
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 bg-destructive/15 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                  <span className="relative font-semibold text-destructive">
                    {lvl.price.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <span className="relative text-right text-foreground/90">
                    {lvl.amount.toFixed(4)}
                  </span>
                  <span className="relative text-right text-muted-foreground">
                    {lvl.total.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mid Price Banner */}
          <div
            className={cn(
              "flex items-center justify-between rounded-xl border px-3 py-2 transition-colors duration-300",
              flashSide === "buy"
                ? "border-emerald-500/60 bg-emerald-500/15"
                : flashSide === "sell"
                  ? "border-destructive/60 bg-destructive/15"
                  : "border-border/70 bg-muted/40",
            )}
          >
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <span className="text-base font-black tabular-nums font-mono ">
                $
                {effectiveMid.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <span className="text-[11px] text-emerald-500 font-semibold">
              {t("matchedIn")}
            </span>
          </div>

          {/* Bids */}
          <div className="space-y-1">
            {book.bids.map((lvl) => {
              const pct = Math.min(100, Math.round((lvl.amount / maxAmount) * 100));
              return (
                <div
                  key={`bid-${lvl.price}`}
                  className="relative grid grid-cols-3 items-center px-2 py-1 rounded-md text-xs font-mono tabular-nums overflow-hidden"
                >
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 bg-emerald-500/15 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                  <span className="relative font-semibold text-emerald-500">
                    {lvl.price.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <span className="relative text-right text-foreground/90">
                    {lvl.amount.toFixed(4)}
                  </span>
                  <span className="relative text-right text-muted-foreground">
                    {lvl.total.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Order Injection + Execution Tape */}
        <div className="sm:col-span-5 p-4 flex flex-col justify-between gap-4 bg-background/30">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Zap className="size-3.5 text-primary" />
                {t("simulateOrder")}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                FIFO • 10^18
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => injectUserOrder("buy")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs"
              >
                <ArrowUpRight className="size-4" />
                {t("simBuy")}
              </Button>
              <Button
                type="button"
                size="sm"
                color="destructive"
                onClick={() => injectUserOrder("sell")}
                className="font-bold shadow-xs"
              >
                <ArrowDownRight className="size-4" />
                {t("simSell")}
              </Button>
            </div>

            <div className="pt-2 space-y-2" dir="ltr">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span>{t("executionLog")}</span>
                <span className="font-mono text-[10px]">ENGINE EVENT</span>
              </div>

              <div className="space-y-1.5">
                {fills.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-card/80 px-2.5 py-1.5 font-mono text-[11px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                          f.side === "buy"
                            ? "bg-emerald-500/15 text-emerald-500"
                            : "bg-destructive/15 text-destructive",
                        )}
                      >
                        {f.side}
                      </span>
                      <span className="font-bold tabular-nums">
                        ${f.price.toLocaleString("en-US")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{f.amount}</span>
                      <span
                        className={cn(
                          "text-[9px] px-1 rounded",
                          f.source === "USER"
                            ? "bg-primary/20 text-primary font-bold"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {f.source} • {f.latencyMs}ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Link
            href={`/dashboard/trade/${SLUG_BY_SYMBOL[selectedSymbol] ?? "btc"}`}
            className="block"
          >
            <Button
              variant="secondary"
              color="primary"
              className="w-full justify-between font-bold"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-4" />
                {selectedSymbol.replace("USDT", " / USDT")}
              </span>
              <span className="font-mono text-xs">→</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
