import { ApiError } from "../apiError";
import { toFormError, type FormErrorMsg } from "./formError";

type FormLike = {
  setFieldMeta: (field: any, updater: (prev: any) => any) => void;
};

/**
 * یک خطا را مستقیم روی یک فیلد می‌نشاند (مثلاً «کد اشتباه است» از پاسخ سرور).
 * در همان slot مربوط به onDynamic می‌نشیند؛ پس با اولین تغییر مقدار پاک می‌شود.
 * isTouched هم true می‌شود تا حتی بعد از پاک کردن مقدار، خطا دیده شود.
 */
export function setFieldError(form: FormLike, field: string, error: FormErrorMsg) {
  form.setFieldMeta(field, (prev: any) => ({
    ...prev,
    isTouched: true,
    errors: [error],
    errorMap: { ...(prev?.errorMap ?? {}), onDynamic: error },
  }));
}

/**
 * خطاهای فیلدی سرور ({ phone: {key, params} }) را روی فرم می‌نشاند.
 * خروجی true یعنی حداقل یک خطا روی فیلد نشست.
 */
export function applyApiFieldErrors(
  error: unknown,
  form: FormLike,
  options?: { mapField?: (apiField: string) => string | null },
): boolean {
  if (!(error instanceof ApiError) || !error.fields) return false;
  let applied = false;

  for (const [apiField, raw] of Object.entries(error.fields)) {
    const formField = options?.mapField ? options.mapField(apiField) : apiField;
    const fieldError = toFormError(raw);
    if (!formField || !fieldError) continue;
    applied = true;
    setFieldError(form, formField, fieldError);
  }
  return applied;
}