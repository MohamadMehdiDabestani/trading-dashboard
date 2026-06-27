import {
  Trophy,
  TrendingUp,
  Plus,
  ChevronDown,
  ArrowUpDown,
  Edit2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fragment } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { columns, Position } from "@/features/order/utils/columns";
import { DataTable } from "@/components/data-table";
import { Input } from "@/components/ui/input";
// این دیتا معمولاً از API یا دیتابیس می‌آید
const data: Position[] = [
  {
    id: "1",
    pair: "BTC/USDT",
    type: "BUY",
    amount: 0.25,
    entryPrice: "$64,210.00",
    currentPrice: "$65,100.50",
    pnl: "$222.62",
    status: "up",
  },
  {
    id: "2",
    pair: "ETH/USDT",
    type: "SELL",
    amount: 4.5,
    entryPrice: "$3,550.00",
    currentPrice: "$3,420.00",
    pnl: "$585.020",
    status: "up",
  },
];
export default function Page() {
  return (
    <Fragment>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {/* کارت اول: Leaderboard Rank */}
        <Card className="overflow-hidden border border-border bg-card text-card-foreground transition-all hover:shadow-sm">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            {/* بخش اطلاعات متنی */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                رتبه‌بندی در جدول
              </span>

              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight">#10</span>
                <Button
                  size="xs"
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  نمایش جدول
                </Button>
              </div>

              <span className="text-xs text-muted-foreground">
                جزء <span className="font-bold text-foreground">۳ درصد</span>{" "}
                برتر
              </span>
            </div>

            {/* آیکون کاپ قهرمانی */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Trophy className="size-6" />
            </div>
          </CardContent>
        </Card>

        {/* کارت دوم: 24h Profit & Loss */}
        <Card className="overflow-hidden border border-border bg-card text-card-foreground transition-all hover:shadow-sm">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div className="flex flex-col  gap-1 ">
              <span className="text-xs font-medium text-muted-foreground">
                سود و ضرر 24 ساعت
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  +$450.20
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  (3.75%)
                </span>
              </div>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <TrendingUp className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-border bg-card text-card-foreground transition-all hover:shadow-sm sm:col-span-2 lg:col-span-1">
          <CardContent className="p-6 flex flex-col-reverse gap-4 xs:flex-row xs:items-center xs:justify-between sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                موجودی
              </span>
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  USDT
                </span>
                <span className="text-2xl font-bold tracking-tight">
                  $12,450.00
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" color="primary">
              <Plus className="size-4" />
              <span className="font-semibold text-xs">واریز</span>
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">تبدیل سریع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative space-y-2">
                <div className="rounded-lg border bg-muted/50 p-3">
                  <div className="flex justify-between text-md font-bold text-muted-foreground mb-2">
                    <span>از (پرداختی)</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="secondary"
                      color="secondary"
                      size="sm"
                      className="gap-2 h-8"
                    >
                      <span className="w-4 h-4 bg-orange-500 rounded-full" />{" "}
                      BTC <ChevronDown className="size-3" />
                    </Button>
                    <Input
                      inputSize="lg"
                      variant="ghost"
                      defaultValue="1,000"
                      className="bg-transparent h-full font-bold md:text-2xl outline-none w-full"

                    />
                  </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <Button
                    size="icon-lg"
                    variant="outline"
                    className="rounded-full bg-background shadow-md"
                  >
                    <ArrowUpDown className="size-5" />
                  </Button>
                </div>

                <div className="rounded-lg border bg-muted/50 p-3">
                  <div className="flex justify-between text-md text-muted-foreground mb-2 font-bold ">
                    <span>به (دریافت)</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="secondary"
                      color="secondary"
                      size="sm"
                      className="gap-2 h-8"
                    >
                      <span className="w-4 h-4 bg-orange-500 rounded-full" />{" "}
                      BTC <ChevronDown className="size-3" />
                    </Button>
                    <Input
                      inputSize="lg"
                      variant="ghost"
                      defaultValue="0.0153"
                      className="bg-transparent h-full font-bold md:text-2xl outline-none w-full"
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full font-bold" size="lg">
                تبدیل کردن
              </Button>
              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
                BTC = 65,100.50 USDT 1
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-bold">مارکت لحظه ای</CardTitle>
              <Button variant="ghost" size="icon">
                <Edit2 />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  name: "Bitcoin",
                  symbol: "BTC/USDT",
                  price: "65,100.50",
                  change: "+2.4%",
                  up: true,
                  icon: "B",
                  color: "text-orange-500",
                },
                {
                  name: "Ethereum",
                  symbol: "ETH/USDT",
                  price: "3,420.00",
                  change: "-0.8%",
                  up: false,
                  icon: "E",
                  color: "text-blue-500",
                },
                {
                  name: "Solana",
                  symbol: "SOL/USDT",
                  price: "145.20",
                  change: "+5.1%",
                  up: true,
                  icon: "S",
                  color: "text-purple-500",
                },
              ].map((coin) => (
                <div
                  key={coin.name}
                  className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-1 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-3 ">
                    <div
                      className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs ${coin.color}`}
                    >
                      {coin.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{coin.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {coin.symbol}
                      </p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="font-bold text-sm">${coin.price}</p>
                    <p
                      className={`text-xs ${coin.up ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {coin.change}
                    </p>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 border-dashed  border-blue-200"
                color="primary"
              >
                View All Markets
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card className="min-h-[350px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">نمودار پیشرفت</CardTitle>
              <div className="flex gap-1">
                {["1M", "1W", "1D", "1H"].map((t) => (
                  <Button
                    key={t}
                    variant={t === "1W" ? "default" : "secondary"}
                    size="xs"
                    className="w-8"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center bg-muted/20 m-4 rounded-xl border border-dashed">
              <span className="text-muted-foreground text-sm">
                Chart Placeholder (Lightweight Charts / Recharts)
              </span>
            </CardContent>
          </Card>

          <Card>
            <Tabs defaultValue="orders" className="w-full">
              <CardHeader className="p-0 border-b">
                <TabsList className="w-full justify-start rounded-none bg-transparent h-12 p-0">
                  <TabsTrigger
                    value="history"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent"
                  >
                    تاریخچه معاملات
                  </TabsTrigger>
                  <TabsTrigger
                    value="orders"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent"
                  >
                    سفارشات باز
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="p-0">
                <TabsContent value="orders" className="m-0">
                  <div className="rounded-md border-none">
                    <DataTable columns={columns} data={data} />
                  </div>
                </TabsContent>
                <TabsContent value="history" className="m-0">
                  <div className="rounded-md border-none">
                    <DataTable columns={columns} data={data} />
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </Fragment>
  );
}
