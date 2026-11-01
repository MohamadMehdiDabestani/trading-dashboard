"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTradeStats } from "../hooks/useDashboard";
import { Target } from "lucide-react";
import { cn } from "@/lib/cn";
import { Pulse } from "@/components/pulse";

const fa = (n: number) => n.toLocaleString("fa-IR");

export const SuccessRateCard = () => {
  const { data, isLoading } = useTradeStats();
  const delta = data?.deltaPercent ?? null;

  return (
    <Card className="overflow-hidden border border-border bg-card transition-all hover:shadow-sm">
      <CardContent className="p-6 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            نرخ موفقیت معاملات
          </span>
          {isLoading ? (
            <Pulse className="h-8 w-28" />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight">
                {data?.successRate == null ? "—" : `${fa(data.successRate)}٪`}
              </span>
              {delta !== null && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    delta >= 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400",
                  )}
                >
                  {delta > 0 ? "+" : ""}
                  {fa(delta)}٪ نسبت به ماه قبل
                </span>
              )}
            </div>
          )}
          <span className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">
              {fa(data?.filled ?? 0)}
            </span>{" "}
            سفارش انجام‌شده از{" "}
            <span className="font-bold text-foreground">
              {fa(data?.total ?? 0)}
            </span>{" "}
            سفارش نهایی‌شده
          </span>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Target className="size-6" />
        </div>
      </CardContent>
    </Card>
  );
};
