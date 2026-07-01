"use client";
import React, { useState, useMemo } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Search,
  CheckCircle2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Transaction {
  id: string;
  type: "deposit" | "withdraw" | "trade";
  amount: number;
  date: string;
  time: string;
  status: "success" | "pending" | "failed";
}

interface CoinData {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  fiatValue: number;
  price: number;
  trend: number; // Percentage change
  iconBg: string;
  iconText: string;
  isPopular: boolean;
  chartData: number[]; // Sparkline data points
  transactions: Transaction[];
}

// --- Mock Data ---
// --- Updated Mock Data ---
const COINS_DATA: CoinData[] = [
  {
    id: "btc",
    name: "بیت کوین",
    symbol: "BTC",
    balance: 0.4502,
    fiatValue: 29450.0,
    price: 65415,
    trend: 2.4,
    iconBg: "bg-amber-500/10 text-amber-500",
    iconText: "₿",
    isPopular: true,
    chartData: [35, 38, 36, 42, 40, 48, 45, 52],
    transactions: [
      {
        id: "tx1",
        type: "deposit",
        amount: 0.05,
        date: "1402/08/15",
        time: "12:30",
        status: "success",
      },
      {
        id: "tx2",
        type: "withdraw",
        amount: 0.012,
        date: "1402/08/10",
        time: "09:15",
        status: "success",
      },
    ],
  },
  {
    id: "eth",
    name: "اتریوم",
    symbol: "ETH",
    balance: 12.5,
    fiatValue: 24100.5,
    price: 3420,
    trend: -1.2,
    iconBg: "bg-indigo-500/10 text-indigo-500",
    iconText: "Ξ",
    isPopular: true,
    chartData: [45, 42, 43, 39, 38, 35, 36, 34],
    transactions: [
      {
        id: "tx3",
        type: "deposit",
        amount: 2.5,
        date: "1402/08/12",
        time: "18:40",
        status: "success",
      },
    ],
  },
  {
    id: "sol",
    name: "سولانا",
    symbol: "SOL",
    balance: 85.2,
    fiatValue: 12450.0,
    price: 146.12,
    trend: 5.8,
    iconBg: "bg-purple-500/10 text-purple-400",
    iconText: "S",
    isPopular: true,
    chartData: [20, 25, 22, 30, 45, 40, 55, 60],
    transactions: [
      {
        id: "tx_s1",
        type: "deposit",
        amount: 10.0,
        date: "1402/09/01",
        time: "14:20",
        status: "success",
      },
    ],
  },
  {
    id: "bnb",
    name: "بایننس کوین",
    symbol: "BNB",
    balance: 15.4,
    fiatValue: 9240.0,
    price: 600.0,
    trend: 0.8,
    iconBg: "bg-yellow-500/10 text-yellow-500",
    iconText: "B",
    isPopular: true,
    chartData: [50, 52, 51, 53, 52, 54, 53, 55],
    transactions: [
      {
        id: "tx_b1",
        type: "withdraw",
        amount: 2.0,
        date: "1402/09/05",
        time: "11:00",
        status: "success",
      },
    ],
  },
  {
    id: "ada",
    name: "کاردانو",
    symbol: "ADA",
    balance: 12500.0,
    fiatValue: 5625.0,
    price: 0.45,
    trend: -3.2,
    iconBg: "bg-blue-600/10 text-blue-600",
    iconText: "A",
    isPopular: false,
    chartData: [40, 38, 35, 30, 32, 28, 25, 22],
    transactions: [
      {
        id: "tx_a1",
        type: "deposit",
        amount: 500.0,
        date: "1402/08/20",
        time: "16:45",
        status: "success",
      },
    ],
  },
  {
    id: "xrp",
    name: "ریپل",
    symbol: "XRP",
    balance: 8900.0,
    fiatValue: 5340.0,
    price: 0.6,
    trend: 1.5,
    iconBg: "bg-slate-500/10 text-slate-400",
    iconText: "X",
    isPopular: false,
    chartData: [25, 26, 25, 27, 28, 27, 29, 30],
    transactions: [
      {
        id: "tx_x1",
        type: "deposit",
        amount: 1000.0,
        date: "1402/09/02",
        time: "10:30",
        status: "success",
      },
    ],
  },
  {
    id: "usdt",
    name: "تتر",
    symbol: "USDT",
    balance: 4500.0,
    fiatValue: 4500.0,
    price: 1.0,
    trend: 0.0,
    iconBg: "bg-emerald-500/10 text-emerald-500",
    iconText: "₮",
    isPopular: false,
    chartData: [10, 10, 10.01, 9.99, 10, 10, 10.02, 10],
    transactions: [
      {
        id: "tx5",
        type: "deposit",
        amount: 4500.0,
        date: "1402/08/14",
        time: "15:30",
        status: "success",
      },
    ],
  },
];

export default function CryptoDashboard() {
  const [selectedCoinId, setSelectedCoinId] = useState<string>("btc");

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);

  // Get current active coin data
  const activeCoin = useMemo(() => {
    return (
      COINS_DATA.find((coin) => coin.id === selectedCoinId) ||
      (COINS_DATA[0] as CoinData)
    );
  }, [selectedCoinId]);

  // Filter Coins list
  const filteredCoins = useMemo(() => {
    return COINS_DATA.filter((coin) => {
      if (searchQuery && searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          coin.name.includes(query) || coin.symbol.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [searchQuery]);
  const chartData = useMemo(() => {
    return activeCoin.chartData.map((value, index) => ({
      time: index,
      price: value,
    }));
  }, [activeCoin]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black text-foreground"> دارایی ها</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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
            {filteredCoins.map((coin) => {
              const isSelected = coin.id === selectedCoinId;
              return (
                <button
                  key={coin.id}
                  onClick={() => setSelectedCoinId(coin.id)}
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
                      {coin.balance.toLocaleString(undefined, {
                        minimumFractionDigits: 4,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      $
                      {coin.fiatValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ≈
                    </p>
                  </div>
                </button>
              );
            })}

            {filteredCoins.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <p className="text-sm">نتیجه‌ای یافت نشد</p>
              </div>
            )}
          </div>
        </section>

        <main className="lg:col-span-2 flex flex-col gap-6">
          <section className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
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
                    {activeCoin.balance}
                  </span>
                  <span className="text-sm font-bold text-muted-foreground">
                    {activeCoin.symbol}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">
                  $
                  {activeCoin.fiatValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}{" "}
                  ≈
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:flex items-center gap-3 md:self-end">
              <Button size="xl">
                <ArrowDownLeft className="w-4 h-4" />
                <span>واریز به {activeCoin.symbol}</span>
              </Button>
              <Button variant="secondary" size="xl">
                <ArrowUpRight className="w-4 h-4" />
                <span>برداشت</span>
              </Button>
              <Button variant="secondary" size="xl">
                <RefreshCw className="w-4 h-4" />
                <span>معماله</span>
              </Button>
            </div>
          </section>

          <section className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base">روند موجودی دارایی</h3>

              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${
                  activeCoin.trend >= 0
                    ? "bg-success/15 text-success"
                    : "bg-destructive/15 text-destructive"
                }`}
              >
                {activeCoin.trend >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {activeCoin.trend >= 0
                    ? `+${activeCoin.trend}`
                    : activeCoin.trend}
                  %
                </span>
              </div>
            </div>

            <div className="h-72 w-full relative border border-border rounded-xl bg-background/30 p-4 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={
                          activeCoin.trend >= 0
                            ? "var(--success)"
                            : "var(--destructive)"
                        }
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={
                          activeCoin.trend >= 0
                            ? "var(--success)"
                            : "var(--destructive)"
                        }
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  {/* شبکه‌بندی خط‌چین */}
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                    opacity={0.5}
                  />

                  <XAxis dataKey="time" hide />
                  <YAxis domain={["dataMin - 5", "dataMax + 5"]} hide />

                  {/* تولتیپ سفارشی شده با استایل Shadcn */}
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border p-3 rounded-lg shadow-xl backdrop-blur-md">
                            <p className="text-[10px] text-muted-foreground mb-1">
                              مقدار دارایی
                            </p>
                            <p className="text-sm font-mono font-bold">
                              ${payload[0] && payload[0].value?.toLocaleString()}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* خط اصلی نمودار */}
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={
                      activeCoin.trend >= 0
                        ? "var(--success)"
                        : "var(--destructive)"
                    }
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* لایه میانی برای نمایش قیمت فعلی (اختیاری - در صورت نیاز به حفظ استایل قبلی) */}
              {!chartData.length && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                  دیتایی برای نمایش وجود ندارد
                </div>
              )}
            </div>
          </section>

          {/* Recent Transactions Section */}
          <section className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base">
                تراکنش‌های اخیر {activeCoin.symbol}
              </h3>
              <button className="text-xs text-primary font-bold hover:underline transition-all">
                مشاهده همه
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {activeCoin.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-xl border border-border bg-background/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {tx.type === "deposit" ? (
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
                        {tx.type === "deposit" ? "واریز" : "برداشت"}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {tx.time} - {tx.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-end flex flex-col items-end gap-1">
                    <span
                      className={`font-mono font-bold text-sm ${
                        tx.type === "deposit"
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {tx.type === "deposit" ? "+" : "-"}
                      {activeCoin.symbol} {tx.amount.toFixed(4)}
                    </span>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      <span className="text-[11px] text-muted-foreground font-semibold">
                        موفق
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
