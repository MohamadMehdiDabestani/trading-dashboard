import type { ZodType } from "zod";
import "./zodErrorMap"; 
import { issueToFormError, type FormErrorMsg } from "./formError";

export function zodField<T>(schema: ZodType<T>) {
  return ({ value }: { value: T }): FormErrorMsg | undefined => {
    const r = schema.safeParse(value);
    if (r.success) return undefined;
    const [issue] = r.error.issues;
    return issue ? issueToFormError(issue) : { key: "invalid" };
  };
}
export function zodForm<T extends Record<string, unknown>>(schema: ZodType<T>) {
  return ({ value }: { value: T }) => {
    const r = schema.safeParse(value);
    if (r.success) return undefined;
    const fields: Record<string, FormErrorMsg> = {};
    for (const issue of r.error.issues) {
      const k = issue.path[0]?.toString();
      if (k && !fields[k]) fields[k] = issueToFormError(issue);
    }
    return { fields };
  };
}