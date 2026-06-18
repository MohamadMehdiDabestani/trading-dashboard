import { AUTH_ERROR_CODES, type AuthErrorCode } from "./auth/error";
import { AUTH_SUCCESS_CODES, type AuthSuccessCodes } from "./auth/ok";
import { OTP_ERROR_CODES, type OtpErrorCode } from "./otp/error";
import { TOKEN_ERROR_CODES, type TokenErrorCode } from "./token/error";
import { COMMON_ERROR_CODES, type CommonErrorCode } from "./common/error";
import {
  VALIDATION_ERROR_CODES,
  type ValidationErrorCode,
} from "./validation/error";
import { WALLET_ERROR_CODES, type WalletErrorCode } from "./wallet/error";
import { TRADE_ERROR_CODES, type TradeErrorCode } from "./trade/error";
import { TRADE_SUUCEESS_CODES, type TradeSuccessCodes } from "./trade/ok";
export const ALL_ERROR_CODES = [
  ...AUTH_ERROR_CODES,
  ...OTP_ERROR_CODES,
  ...TOKEN_ERROR_CODES,
  ...VALIDATION_ERROR_CODES,
  ...COMMON_ERROR_CODES,
  ...WALLET_ERROR_CODES,
  ...TRADE_ERROR_CODES,
] as const;
export const ALL_SUCCESS_CODES = [
  ...AUTH_SUCCESS_CODES,
  ...TRADE_SUUCEESS_CODES,
];
export type AllErrorCode = (typeof ALL_ERROR_CODES)[number];
export type AllSuccessCodes = (typeof ALL_SUCCESS_CODES)[number];
export {
  AUTH_ERROR_CODES,
  OTP_ERROR_CODES,
  TOKEN_ERROR_CODES,
  VALIDATION_ERROR_CODES,
  AUTH_SUCCESS_CODES,
  COMMON_ERROR_CODES,
  WALLET_ERROR_CODES,
  TradeErrorCode,
  TradeSuccessCodes,
  CommonErrorCode,
  AuthSuccessCodes,
  OtpErrorCode,
  TokenErrorCode,
  ValidationErrorCode,
  AuthErrorCode,
  WalletErrorCode,
};
