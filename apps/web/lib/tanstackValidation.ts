import { ZodType } from "zod";

export function zodField<T>(schema: ZodType<T>) {
  return ({ value }: { value: T }) => {
    const r = schema.safeParse(value);
    return r.success ? undefined : r.error.issues[0]?.message;
  };
}

export function zodForm<T extends Record<string, unknown>>(schema: ZodType<T>) {
  return ({ value }: { value: T }) => {
    const r = schema.safeParse(value);
    if (r.success) return undefined;
    const fields: Record<string, string> = {};
    for (const issue of r.error.issues) {
      const k = issue.path[0]?.toString();
      if (k && !fields[k]) fields[k] = issue.message;
    }
    return { fields };
  };
}

/** اولین پیام خام (کلید + پارامتر اختیاری) از آرایهٔ errors */
export function firstRaw(errors: unknown[]): string | undefined {
  for (const e of errors) {
    if (!e) continue;
    if (typeof e === "string") return e;
    if (typeof e === "object" && "message" in e) {
      const m = (e as { message?: unknown }).message;
      if (typeof m === "string") return m;
    }
  }
  return undefined;
}


export function parseMessage(
  raw?: string,
): { key: string; params?: Record<string, unknown> } | undefined {
  if (!raw) return undefined;

  const sep = raw.indexOf("|");
  if (sep === -1) return { key: raw };

  const key = raw.slice(0, sep);
  const rest = raw.slice(sep + 1);

  try {
    const params = JSON.parse(rest) as unknown;
    if (params && typeof params === "object" && !Array.isArray(params)) {
      return { key, params: params as Record<string, unknown> };
    }
    return { key };
  } catch {
    return { key };
  }
}