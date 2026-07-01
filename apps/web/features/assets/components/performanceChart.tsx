// components/PerformanceChart.tsx
"use client";

import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { date: "۱ فروردین", value: 105000 },
  { date: "۵ فروردین", value: 110000 },
  { date: "۱۰ فروردین", value: 108000 },
  { date: "۱۵ فروردین", value: 115000 },
  { date: "۲۰ فروردین", value: 120000 },
  { date: "۲۵ فروردین", value: 118000 },
  { date: "۳۰ فروردین", value: 124560 },
];

const timeframes = [
  { id: "1D", label: "1D" },
  { id: "1W", label: "1W" },
  { id: "1M", label: "1M" },
  { id: "1Y", label: "1Y" },
];

export function PerformanceChart() {
  const [activeTab, setActiveTab] = useState("1M");

  return (
    <div className="flex flex-col h-full min-h-[320px]">
      {/* هدر چارت شامل عنوان و فیلتر زمان */}
      <div className="flex items-center justify-between mb-6">
        {/* فیلترهای بازه زمانی */}
        <h3 className="text-lg font-bold text-foreground">نمودار عملکرد</h3>
        
        <div className="flex items-center gap-1 bg-secondary p-1 rounded-lg">
          
          {timeframes.map((tf) => (
            <Button
              key={tf.id}
              onClick={() => setActiveTab(tf.id)}
              variant="ghost"
            color="secondary"
              className={`${
                activeTab === tf.id
                  && "bg-primary text-primary-foreground shadow"
              }`}
            >
              {tf.label}
            </Button>
          ))}
        </div>

      </div>

      {/* نمودار ریچارترز */}
      <div className="w-full flex-1 min-h-[220px]" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--primary)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor="var(--primary)"
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              domain={["dataMin - 5000", "dataMax + 5000"]}
              tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
                borderRadius: "var(--radius)",
                textAlign: "right",
              }}
              formatter={(value: any) => [
                `$${value.toLocaleString()}`,
                "دارایی",
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              dot={{
                r: 4,
                fill: "var(--background)",
                stroke: "var(--primary)",
                strokeWidth: 2,
              }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
