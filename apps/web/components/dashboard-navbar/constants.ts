import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BarChart3,
  Wallet,
  Settings,
  Shield,
} from "lucide-react";

export type QuickNavKey =
  | "overview"
  | "markets"
  | "wallet"
  | "account"
  | "security";

export interface QuickNavItem {
  id: string;
  key: QuickNavKey;
  url: string;
  icon: LucideIcon;
  iconColor: string;
}

export const QUICK_NAV_ITEMS: readonly QuickNavItem[] = [
  {
    id: "nav-overview",
    key: "overview",
    url: "/dashboard",
    icon: LayoutDashboard,
    iconColor: "text-primary",
  },
  {
    id: "nav-markets",
    key: "markets",
    url: "/dashboard/markets",
    icon: BarChart3,
    iconColor: "text-emerald-500",
  },
  {
    id: "nav-wallet",
    key: "wallet",
    url: "/dashboard/wallet",
    icon: Wallet,
    iconColor: "text-blue-500",
  },
  {
    id: "nav-account",
    key: "account",
    url: "/dashboard/account",
    icon: Settings,
    iconColor: "text-amber-500",
  },
  {
    id: "nav-security",
    key: "security",
    url: "/dashboard/account",
    icon: Shield,
    iconColor: "text-purple-500",
  },
] as const;

export const FEATURED_TICKERS = [
  { symbol: "BTCUSDT", label: "BTC", color: "text-amber-500" },
  { symbol: "ETHUSDT", label: "ETH", color: "text-blue-500" },
  { symbol: "SOLUSDT", label: "SOL", color: "text-purple-500" },
] as const;
