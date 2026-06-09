import { WalletErrorCode } from "@repo/types";

export const ERROR_TOKEN_HTTP_META: Record<
  WalletErrorCode,
  { status: number; messageKey: WalletErrorCode }
> = {
  WALLET_INVALID_AMOUNT: { status: 422, messageKey: "WALLET_INVALID_AMOUNT" },
};
