"use client";

import type { ComponentProps, ReactNode } from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useFormErrorTranslator } from "@/hooks/useFormErrorTranslator";
import { useFieldContext } from "./formContext";

type Props = {
  label: string;
  normalize?: (v: string) => string;
  hint?: ReactNode;
} & Omit<ComponentProps<typeof Input>, "value" | "onChange" | "onBlur" | "id" | "name">;

export function TextField({ label, normalize, hint, ...props }: Props) {
  const field = useFieldContext<string>();
  const translate = useFormErrorTranslator();

  const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const errorId = `${field.name}-error`;
  const messages = invalid ? translate(field.state.meta.errors, field.name) : [];

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        {...props}
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) =>
          field.handleChange(normalize ? normalize(e.target.value) : e.target.value)
        }
        onBlur={field.handleBlur}
        variant={invalid ? "error" : "default"}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
      />
      {hint}
      {messages.length > 0 && (
        <FieldError id={errorId} errors={messages.map((message) => ({ message }))} />
      )}
    </Field>
  );
}