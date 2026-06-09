import { Big } from "big.js";
import { PaginatedResult } from "../common";
export interface WalletGetReply {
  asset: string;
  locked: Big;
  available: Big;
  id: string;
}

export type AssetHistory = {
    time : Date,
    amount : Big,
    type : string
}
export interface WalletAssetReply {
  asset: string;
  locked: Big;
  available: Big;
  history : PaginatedResult<AssetHistory>
}
