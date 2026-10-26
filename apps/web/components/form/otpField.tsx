"use client";

import dynamic from "next/dynamic";
import { useSelector } from "@tanstack/react-store";
import { Field, FieldError } from "@/components/ui/field";
import { useFormErrorTranslator } from "@/hooks/useFormErrorTranslator";
import { useFieldContext } from "./formContext";

const OtpInput = dynamic(() => import("@/components/ui/otp"), { ssr: false });

type Props = {
  length?: number;
  /** با پر شدن همهٔ خانه‌ها خودکار submit شود */
  autoSubmit?: boolean;
  ariaLabel?: string;
};

export function OtpField({ length = 6, autoSubmit = true, ariaLabel }: Props) {
  // فقط useFieldContext: فرم از طریق خود field در دسترس است (field.form)
  const field = useFieldContext<string>();
  const translate = useFormErrorTranslator();
  const isSubmitting = useSelector(field.form.store, (s) => s.isSubmitting);

  const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const messages = invalid ? translate(field.state.meta.errors, field.name) : [];

  return (
    <div
      className="min-h-12 flex flex-col items-center justify-center gap-2"
      dir="ltr"
    >
      <Field data-invalid={invalid}>
        <OtpInput
          length={length}
          value={field.state.value}
          onChange={(code: string) => field.handleChange(code)}
          onComplete={autoSubmit ? () => field.form.handleSubmit() : undefined}
          onBlur={field.handleBlur}
          disabled={isSubmitting}
          error={invalid}
          aria-label={ariaLabel}
        />
        {messages.length > 0 && (
          <FieldError errors={messages.map((message) => ({ message }))} />
        )}
      </Field>
    </div>
  );
}