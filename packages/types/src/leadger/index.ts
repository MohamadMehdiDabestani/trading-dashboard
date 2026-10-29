export const LEDGER_ENTRY_TYPES = [
  "deposit", "withdraw", "trade_buy", "trade_sell", "fee",
  "lock", "unlock", "transfer_in", "transfer_out",
] as const;
export type LedgerEntryType = (typeof LEDGER_ENTRY_TYPES)[number];