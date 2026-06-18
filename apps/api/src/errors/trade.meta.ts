import { TradeErrorCode } from "@repo/types";

export const ERROR_TRADE_HTTP_META: Record<
  TradeErrorCode,
  { status: number; messageKey: TradeErrorCode }
> = {
  INSUFFICIENT_BALANCE: { status: 400, messageKey: "INSUFFICIENT_BALANCE" },
  INVALID_BALANCE_LOCK_STATE: {
    status: 500,
    messageKey: "INVALID_BALANCE_LOCK_STATE",
  },
  INVALID_LOCK_AMOUNT: { status: 400, messageKey: "INVALID_LOCK_AMOUNT" },
  INVALID_QUANTITY: { status: 400, messageKey: "INVALID_QUANTITY" },
  INVALID_PRICE: { status: 400, messageKey: "INVALID_PRICE" },
  INVALID_SYMBOL: { status: 400, messageKey: "INVALID_SYMBOL" },
  ORDER_NOT_OPEN: { status: 400, messageKey: "ORDER_NOT_OPEN" },
  ORDER_NOT_FOUND: { status: 404, messageKey: "ORDER_NOT_FOUND" },
  ORDER_NOT_FOUND_IN_ENGINE: {
    status: 404,
    messageKey: "ORDER_NOT_FOUND_IN_ENGINE",
  },
  NEGATIVE_LEDGER_BALANCE: {
    status: 500,
    messageKey: "NEGATIVE_LEDGER_BALANCE",
  },
  BALANCE_ROW_NOT_FOUND: {
    status: 500,
    messageKey: "BALANCE_ROW_NOT_FOUND",
  },
};
