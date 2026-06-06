import { type ErrorCode, ERROR_CODES } from "@repo/types";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly messageKey: string;

  constructor(code: ErrorCode) {
    const meta = ERROR_CODES[code];
    super(meta.messageKey);
    this.code = code;
    this.statusCode = meta.status;
    this.messageKey = meta.messageKey;
  }
}
