import type { LedgerEntryType, WalletTrendRange } from "@repo/types";

export type PeriodId = "all" | WalletTrendRange;

export const PERIOD_OPTIONS: { id: PeriodId; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "1D", label: "۲۴ ساعت" },
  { id: "1W", label: "۷ روز" },
  { id: "1M", label: "۳۰ روز" },
  { id: "1Y", label: "۱ سال" },
];

export type TypeGroupId =
  | "all"
  | "deposit"
  | "withdraw"
  | "trade"
  | "fee"
  | "lock"
  | "transfer";

export const TYPE_GROUPS: {
  id: TypeGroupId;
  label: string;
  types: LedgerEntryType[];
}[] = [
  { id: "all", label: "همه", types: [] },
  { id: "deposit", label: "واریز", types: ["deposit"] },
  { id: "withdraw", label: "برداشت", types: ["withdraw"] },
  { id: "trade", label: "معامله", types: ["trade_buy", "trade_sell"] },
  { id: "fee", label: "کارمزد", types: ["fee"] },
  { id: "lock", label: "قفل / آزادسازی", types: ["lock", "unlock"] },
  { id: "transfer", label: "انتقال", types: ["transfer_in", "transfer_out"] },
];

export const TYPE_LABEL: Record<LedgerEntryType, string> = {
  deposit: "واریز",
  withdraw: "برداشت",
  trade_buy: "خرید",
  trade_sell: "فروش",
  fee: "کارمزد",
  lock: "قفل سفارش",
  unlock: "آزادسازی سفارش",
  transfer_in: "انتقال ورودی",
  transfer_out: "انتقال خروجی",
};

// جهت نمایشی (سبز/قرمز) بر اساس نوع ورودی
export const INCOMING_TYPES = new Set<string>([
  "deposit",
  "trade_buy",
  "trade_sell",
  "unlock",
  "transfer_in",
]);

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