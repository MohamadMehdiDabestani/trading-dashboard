"use client";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const OTP_LENGTH = 6;

interface OtpInputProps {
  onComplete?: (code: string) => void;
  className?: string;
}

export default function OtpInput({ onComplete, className }: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(
    new Array(OTP_LENGTH).fill(""),
  );

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

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

    const code = newOtp.join("");

    if (code.length === OTP_LENGTH && !newOtp.includes("")) {
      onComplete?.(code);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div
      dir="ltr"
      className={cn(
        "flex justify-center gap-3 animate-in fade-in zoom-in-95 duration-300",
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
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="h-12 w-12 rounded-md border text-center text-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:scale-110"
        />
      ))}
    </div>
  );
}
