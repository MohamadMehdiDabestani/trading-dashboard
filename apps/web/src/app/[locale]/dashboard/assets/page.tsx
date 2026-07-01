import React from "react";
import { AssetAllocation } from "@/features/assets/components/assetAllocation";
import { PerformanceChart } from "@/features/assets/components/performanceChart";

export default function PortfolioDashboard() {
  return (
    <div className=" space-y-6">
      <h1 className="text-2xl font-black text-foreground">خلاصه پورتفوی</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* کارت موجودی کل */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <span className="text-muted-foreground text-sm font-semibold ">
            موجودی کل
          </span>
          <div className="flex items-baseline justify-end gap-2 mt-4">
            <span className="text-2xl md:text-3xl font-black text-foreground tracking-tight tabular-nums">
              $۱۲۴,۵۶۰.۰۰
            </span>
            <span className="text-muted-foreground font-bold text-sm">
              USDT
            </span>
          </div>
        </div>

        {/* کارت سود / زیان کل */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <span className="text-muted-foreground text-sm font-semibold ">
            سود/زیان کل
          </span>
          <div className="flex flex-col items-end gap-2 mt-4">
            <span className="text-2xl md:text-3xl font-black text-[#26a17b] tracking-tight tabular-nums">
              +$۱۲,۳۴۰.۵۰
            </span>
            <span className="px-2 py-0.5 bg-[#26a17b]/10 text-[#26a17b] text-xs font-bold rounded flex items-center gap-1 tabular-nums">
              ۱۱.۰۵٪ +
            </span>
          </div>
        </div>

        {/* کارت تغییرات ۲۴ ساعته */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <span className="text-muted-foreground text-sm font-semibold ">
            تغییرات ۲۴ ساعته
          </span>
          <div className="flex flex-col items-end gap-2 mt-4">
            <span className="text-2xl md:text-3xl font-black text-[#26a17b] tracking-tight tabular-nums">
              +$۱,۲۴۵.۰۰
            </span>
            <span className="px-2 py-0.5 bg-[#26a17b]/10 text-[#26a17b] text-xs font-bold rounded flex items-center gap-1 tabular-nums">
              ۱.۰۱٪ +
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
          <PerformanceChart />
        </div>
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <AssetAllocation />
        </div>
      </div>
    </div>
  );
}
