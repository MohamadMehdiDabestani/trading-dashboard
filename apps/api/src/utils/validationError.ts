import {FieldError, ValidationErrorCode} from '@repo/types'
type AjvError = { keyword: string; instancePath: string; params: Record<string, any> };
const KEYWORD_MAP: Record<string, ValidationErrorCode> = {
  required: "VALIDATION_REQUIRED",
  minLength: "VALIDATION_MIN_LENGTH",
  maxLength: "VALIDATION_MAX_LENGTH",
  pattern: "VALIDATION_PATTERN",
  format: "VALIDATION_PATTERN",
};


export function parseValidationErrors(errors: AjvError[]) {
  const fields: Record<string, FieldError> = {};
  for (const err of errors) {
    const base = err.instancePath.replace(/^\//, "").replace(/\//g, ".");
    const field =
      err.keyword === "required"
        ? [base, err.params.missingProperty].filter(Boolean).join(".")
        : base;
    if (!field || fields[field]) continue;

    fields[field] = {
      key: KEYWORD_MAP[err.keyword] ?? "VALIDATION_INVALID_VALUE",
      params:
        err.keyword === "minLength" ? { min: err.params.limit } :
        err.keyword === "maxLength" ? { max: err.params.limit } :
        undefined,
    };
  }
  return fields;
}