"use client";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { NavMain } from "@/components/nav-main";
import { SidebarSettingsMenu } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  BotIcon,
  BookOpenIcon,
  Settings2Icon,
} from "lucide-react";

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
