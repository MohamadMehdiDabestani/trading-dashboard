import { PaginatedResult } from "@repo/types";
import { Big } from "big.js";
export interface WalletRepository {
  getSingleAsset(
    userId: string,
    asset: string,
    page: number,
    pageSize: number,
  ): Promise<
    | {
        asset: string;
        locked: Big;
        available: Big;
        history: PaginatedResult<
          {
            time: Date;
            amount: Big;
            type: string;
          }
        >;
      }
    | undefined
  >;
  getBalance(userId: string): Promise<
    {
      asset: string;
      locked: Big;
      available: Big;
      id: string;
    }[]
  >;
  deposit(userId: string, asset: string, amount: Big): Promise<void>;
}
