"use client";

import { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { GetRecentTradesReply, OrderStatus } from "@repo/types";
import { useTranslations } from "next-intl";

export type Order = GetRecentTradesReply["items"][number];

const STATUS_META: Record<string, { dot: string; text: string }> = {
  open: { dot: "bg-blue-500", text: "text-blue-600" },
  partial: { dot: "bg-amber-500", text: "text-amber-600" },
  filled: { dot: "bg-emerald-500", text: "text-emerald-600" },
  cancelled: {
    dot: "bg-muted-foreground/50",
    text: "text-muted-foreground",
  },
};

const SIDE_META: Record<string, { text: string }> = {
  buy: { text: "text-emerald-600" },
  sell: { text: "text-red-600" },
};

function formatDecimal(value: string) {
  const [int = "", frac] = value.split(".");
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac ? `${withCommas}.${frac}` : withCommas;
}

export function Num({ value }: { value: string }) {
  return (
    <span dir="ltr" className="font-mono text-xs tabular-nums">
      {formatDecimal(value)}
    </span>
  );
}

export function StatusCell({ status }: { status: OrderStatus }) {
  const t = useTranslations("trade.statusFilters");
  const m = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", m?.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m?.dot)} />
      {t(status)}
    </span>
  );
}

function SortHeader({
  column,
  title,
}: {
  column: Column<Order, unknown>;
  title: string;
}) {
  const sorted = column.getIsSorted();
  const Icon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;

  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-foreground",
        sorted ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {title}
      <Icon className={cn("h-3 w-3", !sorted && "opacity-50")} />
    </button>
  );
}

export function FilledCell({
  filled,
  quantity,
}: {
  filled: string;
  quantity: string;
}) {
  const f = Number(filled);
  const q = Number(quantity);
  const pct = q > 0 && Number.isFinite(f) ? Math.min(100, (f / q) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <Num value={filled} />
      {pct > 0 && (
        <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full",
              pct >= 100 ? "bg-emerald-500" : "bg-amber-500",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function DateCell({
  value,
  align = "center",
}: {
  value: Date | string;
  align?: "center" | "start";
}) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return <span>-</span>;

  const date = d.toLocaleDateString("fa-IR-u-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const time = d.toLocaleTimeString("fa-IR-u-nu-latn", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div
      dir="ltr"
      className={cn(
        "flex flex-col leading-tight",
        align === "start" ? "items-start" : "items-center",
      )}
    >
      <span className="text-xs tabular-nums">{date}</span>
      <span className="text-[10px] tabular-nums text-muted-foreground">
        {time}
      </span>
    </div>
  );
}

export function SymbolCell({
  order,
  align = "center",
}: {
  order: Order;
  align?: "center" | "start";
}) {
  const t = useTranslations("trade.sides");
  const side = SIDE_META[order.side];
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 leading-tight",
        align === "start" ? "items-start" : "items-center",
      )}
    >
      <span className="text-xs font-bold">{order.symbol}</span>
      <span className="flex items-center gap-1.5 text-[10px]">
        <span className={cn("font-medium", side?.text)}>{t(order.side)}</span>
        <span className="uppercase text-muted-foreground">{order.type}</span>
      </span>
    </div>
  );
}

type Translate = ReturnType<typeof useTranslations<"trade.orderColumns">>;

export function buildOrderColumns(
  onCancel: (order: Order) => void,
  t: Translate,
  cancellingId?: string,
): ColumnDef<Order>[] {
  return [
    {
      accessorKey: "symbol",
      header: ({ column }) => (
        <SortHeader column={column} title={t("symbol")} />
      ),
      cell: ({ row }) => <SymbolCell order={row.original} />,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortHeader column={column} title={t("status")} />
      ),
      cell: ({ row }) => <StatusCell status={row.original.status} />,
    },
    {
      accessorKey: "price",
      sortDescFirst: true,
      header: ({ column }) => (
        <SortHeader column={column} title={t("price")} />
      ),
      cell: ({ row }) => <Num value={row.original.price} />,
    },
    {
      accessorKey: "quantity",
      sortDescFirst: true,
      header: ({ column }) => (
        <SortHeader column={column} title={t("quantity")} />
      ),
      cell: ({ row }) => <Num value={row.original.quantity} />,
    },
    {
      accessorKey: "filledQuantity",
      sortDescFirst: true,
      header: ({ column }) => (
        <SortHeader column={column} title={t("filledQuantity")} />
      ),
      cell: ({ row }) => (
        <FilledCell
          filled={row.original.filledQuantity}
          quantity={row.original.quantity}
        />
      ),
    },
    {
      accessorKey: "createdAt",
      sortDescFirst: true,
      header: ({ column }) => (
        <SortHeader column={column} title={t("createdAt")} />
      ),
      cell: ({ row }) => <DateCell value={row.original.createdAt} />,
    },
    {
      id: "actions",
      header: t("actions"),
      enableSorting: false,
      cell: ({ row }) => {
        const o = row.original;
        const cancellable = o.status === "open" || o.status === "partial";
        if (!cancellable) {
          return <span className="text-muted-foreground">—</span>;
        }

        const isThisCancelling = cancellingId === o.id;
        return (
          <Button
            size="xs"
            color="destructive"
            disabled={isThisCancelling}
            onClick={() => onCancel(o)}
          >
            {isThisCancelling ? t("cancelling") : t("cancel")}
          </Button>
        );
      },
    },
  ];
}