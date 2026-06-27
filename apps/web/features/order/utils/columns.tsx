"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type Position = {
  id: string;
  pair: string;
  type: "BUY" | "SELL";
  amount: number;
  entryPrice: string;
  currentPrice: string;
  pnl: string;
  status: "up" | "down";
};

// ۲. تعریف ستون‌ها
export const columns: ColumnDef<Position>[] = [
  {
    accessorKey: "pair",
    header: "جفت ارز",
    cell: ({ row }) => {
      const pos = row.original;
      return (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              pos.type === "BUY"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            }
          >
            {pos.type}
          </Badge>
          <span className="text-xs font-bold">{pos.pair}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "حجم",
  },
  {
    accessorKey: "entryPrice",
    header: "قیمت ورود",
  },

  {
    id: "actions",
    header: "عملیات",
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-4">
        <Button
          size="xs"
          color="destructive"
          onClick={() => console.log("Close", row.original.id)}
        >
          لغو
        </Button>
        <Button
          size="xs"
          color="primary"
          onClick={() => console.log("Close", row.original.id)}
        >
          نمایش
        </Button>
      </div>
    ),
  },
];
