import { LedgerEntryType } from "../leadger";

export type WalletTrendRange = "1D" | "1W" | "1M" | "1Y";
 
export type WalletTrendPoint = {
  time: string;
  balance: string;
};
 
export type WalletTrendReply = {
  range: WalletTrendRange;
  points: WalletTrendPoint[];
  changePercent: number | null; 
};
 
export type MarketPricesReply = Record<string, string>;

export type WalletHistoryFilters = {
  period?: WalletTrendRange; 
  types?: LedgerEntryType[]; 
};