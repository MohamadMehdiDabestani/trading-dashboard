"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18nNavigation";
import { useWalletNotifications } from "@/features/wallet/hooks/useWalletNotifications";
import type { LedgerEntryType, WalletNotificationItem } from "@repo/types";
import {
  Bell,
  CheckCheck,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Unlock,
  Receipt,
  Activity,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "trading_read_notifications";

function getNotificationIcon(type: LedgerEntryType) {
  switch (type) {
    case "deposit":
      return {
        icon: ArrowDownLeft,
        className: "text-emerald-500 bg-emerald-500/10",
      };
    case "withdraw":
      return {
        icon: ArrowUpRight,
        className: "text-rose-500 bg-rose-500/10",
      };
    case "trade_buy":
      return {
        icon: TrendingUp,
        className: "text-emerald-500 bg-emerald-500/10",
      };
    case "trade_sell":
      return {
        icon: TrendingDown,
        className: "text-amber-500 bg-amber-500/10",
      };
    case "lock":
      return {
        icon: Lock,
        className: "text-purple-500 bg-purple-500/10",
      };
    case "unlock":
      return {
        icon: Unlock,
        className: "text-blue-500 bg-blue-500/10",
      };
    case "fee":
      return {
        icon: Receipt,
        className: "text-muted-foreground bg-muted",
      };
    default:
      return {
        icon: Activity,
        className: "text-primary bg-primary/10",
      };
  }
}

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  } catch {
    return "";
  }
}

export function NotificationsMenu() {
  const t = useTranslations("navbar.notifications");
  const { data: notifications = [], isLoading } = useWalletNotifications(20);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Load read notification IDs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      }
    } catch {
      // ignore JSON parse errors
    }
  }, []);

  // Save read notification IDs to localStorage
  const saveReadIds = (next: Set<string>) => {
    setReadIds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // ignore quota errors
    }
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readIds.has(n.id)).length;
  }, [notifications, readIds]);

  const markAllRead = () => {
    const next = new Set(readIds);
    notifications.forEach((n) => next.add(n.id));
    saveReadIds(next);
  };

  const markSingleRead = (id: string) => {
    if (readIds.has(id)) return;
    const next = new Set(readIds);
    next.add(id);
    saveReadIds(next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative text-muted-foreground hover:text-foreground rounded-lg"
          aria-label={t("title")}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 end-1 flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-84 sm:w-96 p-0 border-border/80">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">
              {t("title")}
            </span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <CheckCheck className="size-3" />
              <span>{t("markAllRead")}</span>
            </button>
          )}
        </div>

        {/* List of Ledger Notifications */}
        <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Loading ledger activity...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground px-4">
              {t("empty")}
            </div>
          ) : (
            notifications.map((item: WalletNotificationItem) => {
              const isRead = readIds.has(item.id);
              const { icon: Icon, className: iconClass } = getNotificationIcon(
                item.type,
              );

              const formattedAmount = Number(item.amount).toLocaleString(
                "en-US",
                {
                  maximumFractionDigits: 8,
                },
              );

              const isPositive =
                Number(item.amount) > 0 ||
                item.type === "deposit" ||
                item.type === "trade_buy";

              return (
                <div
                  key={item.id}
                  onClick={() => markSingleRead(item.id)}
                  className={cn(
                    "p-3 flex items-start gap-3 hover:bg-muted/50 cursor-pointer transition-colors text-left rtl:text-right group",
                    !isRead && "bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      iconClass,
                    )}
                  >
                    <Icon className="size-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-xs font-semibold leading-tight truncate",
                          !isRead ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {t(`types.${item.type}`)}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span
                        dir="ltr"
                        className={cn(
                          "font-mono text-xs font-bold",
                          isPositive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {isPositive ? `+${formattedAmount}` : formattedAmount}{" "}
                        {item.asset}
                      </span>
                      <span
                        dir="ltr"
                        className="text-[10px] font-mono text-muted-foreground"
                      >
                        Bal: {Number(item.balanceAfter).toLocaleString("en-US")}
                      </span>
                    </div>
                  </div>

                  {!isRead && (
                    <span className="size-2 rounded-full bg-primary shrink-0 self-center" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Link */}
        <div className="p-2 border-t border-border/50 bg-muted/20">
          <Link
            href="/dashboard/wallet"
            className="flex items-center justify-center gap-1.5 py-1 text-xs font-medium text-primary hover:underline"
          >
            <span>{t("viewAll")}</span>
            <ArrowRight className="size-3 rtl:rotate-180" />
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
