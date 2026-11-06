import type { LedgerEntryType, WalletTrendRange } from "@repo/types";

export type PeriodId = "all" | WalletTrendRange;

export const PERIOD_OPTIONS: { id: PeriodId }[] = [
  { id: "all" },
  { id: "1D" },
  { id: "1W" },
  { id: "1M" },
  { id: "1Y" },
];

export type TypeGroupId =
  | "all"
  | "deposit"
  | "withdraw"
  | "trade"
  | "fee"
  | "lock"
  | "transfer";
export const INCOMING_TYPES = new Set<string>([
  "deposit",
  "trade_buy",
  "trade_sell",
  "unlock",
  "transfer_in",
]);
export const TYPE_GROUPS: {
  id: TypeGroupId;
  types: LedgerEntryType[];
}[] = [
  { id: "all", types: [] },
  { id: "deposit", types: ["deposit"] },
  { id: "withdraw", types: ["withdraw"] },
  { id: "trade", types: ["trade_buy", "trade_sell"] },
  { id: "fee", types: ["fee"] },
  { id: "lock", types: ["lock", "unlock"] },
  { id: "transfer", types: ["transfer_in", "transfer_out"] },
];

// فقط برای استفاده در کد، نه برای نمایش مستقیم
export const ASSET_DECIMALS: Record<string, number> = {
  BTC: 8,
  ETH: 8,
  BNB: 8,
  SOL: 8,
  XRP: 6,
  ADA: 6,
  USDT: 4,
};

export const DEFAULT_ASSET_DECIMALS = 8;

// Initial wallet page state — shared by the server prefetch and the client
// view so the hydrated cache matches the first client render.
export const WALLET_DEFAULT_ASSET = "BTC";
export const WALLET_DEFAULT_RANGE: WalletTrendRange = "1M";
export const WALLET_PAGE_SIZE = 10;

// Fixed number locale / time zone so server-rendered HTML matches hydration.
export const WALLET_NUMBER_LOCALE = "en-US";
// RTL (fa) users — Iran time.
export const WALLET_TIME_ZONE = "Asia/Tehran";
// LTR (non-IR) users — neutral global time.
export const GLOBAL_WALLET_TIME_ZONE = "UTC";

/** Picks the wallet time zone by text direction of the active locale. */
export const getWalletTimeZone = (locale: string) =>
  locale === "fa" ? WALLET_TIME_ZONE : GLOBAL_WALLET_TIME_ZONE;
