"use client";

import { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { GetRecentTradesReply, OrderStatus } from "@repo/types";

export type Order = GetRecentTradesReply["items"][number];

const STATUS_META: Record<
  string,
  { label: string; dot: string; text: string }
> = {
  open: { label: "باز", dot: "bg-blue-500", text: "text-blue-600" },
  partial: { label: "نیمه‌پر", dot: "bg-amber-500", text: "text-amber-600" },
  filled: {
    label: "انجام‌شده",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
  },
  // cancelled is neutral grey on purpose: red everywhere = visual noise
  cancelled: {
    label: "لغو شده",
    dot: "bg-muted-foreground/50",
    text: "text-muted-foreground",
  },
};

const SIDE_META: Record<string, { label: string; text: string }> = {
  buy: { label: "خرید", text: "text-emerald-600" },
  sell: { label: "فروش", text: "text-red-600" },
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
  const m = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", m?.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m?.dot)} />
      {m?.label ?? status}
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
      {/* bar only when something is filled: an empty track on every row is noise */}
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
/** Jalali date + time on two lines, Latin digits (consistent with prices/quantities) */
export function DateCell({ value , align = "center"}: { value: Date | string , align?: "center" | "start"}) {
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
    <div dir="ltr" className={cn("flex flex-col leading-tight", align === "start" ? "items-start" : "items-center")}>
      <span className="text-xs tabular-nums">{date}</span>
      <span className="text-[10px] tabular-nums text-muted-foreground">
        {time}
      </span>
    </div>
  );
}

/**
 * Column ids (accessorKey) MUST match the backend sort whitelist (OrderSortField).
 * `cancellingId` = id of the order currently being cancelled (only that row is locked).
 */
export function SymbolCell({
  order,
  align = "center",
}: {
  order: Order;
  align?: "center" | "start";
}) {
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
        <span className={cn("font-medium", side?.text)}>
          {side?.label ?? order.side}
        </span>
        <span className="uppercase text-muted-foreground">{order.type}</span>
      </span>
    </div>
  );
}
export function buildOrderColumns(
  onCancel: (order: Order) => void,
  cancellingId?: string,
): ColumnDef<Order>[] {
  return [
    {
      accessorKey: "symbol",
      header: ({ column }) => <SortHeader column={column} title="جفت ارز" />,
      cell: ({ row }) => <SymbolCell order={row.original} />,
    },

    {
      accessorKey: "status",
      header: ({ column }) => <SortHeader column={column} title="وضعیت" />,
      cell: ({ row }) => <StatusCell status={row.original.status} />,
    },
    {
      accessorKey: "price",
      sortDescFirst: true,
      header: ({ column }) => <SortHeader column={column} title="قیمت" />,
      cell: ({ row }) => <Num value={row.original.price} />,
    },
    {
      accessorKey: "quantity",
      sortDescFirst: true,
      header: ({ column }) => <SortHeader column={column} title="مقدار" />,
      cell: ({ row }) => <Num value={row.original.quantity} />,
    },
    {
      accessorKey: "filledQuantity",
      sortDescFirst: true,
      header: ({ column }) => <SortHeader column={column} title="پر شده" />,
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
      header: ({ column }) => <SortHeader column={column} title="تاریخ" />,
      cell: ({ row }) => <DateCell value={row.original.createdAt} />,
    },
    {
      id: "actions",
      header: "عملیات",
      enableSorting: false,
      cell: ({ row }) => {
        const o = row.original;
        const cancellable = o.status === "open" || o.status === "partial";
        if (!cancellable) {
          // no disabled red buttons on every finished row
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
            {isThisCancelling ? "در حال لغو..." : "لغو"}
          </Button>
        );
      },
    },
  ];
}
