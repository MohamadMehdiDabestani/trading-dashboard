"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import type { ReactNode } from "react";
import type { SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";
import {
  DateCell,
  FilledCell,
  Num,
  StatusCell,
  SymbolCell,
  type Order,
} from "../utils/columns";

const SORT_OPTION_IDS = [
  "createdAt",
  "price",
  "quantity",
  "filledQuantity",
  "symbol",
  "status",
] as const;

export function OrderSortBar({
  sorting,
  onChange,
}: {
  sorting: SortingState;
  onChange: (s: SortingState) => void;
}) {
  const t = useTranslations("trade.orderCards");
  const current = sorting[0] ?? { id: "createdAt", desc: true };

  return (
    <div className="flex items-center gap-2 border-b px-3 py-2">
      <span className="text-xs text-muted-foreground">{t("sortLabel")}</span>
      <Select
        value={current.id}
        onValueChange={(id) => onChange([{ id, desc: current.desc }])}
      >
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTION_IDS.map((id) => (
            <SelectItem key={id} value={id}>
              {t(`sortOptions.${id}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label={t("sortDirection")}
        onClick={() => onChange([{ id: current.id, desc: !current.desc }])}
      >
        {current.desc ? (
          <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUp className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <dt className="text-[10px] text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

type Props = {
  orders: Order[];
  isLoading?: boolean;
  isFetching?: boolean;
  cancellingId?: string;
  onCancel: (order: Order) => void;
  emptyText?: string;
};

export function OrderCards({
  orders,
  isLoading,
  isFetching,
  cancellingId,
  onCancel,
  emptyText,
}: Props) {
  const t = useTranslations("trade.orderCards");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {emptyText ?? t("empty")}
      </p>
    );
  }

  return (
    <ul
      className={cn(
        "flex flex-col gap-2 p-3 transition-opacity",
        isFetching && "opacity-60",
      )}
    >
      {orders.map((o) => {
        const cancellable = o.status === "open" || o.status === "partial";
        const isCancelling = cancellingId === o.id;

        return (
          <li
            key={o.id}
            className={cn(
              "flex flex-col gap-3 rounded-lg border p-3",
              o.status === "cancelled" && "opacity-60",
            )}
          >
            <div className="flex items-start justify-between">
              <SymbolCell order={o} align="start" />
              <StatusCell status={o.status} />
            </div>

            <dl className="grid grid-cols-3 gap-2">
              <Field label={t("fields.price")}>
                <Num value={o.price} />
              </Field>
              <Field label={t("fields.quantity")}>
                <Num value={o.quantity} />
              </Field>
              <Field label={t("fields.filled")}>
                <FilledCell filled={o.filledQuantity} quantity={o.quantity} />
              </Field>
            </dl>

            <div className="flex items-center justify-between gap-3">
              <DateCell value={o.createdAt} align="start" />
              {cancellable && (
                <Button
                  size="xs"
                  color="destructive"
                  disabled={isCancelling}
                  onClick={() => onCancel(o)}
                >
                  {isCancelling ? t("cancelling") : t("cancel")}
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}