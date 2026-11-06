"use client";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { NavMain } from "@/components/nav-main";
import { SidebarSettingsMenu } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  BotIcon,
  BookOpenIcon,
  Settings2Icon,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Link } from "@/lib/i18nNavigation";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("sidebar");

  const data = useMemo(
    () => [
      {
        title: t("overview"),
        isActive: true,
        url: "/dashboard",
        icon: <LayoutDashboard />,
        exact: true,
      },
      {
        title: t("markets"),
        url: "/dashboard/markets",
        icon: <TrendingUp />,
      },
      {
        title: t("trade"),
        url: "/dashboard/trade/btc",
        matchPrefix: "/dashboard/trade",
        icon: <BotIcon />,
      },
      {
        title: t("wallet"),
        url: "/dashboard/wallet",
        icon: <BookOpenIcon />,
      },
      {
        title: t("account"),
        url: "/dashboard/account",
        icon: <Settings2Icon />,
      },
    ],
    [t],
  );

  return (
    <Sidebar {...props}>
      <SidebarHeader className="p-3 border-b border-sidebar-border/40">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-xs shrink-0">
            <Activity className="size-4.5" />
          </div>
          <div className="flex flex-col text-left rtl:text-right min-w-0">
            <span className="font-bold text-sm tracking-tight text-sidebar-foreground truncate">
              DEMO
            </span>
            <span className="text-[10px] text-muted-foreground font-medium truncate">
              Trading Platform
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarSettingsMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
