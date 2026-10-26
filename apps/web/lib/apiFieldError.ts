import { useTranslations } from "next-intl";
import { ApiError } from "./apiError";
import { firstRaw, parseMessage } from "./tanstackValidation";


type FormLike = {
  setFieldMeta: (field: any, updater: (prev: any) => any) => void;
};
type T = ReturnType<typeof useTranslations>;

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
  errors: unknown[],
  t: T,
  fallbackKey = "invalid",
): string[] {
  const raw = firstRaw(errors);
  if (!raw) return [];
  const parsed = parseMessage(raw);
  if (!parsed) return [];
  try {
    // @ts-expect-error
    return [t(parsed.key, parsed.params ?? {})];
  } catch {
    return [t(`common.validation.${fallbackKey}`)];
  }
}