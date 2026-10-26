import { revalidateLogic } from "@tanstack/react-form";
import type { ZodType } from "zod";
import { zodField } from "@/lib/validation/tanstackValidation";

export const validationLogic = revalidateLogic({
  mode: "blur",
  modeAfterSubmission: "change",
});

// فقط در development کار می‌کند؛ در production هرگز غیرفعال نمی‌شود
const CLIENT_VALIDATION_OFF =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DISABLE_CLIENT_VALIDATION === "true";

export const fieldValidators = <T,>(schema: ZodType<T>) =>
  CLIENT_VALIDATION_OFF ? {} : { onDynamic: zodField(schema) };