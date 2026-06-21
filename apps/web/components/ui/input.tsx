import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// ۱. تعریف و مدیریت Variantها با استفاده از cva
const inputVariants = cva(
  "w-full min-w-0 rounded-md border bg-transparent transition-[color,box-shadow] outline-none shadow-xs file:inline-flex file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm",
  {
    variants: {
      variant: {
        default: "border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        filled: "border-transparent bg-muted focus-visible:bg-transparent focus-visible:border-ring focus-visible:ring-ring/50",
        underline: "border-x-0 border-t-0 border-b border-input rounded-none px-0 focus-visible:border-ring focus-visible:ring-0 shadow-none",
        error: "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive",
      },
      inputSize: {
        /* ✅ ps/pe (logical) به جای px (physical) */
        sm: "h-8 ps-2 pe-2 py-1 text-xs file:h-6 file:text-xs",
        default: "h-9 ps-2.5 pe-2.5 py-1 text-base file:h-7 file:text-sm",
        lg: "h-10 ps-3.5 pe-3.5 py-2 text-lg file:h-8 file:text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)


// ۲. ترکیب تایپ‌های بومی input با تایپ‌های Variantها
export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {}

function Input({ className, type, variant, inputSize, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, inputSize, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }