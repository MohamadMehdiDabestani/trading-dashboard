"use client";

import { cn } from "@/lib/cn";
import { useEffect, useRef, useState } from "react";

const OTP_LENGTH = 6;

interface OtpInputProps {
  onComplete?: (code: string) => void;
  className?: string;
}

export default function OtpInput({ onComplete, className }: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const triggerComplete = (values: string[]) => {
    const code = values.join("");
    if (code.length === OTP_LENGTH && !values.includes("")) {
      onComplete?.(code);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const value = e.target.value;

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    triggerComplete(newOtp);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
        return;
      }

      if (index > 0) {
        inputsRef.current[index - 1]?.focus();

        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    e.preventDefault();

    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;

    const newOtp = [...otp];
    const chars = pasted.slice(0, OTP_LENGTH - index).split("");

    chars.forEach((char, offset) => {
      newOtp[index + offset] = char;
    });

    setOtp(newOtp);

    const nextIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
    inputsRef.current[nextIndex]?.focus();

    triggerComplete(newOtp);
  };

  return (
    <div
      dir="ltr"
      className={cn(
        "animate-in fade-in zoom-in-95 flex justify-center gap-3 duration-300",
        className,
      )}
    >
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={(e) => handlePaste(e, index)}
          className="h-12 w-12 rounded-md border text-center text-lg font-medium transition-all duration-200 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      ))}
    </div>
  );
}
