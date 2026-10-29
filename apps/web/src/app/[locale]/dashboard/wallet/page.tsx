"use client";
import React, { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Search,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WalletHistoryFilters, WalletTrendRange } from "@repo/types";
import {
  INCOMING_TYPES,
  PERIOD_OPTIONS,
  TYPE_GROUPS,
  TYPE_LABEL,
  type PeriodId,
  type TypeGroupId,
} from "@/features/wallet/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWalletBalance } from "@/features/wallet/hooks/useWalletBalance";
import { useWalletAsset } from "@/features/wallet/hooks/useWalletAsset";
import { useWalletDeposit } from "@/features/wallet/hooks/useWalletDeposit";
import { useMarketPrices } from "@/features/wallet/hooks/useMarketPrices";
import { useWalletTrend } from "@/features/wallet/hooks/useWalletTrend";

// فقط متادیتای نمایشی (نام فارسی/آیکن). همه‌ی اعداد از API می‌آیند.
const COIN_META = [
  {
    symbol: "BTC",
    name: "بیت کوین",
    iconBg: "bg-amber-500/10 text-amber-500",
    iconText: "₿",
  },
  {
    symbol: "ETH",
    name: "اتریوم",
    iconBg: "bg-indigo-500/10 text-indigo-500",
    iconText: "Ξ",
  },
  {
    symbol: "SOL",
    name: "سولانا",
    iconBg: "bg-purple-500/10 text-purple-400",
    iconText: "S",
  },
  {
    symbol: "BNB",
    name: "بایننس کوین",
    iconBg: "bg-yellow-500/10 text-yellow-500",
    iconText: "B",
  },
  {
    symbol: "ADA",
    name: "کاردانو",
    iconBg: "bg-blue-600/10 text-blue-600",
    iconText: "A",
  },
  {
    symbol: "XRP",
    name: "ریپل",
    iconBg: "bg-slate-500/10 text-slate-400",
    iconText: "X",
  },
  {
    symbol: "USDT",
    name: "تتر",
    iconBg: "bg-emerald-500/10 text-emerald-500",
    iconText: "₮",
  },
] as const;

const PAGE_SIZE = 10;
const RANGES: WalletTrendRange[] = ["1D", "1W", "1M", "1Y"];

const fmtUsd = (v: number) =>
  v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtAmount = (v: unknown, min = 0) =>
  Number(v ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: min,
    maximumFractionDigits: 8,
  });

const faDateTime = (d: string | Date) => {
  const date = new Date(d);
  return {
    date: date.toLocaleDateString("fa-IR-u-ca-persian"),
    time: date.toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

export default function WalletPage() {
  const [selected, setSelected] = useState<string>("BTC");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  const balances = useWalletBalance();
  const [period, setPeriod] = useState<PeriodId>("all");
  const [typeGroup, setTypeGroup] = useState<TypeGroupId>("all");

  const filters = useMemo<WalletHistoryFilters>(() => {
    const types = TYPE_GROUPS.find((g) => g.id === typeGroup)?.types ?? [];
    return {
      period: period === "all" ? undefined : period,
      types: types.length ? types : undefined,
    };
  }, [period, typeGroup]);
  const hasFilters = period !== "all" || typeGroup !== "all";

  const asset = useWalletAsset(selected, page, PAGE_SIZE, filters);
  const deposit = useWalletDeposit();
  const prices = useMarketPrices();
  const [range, setRange] = useState<WalletTrendRange>("1M");

  const coins = useMemo(() => {
    const map = new Map((balances.data ?? []).map((b) => [b.asset, b]));
    return COIN_META.map((m) => {
      const row = map.get(m.symbol);
      const available = Number(row?.available ?? 0);
      const locked = Number(row?.locked ?? 0);
      return { ...m, available, locked, total: available + locked };
    });
  }, [balances.data]);

  const filteredCoins = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return coins;
    return coins.filter(
      (c) => c.name.includes(q) || c.symbol.toLowerCase().includes(q),
    );
  }, [coins, searchQuery]);

  const priceOf = (symbol: string) => {
    const p = Number(prices.data?.[symbol]);
    return Number.isFinite(p) && p > 0 ? p : null;
  };

  const activeCoin = coins.find((c) => c.symbol === selected) ?? coins[0]!;
  const activePrice = priceOf(activeCoin.symbol);
  const activeFiat =
    activePrice != null ? activeCoin.total * activePrice : null;

  const portfolioValue = useMemo(
    () =>
      coins.reduce((sum, c) => {
        const p = Number(prices.data?.[c.symbol]);
        return Number.isFinite(p) ? sum + c.total * p : sum;
      }, 0),
    [coins, prices.data],
  );

  const trend = useWalletTrend(selected, range);
  const trendData = useMemo(
    () =>
      (trend.data?.points ?? []).map((p) => ({
        time: new Date(p.time).getTime(),
        balance: Number(p.balance),
      })),
    [trend.data],
  );
  const change = trend.data?.changePercent ?? null;
  const chartColor =
    change != null && change < 0 ? "var(--destructive)" : "var(--success)";
  const history = asset.data?.history;

  const selectCoin = (symbol: string) => {
    setSelected(symbol);
    setPage(1);
    setShowDeposit(false);
    deposit.reset();
  };

  const changePeriod = (p: PeriodId) => {
    setPeriod(p);
    setPage(1);
  };
  const changeTypeGroup = (g: TypeGroupId) => {
    setTypeGroup(g);
    setPage(1);
  };
  const clearFilters = () => {
    setPeriod("all");
    setTypeGroup("all");
    setPage(1);
  };

  const amountValid =
    /^[0-9]*\.?[0-9]+$/.test(depositAmount) && Number(depositAmount) > 0;

  const submitDeposit = () => {
    if (!amountValid) return;
    deposit.mutate(
      { asset: activeCoin.symbol, amount: depositAmount },
      {
        onSuccess: () => {
          setDepositAmount("");
          setShowDeposit(false);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-black text-foreground">دارایی ها</h1>
        {prices.isSuccess && (
          <div className="text-end">
            <p className="text-xs text-muted-foreground">ارزش کل دارایی‌ها</p>
            <p className="text-xl font-mono font-black">
              ${fmtUsd(portfolioValue)}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* لیست دارایی‌ها */}
        <section className="lg:col-span-1 bg-card border border-border rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold">دارایی‌های شما</h2>
            <div className="relative w-full">
              <Search className="absolute right-3 ltr:left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="جستجوی نام دارایی"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pe-9 ps-3 py-2 text-sm text-right ltr:text-left ltr:ps-9 ltr:pe-3"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pb-4">
            {balances.isPending && (
              <p className="text-sm text-muted-foreground text-center py-10">
                در حال بارگذاری...
              </p>
            )}

            {balances.isError && (
              <div className="flex flex-col items-center gap-2 py-10">
                <p className="text-sm text-destructive">
                  خطا در دریافت دارایی‌ها
                </p>
                <Button variant="secondary" onClick={() => balances.refetch()}>
                  تلاش مجدد
                </Button>
              </div>
            )}

            {balances.isSuccess &&
              filteredCoins.map((coin) => {
                const isSelected = coin.symbol === selected;
                return (
                  <button
                    key={coin.symbol}
                    onClick={() => selectCoin(coin.symbol)}
                    className={`w-full text-start p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-background/50 hover:bg-accent/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${coin.iconBg}`}
                      >
                        {coin.iconText}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{coin.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {coin.symbol}
                        </p>
                      </div>
                    </div>

                    <div className="text-end">
                      <p className="font-mono font-bold text-sm">
                        {fmtAmount(coin.total, 4)}
                      </p>
                      {priceOf(coin.symbol) != null && (
                        <p className="text-xs text-muted-foreground font-mono">
                          ${fmtUsd(coin.total * priceOf(coin.symbol)!)} ≈
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}

            {balances.isSuccess && filteredCoins.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <p className="text-sm">نتیجه‌ای یافت نشد</p>
              </div>
            )}
          </div>
        </section>

        <main className="lg:col-span-2 flex flex-col gap-6">
          {/* کارت موجودی */}
          <section className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl ${activeCoin.iconBg}`}
                  >
                    {activeCoin.iconText}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">{activeCoin.name}</h2>
                    <span className="inline-block px-2 py-0.5 mt-0.5 text-xs font-mono font-medium rounded-md bg-muted text-muted-foreground uppercase">
                      {activeCoin.symbol}
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">موجودی کل</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-mono font-black">
                      {fmtAmount(activeCoin.total)}
                    </span>
                    <span className="text-sm font-bold text-muted-foreground">
                      {activeCoin.symbol}
                    </span>
                  </div>
                  {activeFiat != null && (
                    <p className="text-sm text-muted-foreground font-mono mt-0.5">
                      ${fmtUsd(activeFiat)} ≈
                      <span className="ms-2 text-xs">
                        (۱ {activeCoin.symbol} = ${fmtUsd(activePrice!)})
                      </span>
                    </p>
                  )}
                  <div className="flex gap-4 text-xs text-muted-foreground font-mono mt-1.5">
                    <span>قابل استفاده: {fmtAmount(activeCoin.available)}</span>
                    <span>قفل‌شده: {fmtAmount(activeCoin.locked)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:flex items-center gap-3 md:self-end">
                <Button size="xl" onClick={() => setShowDeposit((s) => !s)}>
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>واریز به {activeCoin.symbol}</span>
                </Button>
                <Button variant="secondary" size="xl">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>برداشت</span>
                </Button>
                <Button variant="secondary" size="xl">
                  <RefreshCw className="w-4 h-4" />
                  <span>معامله</span>
                </Button>
              </div>
            </div>

            {showDeposit && (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <div className="flex items-center gap-3">
                  <Input
                    dir="ltr"
                    inputMode="decimal"
                    placeholder={`مقدار ${activeCoin.symbol}`}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="font-mono"
                  />
                  <Button
                    onClick={submitDeposit}
                    disabled={!amountValid || deposit.isPending}
                  >
                    {deposit.isPending ? "در حال ثبت..." : "تأیید واریز"}
                  </Button>
                </div>
                {deposit.isError && (
                  <p className="text-xs text-destructive">
                    واریز ناموفق بود. دوباره تلاش کنید.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* روند موجودی (بر اساس ledger) */}
          <section className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-base">
                  روند موجودی {activeCoin.symbol}
                </h3>
                {change != null && (
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${
                      change >= 0
                        ? "bg-success/15 text-success"
                        : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {change >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    <span dir="ltr">
                      {change >= 0 ? "+" : ""}
                      {change}%
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 bg-secondary p-1 rounded-lg">
                {RANGES.map((r) => (
                  <Button
                    key={r}
                    variant="ghost"
                    onClick={() => setRange(r)}
                    className={
                      range === r
                        ? "bg-primary text-primary-foreground shadow"
                        : ""
                    }
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>

            <div
              className="h-72 w-full relative border border-border rounded-xl bg-background/30 p-4 overflow-hidden"
              dir="ltr"
            >
              {trend.isError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <p className="text-sm text-destructive">خطا در دریافت روند</p>
                  <Button variant="secondary" onClick={() => trend.refetch()}>
                    تلاش مجدد
                  </Button>
                </div>
              ) : trend.isPending ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                  در حال بارگذاری...
                </div>
              ) : trendData.length < 2 ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                  دیتایی برای نمایش وجود ندارد
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorBalance"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={chartColor}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={chartColor}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="time"
                      type="number"
                      scale="time"
                      domain={["dataMin", "dataMax"]}
                      hide
                    />
                    <YAxis domain={["auto", "auto"]} hide />
                    <Tooltip
                      content={({ active, payload }) => {
                        const p = payload?.[0]?.payload as
                          | { time: number; balance: number }
                          | undefined;
                        if (!active || !p) return null;
                        const d = new Date(p.time);
                        return (
                          <div className="bg-popover border border-border p-3 rounded-lg shadow-xl backdrop-blur-md">
                            <p className="text-[10px] text-muted-foreground mb-1">
                              {d.toLocaleDateString("fa-IR-u-ca-persian")}{" "}
                              {d.toLocaleTimeString("fa-IR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p className="text-sm font-mono font-bold">
                              {fmtAmount(p.balance)} {activeCoin.symbol}
                            </p>
                            {activePrice != null && (
                              <p className="text-[11px] text-muted-foreground font-mono">
                                ≈ ${fmtUsd(p.balance * activePrice)} (با قیمت
                                فعلی)
                              </p>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="stepAfter"
                      dataKey="balance"
                      stroke={chartColor}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorBalance)"
                      animationDuration={800}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* تراکنش‌ها */}
          <section className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">
                تراکنش‌های {activeCoin.symbol}
              </h3>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  حذف فیلترها
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground w-10">
                  زمان:
                </span>
                <div className="flex items-center gap-1 bg-secondary p-1 rounded-lg flex-wrap">
                  {PERIOD_OPTIONS.map((o) => (
                    <Button
                      key={o.id}
                      variant={period === o.id ? "default" : "ghost"}
                      onClick={() => changePeriod(o.id)}
                    >
                      {o.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground w-10">نوع:</span>
                <div className="flex items-center gap-1 bg-secondary p-1 rounded-lg flex-wrap">
                  {TYPE_GROUPS.map((g) => (
                    <Button
                      key={g.id}
                      variant={typeGroup === g.id ? "default" : "ghost"}
                      onClick={() => changeTypeGroup(g.id)}
                    >
                      {g.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {asset.isPending && (
              <p className="text-sm text-muted-foreground text-center py-6">
                در حال بارگذاری...
              </p>
            )}
            {asset.isError && (
              <div className="flex flex-col items-center gap-2 py-6">
                <p className="text-sm text-destructive">
                  خطا در دریافت تراکنش‌ها
                </p>
                <Button variant="secondary" onClick={() => asset.refetch()}>
                  تلاش مجدد
                </Button>
              </div>
            )}
            {asset.isSuccess && history?.items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                {hasFilters
                  ? "تراکنشی با این فیلترها یافت نشد"
                  : "تراکنشی ثبت نشده است"}
              </p>
            )}

            <div
              className={`flex flex-col gap-3 transition-opacity ${
                asset.isPlaceholderData ? "opacity-60" : ""
              }`}
            >
              {history?.items.map((tx, i) => {
                const incoming = INCOMING_TYPES.has(tx.type);
                const { date, time } = faDateTime(tx.time);
                return (
                  <div
                    key={`${String(tx.time)}-${i}`}
                    className="p-4 rounded-xl border border-border bg-background/40 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {incoming ? (
                        <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center">
                          <ArrowDownLeft className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm">
                          {TYPE_LABEL[tx.type as keyof typeof TYPE_LABEL] ??
                            tx.type}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {time} - {date}
                        </p>
                      </div>
                    </div>

                    <div className="text-end flex flex-col items-end gap-1">
                      <span
                        className={`font-mono font-bold text-sm ${
                          incoming ? "text-success" : "text-destructive"
                        }`}
                      >
                        {incoming ? "+" : "-"}
                        {activeCoin.symbol}{" "}
                        {fmtAmount(Math.abs(Number(tx.amount)), 4)}
                      </span>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          موفق
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {history && history.totalPage > 1 && (
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  قبلی
                </Button>
                <span className="text-xs text-muted-foreground font-mono">
                  {page} / {history.totalPage}
                </span>
                <Button
                  variant="secondary"
                  disabled={page >= history.totalPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  بعدی
                </Button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
