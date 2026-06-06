export const ERROR_CODES = {
  OTP_RATE_LIMIT: { status: 429, messageKey: "otp.rate_limit" },
  OTP_INVALID: { status: 400, messageKey: "otp.invalid" },
  OTP_WRONG: { status: 400, messageKey: "otp.wrong" },
  OTP_MAX_ATTEMPTS: { status: 429, messageKey: "otp.max_attempts" },
  INVALID_REFRESH: { status: 401, messageKey: "auth.invalid_refresh" },
  USER_NOT_FOUND: { status: 404, messageKey: "user.not_found" },
  UNAUTHORIZED: { status: 401, messageKey: "auth.unauthorized" },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;