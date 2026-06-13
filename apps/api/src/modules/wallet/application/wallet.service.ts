import Big from "big.js";
import { WalletRepository } from "../types/wallet.repository";
import { WalletAssetReply, WalletGetReply } from "@repo/types";
import { AppError } from "@/errors/appError";

export class WalletService {
  constructor(private wallet: WalletRepository) {}
  async getSingleAssest(
    userId: string,
    asset: string,
    page = 1,
    pageSize = 20,
  ): Promise<WalletAssetReply> {
    const res = await this.wallet.getSingleAsset(userId, asset, page, pageSize);

    if (!res) {
      return {
        asset,
        locked: new Big("0"),
        available: new Big("0"),
        history: {
          items: [],
          page,
          pageSize,
          total: 0,
          totalPage: 0,
        },
      };
    }

    return res;
  }

  async getBalance(userId: string) {
    const res = await this.wallet.getBalance(userId);
    return res;
  }

  async deposit(userId: string, asset: string, amount: Big) {
    if (amount.lt(0)) throw new AppError("WALLET_INVALID_AMOUNT");
    const res = await this.wallet.deposit(userId, asset, amount);
    return res;
  }
}
