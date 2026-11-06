"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18nNavigation";
import { useWalletBalances } from "@/features/dashboard/hooks/useDashboard";
import { Eye, EyeOff, Wallet, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function BalanceWidget() {
  const [hidden, setHidden] = useState(false);
  const t = useTranslations("navbar.balance");
  const { data: balances } = useWalletBalances();

  const usdt = balances?.find((b) => b.asset === "USDT");
  const amountNumber = Number(usdt?.available ?? 0);

  const formattedBalance = amountNumber.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/60 text-xs font-medium cursor-pointer transition-all select-none shrink-0"
        >
          <div className="size-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Wallet className="size-3.5" />
          </div>
          <div className="flex flex-col text-left rtl:text-right">
            <span className="text-[10px] text-muted-foreground leading-none">
              {t("title")}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                dir="ltr"
                className="font-mono font-bold text-xs text-foreground"
              >
                {hidden ? "••••••" : `$${formattedBalance}`}
              </span>
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-2">
        <div className="flex items-center justify-between p-2">
          <span className="text-xs text-muted-foreground">{t("available")}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              setHidden((prev) => !prev);
            }}
            title={hidden ? t("show") : t("hide")}
            className="text-muted-foreground hover:text-foreground"
          >
            {hidden ? (
              <EyeOff className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
          </Button>
        </div>

        <div className="px-2 pb-2">
          <p
            dir="ltr"
            className="font-mono text-lg font-bold tracking-tight text-foreground"
          >
            {hidden ? "••••••••" : `${formattedBalance} USDT`}
          </p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href="/dashboard/wallet"
            className="flex items-center justify-between text-xs font-medium text-primary w-full"
          >
            <span>{t("viewWallet")}</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
