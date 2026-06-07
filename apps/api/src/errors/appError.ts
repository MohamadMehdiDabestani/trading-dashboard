import { type AllErrorCode } from "@repo/types";
import { ERROR_HTTP_META } from "./index";

export class AppError extends Error {
  readonly code: AllErrorCode;
  readonly statusCode: number;

  readonly params?: Record<string, string | number>;

  constructor(
    code: AllErrorCode,
    params?: Record<string, string | number>
  ) {
    const meta = ERROR_HTTP_META[code];

    super(meta.messageKey);

    this.code = code;
    this.statusCode = meta.status;
    this.params = params;
  }
}
