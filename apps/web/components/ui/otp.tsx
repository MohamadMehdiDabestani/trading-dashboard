"use client";

import { cn } from "@/lib/cn";
import {
  type ClipboardEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type OtpInputSize = "sm" | "md" | "lg";

export interface OtpInputProps {
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  alphanumeric?: boolean;
  error?: boolean | string;
  size?: OtpInputSize;
  mask?: boolean;
  name?: string;
  className?: string;
  inputClassName?: string;
  "aria-label"?: string;
  onBlur?: () => void;
}

const SIZE_CLASSES: Record<OtpInputSize, string> = {
  sm: "h-10 w-10 text-base",
  md: "h-12 w-12 text-lg",
  lg: "h-14 w-14 text-xl",
};

const PATTERN = {
  numeric: /\D/g,
  alphanumeric: /[^a-zA-Z0-9]/g,
};

const sanitize = (raw: string, alphanumeric: boolean, length: number) =>
  raw
    .replace(alphanumeric ? PATTERN.alphanumeric : PATTERN.numeric, "")
    .slice(0, length);

export default function OtpInput({
  length = 6,
  value,
  defaultValue = "",
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  alphanumeric = false,
  error = false,
  size = "md",
  mask = false,
  name,
  onBlur,
  className,
  inputClassName,
  "aria-label": ariaLabel = "One-time password",
}: OtpInputProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(() =>
    sanitize(defaultValue, alphanumeric, length),
  );
  const currentValue = isControlled
    ? sanitize(value, alphanumeric, length)
    : internal;

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const lastCompletedRef = useRef<string | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);

  const chars = useMemo(
    () => Array.from({ length }, (_, i) => currentValue[i] ?? ""),
    [currentValue, length],
  );

  useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = (next: string[], focusIndex?: number) => {
    const joined = next.join("").slice(0, length);
    if (!isControlled) setInternal(joined);
    onChange?.(joined);

    if (joined.length === length) {
      if (lastCompletedRef.current !== joined) {
        lastCompletedRef.current = joined;
        onComplete?.(joined);
      }
    } else {
      lastCompletedRef.current = null;
    }

    if (focusIndex !== undefined) inputsRef.current[focusIndex]?.focus();
  };

  const handleChange = (index: number, raw: string) => {
    const pattern = alphanumeric ? PATTERN.alphanumeric : PATTERN.numeric;
    const cleaned = raw.replace(pattern, "");
    if (raw && !cleaned) return; // کاراکتر غیرمجاز

    const digit = cleaned.slice(-1);
    const next = [...chars];
    next[index] = digit;
    commit(next, digit && index < length - 1 ? index + 1 : undefined);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...chars];
      if (next[index]) {
        next[index] = "";
        commit(next);
      } else if (index > 0) {
        next[index - 1] = "";
        commit(next, index - 1);
      }
      return;
    }

    if (e.key === "Delete") {
      e.preventDefault();
      const next = [...chars];
      next[index] = "";
      commit(next);
      return;
    }

    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
    if (disabled) return;
    e.preventDefault();

    const pattern = alphanumeric ? PATTERN.alphanumeric : PATTERN.numeric;
    const pasted = e.clipboardData.getData("text").replace(pattern, "");
    if (!pasted) return;

    const slice = pasted.slice(0, length - index).split("");
    const next = [...chars];
    slice.forEach((c, i) => {
      next[index + i] = c;
    });

    const focusIndex = Math.min(index + slice.length, length - 1);
    commit(next, focusIndex);
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const next = e.relatedTarget as Node | null;
    if (groupRef.current?.contains(next)) return;
    onBlur?.();
  };
  const hasError = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        role="group"
        ref={groupRef}
        dir='ltr'
        aria-label={ariaLabel}
        className="animate-in fade-in zoom-in-95 flex justify-center gap-3 duration-300"
      >
        {chars.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type={mask ? "password" : "text"}
            inputMode={alphanumeric ? "text" : "numeric"}
            autoComplete="one-time-code"
            pattern={alphanumeric ? "[a-zA-Z0-9]*" : "[0-9]*"}
            maxLength={1}
            value={digit}
            disabled={disabled}
            aria-label={`${ariaLabel}, digit ${index + 1} of ${length}`}
            aria-invalid={hasError || undefined}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={(e) => handlePaste(e, index)}
            onFocus={(e) => e.target.select()}
            onBlur={handleBlur}
            className={cn(
              SIZE_CLASSES[size],
              "rounded-md border bg-background text-center font-medium transition-all duration-200",
              "focus:scale-110 focus:outline-none focus:ring-2 focus:ring-primary",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:focus:scale-100",
              hasError &&
                "border-destructive text-destructive focus:ring-destructive",
              inputClassName,
            )}
          />
        ))}
      </div>

      {typeof error === "string" && error.length > 0 && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      {name && <input type="hidden" name={name} value={currentValue} />}
    </div>
  );
}
