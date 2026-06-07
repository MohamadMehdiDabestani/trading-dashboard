import {ValidationErrorCode} from '@repo/types'
type AjvError = { instancePath: string; message?: string; params?: Record<string, unknown> };

const MSG_MAP: Record<string, ValidationErrorCode> = {
  "must NOT have fewer than":    "VALIDATION_MIN_LENGTH",
  "must NOT have more than":     "VALIDATION_MAX_LENGTH",
  "must match pattern":          "VALIDATION_PATTERN",
  "must have required property": "VALIDATION_REQUIRED",
  "must be equal to constant":   "VALIDATION_INVALID_VALUE",
};

function mapMessage(msg = ""): ValidationErrorCode {
  for (const [fragment, key] of Object.entries(MSG_MAP)) {
    if (msg.includes(fragment)) return key;
  }
  return "VALIDATION_INVALID_VALUE";
}

export function parseValidationErrors(errors: AjvError[]): Record<string, { key: ValidationErrorCode }> {
  const fields: Record<string, { key: ValidationErrorCode }> = {};
  for (const err of errors) {
    let field = err.instancePath.replace(/^\//, "");
    if (!field && err.params?.missingProperty) {
      field = err.params.missingProperty as string;
    }
    if (field && !fields[field]) {
      fields[field] = { key: mapMessage(err.message) };
    }
  }
  return fields;
}
