import { ApiError } from "./apiError";

type TranslateFn = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

type FormLike = {
  setFieldMeta: (field: any, updater: (prev: any) => any) => void;
};

export function applyApiFieldErrors(
  error: unknown,
  form: FormLike,
  options?: { mapField?: (apiField: string) => string | null },
): boolean {
  if (!(error instanceof ApiError) || !error.fields) return false;
  let applied = false;

  for (const [apiField, fieldError] of Object.entries(error.fields)) {
    const formField = options?.mapField ? options.mapField(apiField) : apiField;
    if (!formField) continue;
    applied = true;
    form.setFieldMeta(formField, (prev: any) => ({
      ...prev,
      errors: [fieldError],
      errorMap: { ...(prev?.errorMap ?? {}), onSubmit: fieldError },
    }));
  }
  return applied;
}

export function getFormErrorMessage(
  errors: unknown,
  t: TranslateFn,               // ← اینجا
  fieldName: string,
): string[] {
  if (!errors) return [];
  const list = Array.isArray(errors) ? errors : [errors];
  if (list.length === 0) return [];
  const label = t(`fields.${fieldName}`);

  return list.map((err) => {
    if (typeof err === "string") {
      return t(`validation.${err}`, { field: label });
    }
    if (err && typeof err === "object") {
      if ("key" in err) {
        const { key, params } = err as {
          key: string;
          params?: Record<string, string | number | Date>;
        };
        return t(`validation.${key}`, { field: label, ...params });
      }
      if ("message" in err) {
        return t(`validation.${(err as { message: string }).message}`, {
          field: label,
        });
      }
    }
    return t("validation.VALIDATION_ERROR", { field: label });
  });
}