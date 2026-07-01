// components/AssetAllocation.tsx
"use client";

import React from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface Asset {
  name: string;
  percentage: number;
  value: string;
  fill: string;
}

const assets: Asset[] = [
  { name: "BTC", percentage: 45, value: "۴۵٪", fill: "#f7931a" },
  { name: "ETH", percentage: 30, value: "۳۰٪", fill: "#627eea" },
  { name: "USDT", percentage: 15, value: "۱۵٪", fill: "#26a17b" },
  { name: "SOL", percentage: 10, value: "۱۰٪", fill: "#14f195" },
];

export function AssetAllocation() {
  return (
    <div className="flex flex-col justify-between h-full min-h-[320px]">
      <h3 className="text-lg font-bold text-foreground mb-4 text-right">
        تخصیص دارایی
      </h3>
      
      {/* بخش چارت دونات */}
      <div className="relative w-full h-44 flex items-center justify-center outline-none">
        <ResponsiveContainer width="100%" height="100%" className="outline-none">
          <PieChart className="outline-none">
            <Pie
              data={assets}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={2}
              dataKey="percentage"
              nameKey="name"
              className="outline-none"
            />
            <Tooltip 
              formatter={(value: any , name : any) => [`${value}%`, name]}
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontFamily: 'inherit',
              }}
              labelStyle={{ color: 'var(--foreground)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* راهنمای چارت (Legend) به همراه مقادیر فارسی */}
      <div className="space-y-2 mt-4 text-sm font-medium">
        {assets.map((asset) => (
          <div key={asset.name} className="flex items-center justify-between">
            <span className="text-muted-foreground text-left tabular-nums w-12">
              {asset.value}
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
    </div>
  );
}