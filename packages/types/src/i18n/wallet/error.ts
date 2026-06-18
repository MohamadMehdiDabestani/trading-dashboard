export const WALLET_ERROR_CODES = [
  "WALLET_INVALID_AMOUNT",
  "DEPOSIT_FAILED"
] as const;

export type WalletErrorCode = (typeof WALLET_ERROR_CODES)[number];