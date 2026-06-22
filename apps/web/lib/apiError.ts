// lib/apiError.ts
import { AllErrorCode, ValidationErrorCode } from "@repo/types";

export type FieldErrors = Record<string, { key: ValidationErrorCode; params?: Record<string, string | number> }>;

export class ApiError extends Error {
  code: AllErrorCode;
  fields?: FieldErrors;
  params?: Record<string, string | number>;

  constructor(code: AllErrorCode, fields?: FieldErrors, params?: Record<string, string | number>) {
    super(code);
    this.code = code;
    this.fields = fields;
    this.params = params;
  }
}
