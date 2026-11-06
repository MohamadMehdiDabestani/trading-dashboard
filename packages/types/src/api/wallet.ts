import { Big } from "big.js";
import { PaginatedResult } from "../common";
import { LedgerEntryType } from "../leadger";

export interface WalletGetReply {
  asset: string;
  locked: Big;
  available: Big;
  id: string;
}

export type AssetHistory = {
  time: Date;
  amount: Big;
  type: string;
};

export interface WalletAssetReply {
  asset: string;
  locked: Big;
  available: Big;
  history: PaginatedResult<AssetHistory>;
}

export type WalletWithdrawDto = {
  asset: string;
  amount: string;
  address?: string;
};

export interface WalletNotificationItem {
  id: string;
  type: LedgerEntryType;
  asset: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  refId: string | null;
  refType: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export type WalletNotificationsReply = WalletNotificationItem[];
