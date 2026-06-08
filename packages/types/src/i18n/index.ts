import { AUTH_ERROR_CODES, type AuthErrorCode } from "./auth/error";
import { AUTH_SUCCESS_CODES, type AuthSuccessCodes } from "./auth/ok";
import { OTP_ERROR_CODES, type OtpErrorCode } from "./otp/error";
import { TOKEN_ERROR_CODES, type TokenErrorCode } from "./token/error";
import { COMMON_ERROR_CODES, type CommonErrorCode} from "./common/error";
import {
  VALIDATION_ERROR_CODES,
  type ValidationErrorCode,
} from "./validation/error";
export const ALL_ERROR_CODES = [
  ...AUTH_ERROR_CODES,
  ...OTP_ERROR_CODES,
  ...TOKEN_ERROR_CODES,
  ...VALIDATION_ERROR_CODES,
  ...COMMON_ERROR_CODES,
  
] as const;
export const ALL_SUCCESS_CODES = [...AUTH_SUCCESS_CODES];
export type AllErrorCode = (typeof ALL_ERROR_CODES)[number];
export type AllSuccessCodes = (typeof ALL_SUCCESS_CODES)[number];
export {
  AUTH_ERROR_CODES,
  OTP_ERROR_CODES,
  TOKEN_ERROR_CODES,
  VALIDATION_ERROR_CODES,
  AUTH_SUCCESS_CODES,
  COMMON_ERROR_CODES,
  CommonErrorCode,
  AuthSuccessCodes,
  OtpErrorCode,
  TokenErrorCode,
  ValidationErrorCode,
  AuthErrorCode,
};
