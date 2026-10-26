import { createFormHook } from "@tanstack/react-form";
import {
  fieldContext,
  formContext,
} from "./formContext";
import { TextField } from "./textField";
import { OtpField } from "./otpField";
import { SubmitButton } from "./submitButton";

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, OtpField },
  formComponents: { SubmitButton },
});