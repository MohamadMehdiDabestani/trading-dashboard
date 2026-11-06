"use client";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/lib/i18nNavigation";

type NavItem = {
  title: string;
  url: string;
  icon?: React.ReactNode;
  matchPrefix?: string;
  exact?: boolean;
};

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const isItemActive = (item: NavItem) => {
    if (item.exact) return pathname === item.url;
    const base = item.matchPrefix ?? item.url;
    return pathname === base || pathname.startsWith(`${base}/`);
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton
              className="data-active:bg-secondary hover:data-active:bg-accent"
              size="lg"
              asChild
              isActive={isItemActive(item)}
              tooltip={item.title}
            >
              <Link href={item.url}>
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
