type AjvError = { instancePath: string; message?: string; params?: Record<string, unknown> };

const MSG_MAP: Record<string, string> = {
  "must NOT have fewer than":    "validation.min_length",
  "must NOT have more than":     "validation.max_length",
  "must match pattern":          "validation.pattern",
  "must have required property": "validation.required",
  "must be equal to constant":   "validation.invalid_value",
};

function mapMessage(msg = ""): string {
  for (const [fragment, key] of Object.entries(MSG_MAP)) {
    if (msg.includes(fragment)) return key;
  }
  return "validation.invalid";
}

export function parseValidationErrors(errors: AjvError[]): Record<string, { key: string }> {
  const fields: Record<string, { key: string }> = {};
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
