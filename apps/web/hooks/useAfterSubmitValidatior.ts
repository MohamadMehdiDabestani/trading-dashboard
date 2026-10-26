import { useMemo } from "react";
import { useSelector } from  "@tanstack/react-store";
import type { AnyFormApi } from "@tanstack/react-form";
import type { ZodType } from "zod";
import { zodField } from "@/lib/tanstackValidation";

export function useAfterSubmitValidators<T>(
  form: AnyFormApi,
  schema: ZodType<T>,
) {
  const submitted = useSelector(form.store, (s) => s.isSubmitted);
  const validator = useMemo(() => zodField(schema), [schema]);

  return useMemo(
    () => ({
      onBlur: validator,
      ...(submitted && { onChange: validator }),
    }),
    [submitted, validator],
  );
}