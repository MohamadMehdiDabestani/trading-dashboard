"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { useFormContext } from "./formContext";

type Props = { label: string } & Omit<ComponentProps<typeof Button>, "type" | "children">;

/** دکمهٔ submit واقعی؛ با attribute `form="id"` می‌تواند بیرون از <form> (مثلاً footer) باشد */
export function SubmitButton({ label, disabled, ...props }: Props) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(s) => s.isSubmitting}>
      {(isSubmitting) => (
        <Button {...props} type="submit" disabled={disabled || isSubmitting}>
          {label}
        </Button>
      )}
    </form.Subscribe>
  );
}