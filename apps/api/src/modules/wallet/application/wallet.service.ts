import Big from "big.js";
import { WalletAssetReply, WalletGetReply } from "@repo/types";
import { AppError } from "@/errors/appError";
import { WalletRepository } from "../infrastructure/repositories/wallet.repository";
import { DrizzleWalletUnitOfWork } from "../infrastructure/unitOfWork/drizzleUnitOfWork";

export class WalletService {
  constructor(
    private walletQuery: WalletRepository,
    private walletUow: DrizzleWalletUnitOfWork,
  ) {}

  async getSingleAsset(
    userId: string,
    asset: string,
    page = 1,
    pageSize = 20,
  ): Promise<WalletAssetReply> {
    const res = await this.walletQuery.getSingleAsset(
      userId,
      asset,
      page,
      pageSize,
    );

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

  async getBalance(userId: string): Promise<WalletGetReply[]> {
    return this.walletQuery.getBalance(userId);
  }

  async deposit(userId: string, asset: string, amount: Big): Promise<void> {
    await this.walletUow.run(async ({ balance, ledger }) => {
      const { balanceBefore, balanceAfter } = await balance.creditAvailable({
        userId,
        asset,
        amount,
      });

      await ledger.createDepositEntry({
        userId,
        asset,
        amount,
        balanceBefore,
        balanceAfter,
      });
    });
  }
}
