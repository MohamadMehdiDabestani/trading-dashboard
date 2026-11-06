"use client";

import { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { MarketTickers } from "./marketTickers";
import { SearchDialog } from "./searchDialog";
import { DepositDialog } from "./depositDialog";
import { BalanceWidget } from "./balanceWidget";
import { NotificationsMenu } from "./notificationsMenu";
import { ThemeAndLocaleToggle } from "./themeAndLocaleToggle";
import { UserMenu } from "./userMenu";

interface DashboardNavbarProps {
  breadcrumb?: ReactNode;
}

export function DashboardNavbar({ breadcrumb }: DashboardNavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full min-w-0 shrink-0 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md px-3 sm:px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14">
      {/* Start Section: Sidebar trigger + Breadcrumbs + Live Coin Tickers */}
      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
        <SidebarTrigger className="-ms-1 shrink-0" />
        <Separator
          orientation="vertical"
          className="mx-1 h-4 data-vertical:h-4 data-vertical:self-auto hidden sm:block shrink-0"
        />
        {breadcrumb && (
          <div className="truncate min-w-0 hidden sm:block">{breadcrumb}</div>
        )}
        <Separator
          orientation="vertical"
          className="mx-1 h-4 data-vertical:h-4 data-vertical:self-auto hidden xl:block shrink-0"
        />
        <MarketTickers />
      </div>

      {/* End Section: Search + Quick Deposit + Balance + Notifications + Theme/Lang + User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ms-2">
        <SearchDialog />
        <DepositDialog />
        <BalanceWidget />
        <Separator
          orientation="vertical"
          className="hidden sm:block h-4 mx-0.5 shrink-0"
        />
        <NotificationsMenu />
        <ThemeAndLocaleToggle />
        <UserMenu />
      </div>
    </header>
  );
}
