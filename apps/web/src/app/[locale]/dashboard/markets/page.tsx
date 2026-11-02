"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, RefreshCw, Search } from "lucide-react";
import { SYMBOLS } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { useAssetPrices } from "@/hooks/useAssetPrice";

// فقط متادیتای نمایشی (نام فارسی/آیکن). قیمت‌ها از API می‌آیند.
// پیشنهاد: این آرایه را به یک فایل مشترک (مثلاً lib/coinMeta.ts) منتقل کنید
// تا بین صفحه‌ی کیف پول و بازارها تکرار نشود.
const COIN_META: Record<
  string,
  { name: string; iconBg: string; iconText: string }
> = {
  BTC: { name: "بیت کوین", iconBg: "bg-amber-500/10 text-amber-500", iconText: "₿" },
  ETH: { name: "اتریوم", iconBg: "bg-indigo-500/10 text-indigo-500", iconText: "Ξ" },
  SOL: { name: "سولانا", iconBg: "bg-purple-500/10 text-purple-400", iconText: "S" },
  BNB: { name: "بایننس کوین", iconBg: "bg-yellow-500/10 text-yellow-500", iconText: "B" },
  ADA: { name: "کاردانو", iconBg: "bg-blue-600/10 text-blue-600", iconText: "A" },
  XRP: { name: "ریپل", iconBg: "bg-slate-500/10 text-slate-400", iconText: "X" },
  USDT: { name: "تتر", iconBg: "bg-emerald-500/10 text-emerald-500", iconText: "₮" },
};
const FALLBACK_META = {
  name: "",
  iconBg: "bg-muted text-muted-foreground",
  iconText: "?",
};

type SortKey = "default" | "name" | "price";
type SortDir = "asc" | "desc";

const fmtUsd = (v: number) =>
  v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: v < 1 ? 6 : 2,
  });

export default function MarketsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const baseAssets = useMemo(
    () => Array.from(new Set(SYMBOLS.map((s) => s.baseAsset))),
    [],
  );
  const { priceOf } = useAssetPrices(baseAssets);

  const rows = useMemo(
    () =>
      SYMBOLS.map((s) => {
        const meta = COIN_META[s.baseAsset] ?? FALLBACK_META;
        return {
          slug: s.slug,
          label: s.label,
          base: s.baseAsset,
          name: meta.name,
          iconBg: meta.iconBg,
          iconText: meta.iconText,
          price: priceOf(s.baseAsset),
        };
      }),
    [priceOf],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? rows.filter(
          (r) =>
            r.name.includes(q) ||
            r.base.toLowerCase().includes(q) ||
            r.label.toLowerCase().includes(q),
        )
      : [...rows];

    if (sortKey === "name") {
      const dir = sortDir === "asc" ? 1 : -1;
      list.sort((a, b) => dir * a.base.localeCompare(b.base));
    } else if (sortKey === "price") {
      const dir = sortDir === "asc" ? 1 : -1;
      // نمادهای بدون قیمت در هر دو جهت آخر لیست بمانند
      list.sort((a, b) => {
        if (a.price == null && b.price == null) return 0;
        if (a.price == null) return 1;
        if (b.price == null) return -1;
        return dir * (a.price - b.price);
      });
    }
    return list;
  }, [rows, query, sortKey, sortDir]);

  const toggleSort = (key: Exclude<SortKey, "default">) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const pricesReady = rows.some((r) => r.price != null);

  return (
    <div className="flex flex-col gap-6 w-full">
      <section className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">بازارها</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {visible.length.toLocaleString("fa-IR")} نماد قابل معامله
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو (مثلاً بیت کوین یا BTC)..."
              className="ps-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">مرتب‌سازی:</span>
          <div className="flex items-center gap-1 bg-secondary p-1 rounded-lg">
            <Button
              variant={sortKey === "name" ? "default" : "ghost"}
              onClick={() => toggleSort("name")}
            >
              نام
              <ArrowUpDown className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={sortKey === "price" ? "default" : "ghost"}
              onClick={() => toggleSort("price")}
            >
              قیمت
              <ArrowUpDown className="w-3.5 h-3.5" />
            </Button>
          </div>
          {sortKey !== "default" && (
            <Button
            variant="link"
              onClick={() => setSortKey("default")}
              size="xs"
              // className="text-xs text-primary font-bold hover:underline"
            >
              حذف مرتب‌سازی
            </Button>
          )}
        </div>

        {/* هدر جدول (فقط دسکتاپ) */}
        <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 px-4 text-xs text-muted-foreground">
          <span>نماد</span>
          <span className="w-40 text-end">قیمت (USDT)</span>
          <span className="w-28" />
        </div>

        <div className="flex flex-col gap-3">
          {visible.map((r) => (
            <div
              key={r.slug}
              className="p-4 rounded-xl border border-border bg-background/40 flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4 hover:bg-secondary/40 transition-colors"
            >
              <Link
                href={`/dashboard/trade/${r.slug}`}
                className="flex items-center gap-3 min-w-0"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0",
                    r.iconBg,
                  )}
                >
                  {r.iconText}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate">
                    {r.name || r.base}
                  </h4>
                  <span className="inline-block px-2 py-0.5 mt-0.5 text-[11px] font-mono font-medium rounded-md bg-muted text-muted-foreground uppercase">
                    {r.label}
                  </span>
                </div>
              </Link>

              <div className="sm:w-40 sm:text-end" dir="ltr">
                {r.price != null ? (
                  <span className="font-mono font-bold text-sm">
                    ${fmtUsd(r.price)}
                  </span>
                ) : pricesReady ? (
                  <span className="text-xs text-muted-foreground">
                    قیمت در دسترس نیست
                  </span>
                ) : (
                  <span className="inline-block h-4 w-24 animate-pulse rounded bg-muted" />
                )}
              </div>

              <Button
                variant="secondary"
                className="sm:w-28"
                onClick={() => router.push(`/dashboard/trade/${r.slug}`)}
              >
                <RefreshCw className="w-4 h-4" />
                <span>معامله</span>
              </Button>
            </div>
          ))}

          {visible.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              نمادی با این جستجو یافت نشد
            </p>
          )}
        </div>
      </section>
    </div>
  );
}