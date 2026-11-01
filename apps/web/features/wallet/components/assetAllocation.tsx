"use client";

import React, { useMemo } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { usePortfolioValuation } from "../hooks/usePortfolioValuation";

const COLORS: Record<string, string> = {
  BTC: "#f7931a",
  ETH: "#627eea",
  USDT: "#26a17b",
  SOL: "#14f195",
  BNB: "#f3ba2f",
  XRP: "#8a92a6",
  ADA: "#3b6fd8",
};
const FALLBACK_COLOR = "#94a3b8";

const fmtPercent = (n: number) =>
  `${n.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪`;

const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function AssetAllocation() {
  const { rows, total, missing, isLoading } = usePortfolioValuation();

  const data = useMemo(
    () =>
      rows
        .map((r) => ({
          name: r.asset,
          value: r.value,
          percentage: total > 0 ? (r.value / total) * 100 : 0,
          fill: COLORS[r.asset] ?? FALLBACK_COLOR,
        }))
        .sort((a, b) => b.value - a.value),
    [rows, total],
  );

  return (
    <div className="flex flex-col justify-between h-full min-h-[320px]">
      <h3 className="text-lg font-bold text-foreground mb-4 text-right">
        تخصیص دارایی
      </h3>

      {isLoading ? (
        <div className="h-44 flex items-center justify-center">
          <div className="h-32 w-32 animate-pulse rounded-full bg-muted" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
          هنوز دارایی‌ای ندارید
        </div>
      ) : (
        <>
          {/* بخش چارت دونات */}
          <div className="relative w-full h-44 flex items-center justify-center outline-none">
            <ResponsiveContainer
              width="100%"
              height="100%"
              className="outline-none"
            >
              <PieChart className="outline-none">
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                  // با هر tick قیمت داده عوض می‌شود؛ انیمیشن باعث پرش نمودار می‌شود
                  isAnimationActive={false}
                  className="outline-none"
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `$${fmtUsd(Number(value))}`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontFamily: "inherit",
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* ارزش کل در مرکز دونات */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-muted-foreground">کل</span>
              <span dir="ltr" className="text-sm font-bold font-mono">
                ${fmtUsd(total)}
              </span>
            </div>
          </div>

          {/* راهنمای چارت (Legend) */}
          <div className="space-y-2 mt-4 text-sm font-medium">
            {data.map((asset) => (
              <div
                key={asset.name}
                className="flex items-center justify-between"
              >
                <span className="text-muted-foreground text-left tabular-nums w-12">
                  {fmtPercent(asset.percentage)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-foreground">{asset.name}</span>
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: asset.fill }}
                  />
                </div>
              </div>
            ))}
          </div>

          {missing.length > 0 && (
            <p className="mt-3 text-[10px] text-amber-600">
              قیمت {missing.join("، ")} در دسترس نیست و در نمودار نیامده است
            </p>
          )}
        </>
      )}
    </div>
  );
}