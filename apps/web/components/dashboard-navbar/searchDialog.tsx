"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18nNavigation";
import { SYMBOLS, type SymbolValue } from "@repo/types";
import { useLivePrices } from "@/features/markets/hooks/useLivePrice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpRight, Command } from "lucide-react";
import { cn } from "@/lib/cn";
import { QUICK_NAV_ITEMS } from "./constants";

const ALL_SYMBOLS = SYMBOLS.map((s) => s.value) as SymbolValue[];

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const t = useTranslations("navbar.search");
  const { prices } = useLivePrices(ALL_SYMBOLS);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const cleanQuery = query.trim().toLowerCase();

  // Map static constant navigation items to dynamic localized titles
  const navItems = useMemo(() => {
    return QUICK_NAV_ITEMS.map((item) => ({
      ...item,
      title: t(`nav.${item.key}`),
    }));
  }, [t]);

  const filteredSymbols = useMemo(() => {
    if (!cleanQuery) return SYMBOLS;
    return SYMBOLS.filter(
      (s) =>
        s.label.toLowerCase().includes(cleanQuery) ||
        s.baseAsset.toLowerCase().includes(cleanQuery) ||
        s.slug.toLowerCase().includes(cleanQuery) ||
        s.value.toLowerCase().includes(cleanQuery),
    );
  }, [cleanQuery]);

  const filteredNav = useMemo(() => {
    if (!cleanQuery) return navItems;
    return navItems.filter((item) =>
      item.title.toLowerCase().includes(cleanQuery),
    );
  }, [cleanQuery, navItems]);

  const handleSelect = (url: string) => {
    setOpen(false);
    setQuery("");
    router.push(url);
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 rtl:px-3 ltr:px-1 gap-2 text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/70 border-border/70 rounded-lg justify-between w-40 md:w-56 lg:w-64 transition-all"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="size-3.5 shrink-0" />
          <span className="truncate hidden sm:inline">{t("placeholder")}</span>
          <span className="truncate sm:hidden">{t("shortPlaceholder")}</span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border/80 bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground shadow-xs">
          <Command className="size-2.5" />K
        </kbd>
      </Button>

      {/* Search Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0 border-border/80 [&>button]:inset-e-4 rtl:[&>button]:right-[unset]">
          <DialogHeader className="p-4 pb-5 border-b border-border/50 ">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Search className="size-4 text-primary" />
              <span>{t("dialogTitle")}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 pb-2">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("inputPlaceholder")}
                className="ps-9 pe-4 h-10 text-sm bg-muted/40 border-border/60 focus-visible:ring-primary"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto px-4 pb-4 space-y-4">
            {/* Markets Section */}
            {filteredSymbols.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t("marketsSection")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {filteredSymbols.map((item) => {
                    const live = prices[item.value as SymbolValue];
                    const isUp = live?.direction === "up";
                    const isDown = live?.direction === "down";
                    const priceFormatted = live?.price
                      ? Number(live.price).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "—";

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          handleSelect(`/dashboard/trade/${item.slug}`)
                        }
                        className="flex items-center justify-between p-2 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent/60 transition-all text-left rtl:text-right cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {item.baseAsset.slice(0, 1)}
                          </div>
                          <div>
                            <p className="font-semibold text-xs leading-none">
                              {item.label}
                            </p>
                            <span className="text-[10px] text-muted-foreground">
                              {item.baseAsset}
                            </span>
                          </div>
                        </div>

                        <div className="text-right rtl:text-left">
                          <p
                            dir="ltr"
                            className={cn(
                              "font-mono text-xs font-semibold",
                              isUp && "text-emerald-500",
                              isDown && "text-rose-500",
                            )}
                          >
                            ${priceFormatted}
                          </p>
                          <span className="text-[10px] text-primary flex items-center gap-0.5 justify-end rtl:justify-start">
                            {t("trade")}
                            <ArrowUpRight className="size-2.5" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Navigation Section */}
            {filteredNav.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t("navigationSection")}
                </p>
                <div className="flex flex-col gap-1">
                  {filteredNav.map((nav) => {
                    const Icon = nav.icon;
                    return (
                      <button
                        key={nav.id}
                        type="button"
                        onClick={() => handleSelect(nav.url)}
                        className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted text-xs font-medium transition-colors cursor-pointer text-left rtl:text-right"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={cn("size-4", nav.iconColor)} />
                          <span>{nav.title}</span>
                        </div>
                        <ArrowUpRight className="size-3 text-muted-foreground opacity-60" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredSymbols.length === 0 && filteredNav.length === 0 && (
              <div className="py-8 text-center text-muted-foreground text-xs">
                {t("noResults")} &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
