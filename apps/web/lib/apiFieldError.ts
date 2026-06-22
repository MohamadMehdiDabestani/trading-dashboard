import { ApiError } from "@/lib/apiError";

type FormLike = {
  setFieldMeta: (field: any, updater: (prev: any) => any) => void;
};

export function applyApiFieldErrors(
  error: unknown,
  form: FormLike,
  options?: {
    mapField?: (apiField: string) => string | null;
  },
) {
  if (!(error instanceof ApiError)) return;
  if (!error.fields) return;
  Object.entries(error.fields).forEach(([apiField, fieldError]) => {
    const formField = options?.mapField ? options.mapField(apiField) : apiField;

    if (!formField) return;
    form.setFieldMeta(formField as any, (prev: any) => ({
      ...prev,
      errors: [fieldError.key],
      errorMap: {
        ...(prev?.errorMap ?? {}),
        onSubmit: fieldError.key,
      },
    }));
  });
}
export function getFormErrorMessage(
  errors: unknown,
  t: (key: string, params?: Record<string, any>) => string,
  fieldName: string,
): string[] {
  if (!errors || (Array.isArray(errors) && errors.length === 0)) {
    return [];
  }

  const errorArray = Array.isArray(errors) ? errors : [errors];
  const fieldLabel = t(`fields.${fieldName}`);

  return errorArray.map((error) => {
    let validationKey: string;

    // zod
    if (typeof error === "object" && error !== null && "message" in error) {
      const zodError = error as { message: string };
      console.log("zod" , zodError)
      validationKey = zodError.message;
    }
    // api
    else if (typeof error === "object" && error !== null && "key" in error) {
      console.log("api")
      const apiError = error as { key: string; params?: Record<string, any> };
      return t(`validation.${apiError.key}`, {
        field: fieldLabel,
        ...apiError.params,
      });
    }
    // String
    else if (typeof error === "string") {
      validationKey = error;
    } else {
      validationKey = "VALIDATION_ERROR";
    }
    return t(`validation.${validationKey}`, { field: fieldLabel });
  });
}
