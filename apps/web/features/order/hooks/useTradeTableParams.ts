"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import { ValueOrderSortField, ValueOrderStatus, type OrderSortField, type OrderStatus } from "@repo/types";

export type StatusFilter = OrderStatus | "all";


const PAGE_SIZES = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT = { id: "createdAt", desc: true };

function parseSort(raw: string | null): SortingState {
  if (raw) {
    const [id = "", dir] = raw.split(".");
    if (
      ValueOrderSortField.includes(id as OrderSortField) &&
      (dir === "asc" || dir === "desc")
    ) {
      return [{ id, desc: dir === "desc" }];
    }
  }
  return [DEFAULT_SORT];
}

export function useTradeTableParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const statusRaw = searchParams.get("status");
  const status: StatusFilter = ValueOrderStatus.includes(statusRaw as OrderStatus)
    ? (statusRaw as OrderStatus)
    : "all";

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const sizeRaw = Number(searchParams.get("pageSize"));
  const pageSize = PAGE_SIZES.includes(sizeRaw) ? sizeRaw : DEFAULT_PAGE_SIZE;

  const sortRaw = searchParams.get("sort");
  const sorting = useMemo(() => parseSort(sortRaw), [sortRaw]);

  // one router.replace per user action (several keys can change together)
  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null) params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const setPage = useCallback(
    (p: number) => update({ page: p > 1 ? String(p) : null }),
    [update],
  );

  const setPageSize = useCallback(
    (s: number) =>
      update({
        pageSize: s === DEFAULT_PAGE_SIZE ? null : String(s),
        page: null,
      }),
    [update],
  );

  const setStatus = useCallback(
    (s: StatusFilter) =>
      update({ status: s === "all" ? null : s, page: null }),
    [update],
  );

  const setSorting: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];
      // cleared or equal to default => remove from URL (backend default = createdAt desc)
      if (!first || (first.id === DEFAULT_SORT.id && first.desc)) {
        update({ sort: null, page: null });
        return;
      }
      update({
        sort: `${first.id}.${first.desc ? "desc" : "asc"}`,
        page: null,
      });
    },
    [sorting, update],
  );

  return {
    status,
    page,
    pageSize,
    sorting,
    setStatus,
    setPage,
    setPageSize,
    setSorting,
  };
}