"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toFormError } from "@/lib/validation/formError";

const PREFIX = "common.validation.";

export function useFormErrorTranslator() {
  const t = useTranslations("common.validation");
  const tFields = useTranslations("common.fields");

  return useCallback(
    (errors: unknown[], fieldName?: string): string[] => {
      for (const raw of errors) {
        const e = toFormError(raw);
        if (!e) continue;

        const key = (e.key.startsWith(PREFIX) ? e.key.slice(PREFIX.length) : e.key) as Parameters<typeof t.has>[0];

        const rawField = (e.params?.field as string | undefined) ?? fieldName;
        const fieldLabel =
          rawField && tFields.has(rawField as never)
            ? tFields(rawField as never)
            : rawField ?? "";

        if (t.has(key)) {
          return [t(key, { ...e.params, field: fieldLabel })];
        }
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[i18n] missing key "common.validation.${String(key)}"`);
        }
        return [t("invalid")];
      }
      return [];
    },
    [t, tFields],
  );
}