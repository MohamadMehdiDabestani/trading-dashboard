import type { z } from "zod";

export type FormErrorParams = Record<string, string | number>;
export type FormErrorMsg = { key: string; params?: FormErrorParams };

export function isFormError(e: unknown): e is FormErrorMsg {
  return (
    typeof e === "object" &&
    e !== null &&
    "key" in e &&
    typeof (e as { key: unknown }).key === "string"
  );
}

export function toFormError(e: unknown): FormErrorMsg | undefined {
  if (!e) return undefined;
  if (typeof e === "string") return { key: e };
  if (isFormError(e)) return e;
  if (typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string") return { key: m };
  }
  return undefined;
}

export function issueToFormError(issue: z.core.$ZodIssue): FormErrorMsg {
  const params: FormErrorParams = {};
  const i = issue as unknown as Record<string, unknown>;
  const num = (v: unknown) =>
    typeof v === "number" || typeof v === "bigint" ? Number(v) : undefined;

  const min = num(i.minimum);
  const max = num(i.maximum);
  if (min !== undefined) params.min = min;
  if (max !== undefined) params.max = max;
  if (i.exact === true) params.length = (min ?? max) as number;
  if (i.params && typeof i.params === "object") {
    Object.assign(params, i.params as FormErrorParams);
  }

  return {
    key: issue.message,
    params: Object.keys(params).length ? params : undefined,
  };
}