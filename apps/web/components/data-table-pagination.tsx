"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  totalPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
};

const fa = (n: number) => n.toLocaleString("en-US");

function getPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const set = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...set]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const out: (number | "...")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("...");
    out.push(p);
    prev = p;
  }
  return out;
}

/** Layout assumes an RTL page: "previous" points right, "next" points left. */
export function DataTablePagination({
  page,
  pageSize,
  total,
  totalPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  disabled,
}: Props) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const canPrev = page > 1;
  const canNext = page < totalPage;

  const nav = "h-7 w-7";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2 text-xs">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span>
          نمایش <bdi dir="ltr">{fa(from)}</bdi> تا <bdi dir="ltr">{fa(to)}</bdi>{" "}
          از <bdi dir="ltr">{fa(total)}</bdi>
        </span>
        <div className="flex items-center gap-2">
          <span>تعداد در صفحه</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
            disabled={disabled}
          >
            <SelectTrigger className="h-7 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {fa(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={nav}
          disabled={!canPrev || disabled}
          onClick={() => onPageChange(1)}
          aria-label="صفحه اول"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={nav}
          disabled={!canPrev || disabled}
          onClick={() => onPageChange(page - 1)}
          aria-label="صفحه قبل"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="px-2 tabular-nums sm:hidden">
          {fa(page)} / {fa(totalPage)}
        </span>
        <div className="hidden items-center gap-1 sm:flex">
          {getPageRange(page, totalPage).map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="px-1 text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "ghost"}
                size="icon"
                className={cn(nav, "text-xs")}
                disabled={disabled}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
              >
                {fa(p)}
              </Button>
            ),
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={nav}
          disabled={!canNext || disabled}
          onClick={() => onPageChange(page + 1)}
          aria-label="صفحه بعد"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={nav}
          disabled={!canNext || disabled}
          onClick={() => onPageChange(totalPage)}
          aria-label="صفحه آخر"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
