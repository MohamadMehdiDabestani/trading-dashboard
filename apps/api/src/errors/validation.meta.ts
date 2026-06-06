import { ValidationErrorCode } from "@repo/types";

export const ERROR_VALIDATION_HTTP_META: Record<
  ValidationErrorCode,
  { status: number; messageKey: ValidationErrorCode }
> = {
  VALIDATION_ERROR: {
    status: 400,
    messageKey: "VALIDATION_ERROR",
  },
  VALIDATION_INVALID_VALUE: {
    status: 400,
    messageKey: "VALIDATION_INVALID_VALUE",
  },
  VALIDATION_MAX_LENGTH: {
    status: 400,
    messageKey: "VALIDATION_MAX_LENGTH",
  },
  VALIDATION_MIN_LENGTH: {
    status: 400,
    messageKey: "VALIDATION_MIN_LENGTH",
  },
  VALIDATION_PATTERN: {
    status: 400,
    messageKey: "VALIDATION_PATTERN",
  },
  VALIDATION_REQUIRED: {
    status: 400,
    messageKey: "VALIDATION_REQUIRED",
  },
};
