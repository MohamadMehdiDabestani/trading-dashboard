import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  "group/button relative cursor-pointer inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "",
        outline: "bg-background",
        secondary: "",
        ghost: "",
        link: "underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-10 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xl: "h-12 gap-2 rounded-[min(var(--radius-md),12px)] px-5 text-base in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-9",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),8px)] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-10",
        "icon-xl": 
          "size-12 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-5",
      },
      color: {
        primary: "",
        secondary: "",
        destructive: "",
      },
    },
    compoundVariants: [
      // primary
      {
        variant: "default",
        color: "primary",
        className: "bg-primary text-primary-foreground hover:bg-primary/90",
      },
      {
        variant: "outline",
        color: "primary",
        className: "border-primary text-primary hover:bg-primary/10",
      },
      {
        variant: "secondary",
        color: "primary",
        className: "bg-primary/15 text-primary hover:bg-primary/20",
      },
      {
        variant: "ghost",
        color: "primary",
        className: "text-primary hover:bg-primary/10",
      },
      {
        variant: "link",
        color: "primary",
        className: "text-primary",
      },

      // secondary
      {
        variant: "default",
        color: "secondary",
        className:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      {
        variant: "outline",
        color: "secondary",
        className:
          "border-secondary text-secondary-foreground hover:bg-secondary/80/10",
      },
      {
        variant: "secondary",
        color: "secondary",
        className:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      {
        variant: "ghost",
        color: "secondary",
        className:
          "text-secondary-foreground hover:bg-secondary/80/30",
      },
      {
        variant: "link",
        color: "secondary",
        className: "text-secondary-foreground",
      },

      // destructive
      {
        variant: "default",
        color: "destructive",
        className:
          "bg-destructive text-white hover:bg-destructive/90",
      },
      {
        variant: "outline",
        color: "destructive",
        className:
          "border-destructive text-destructive hover:bg-destructive/10",
      },
      {
        variant: "secondary",
        color: "destructive",
        className:
          "bg-destructive/15 text-destructive hover:bg-destructive/20",
      },
      {
        variant: "ghost",
        color: "destructive",
        className:
          "text-destructive hover:bg-destructive/10",
      },
      {
        variant: "link",
        color: "destructive",
        className: "text-destructive",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      color: "primary",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

function Button({
  className,
  variant = "default",
  size = "default",
  color = "primary",
  asChild = false,
  loading = false,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-color={color}
      aria-busy={loading}
      className={cn(buttonVariants({ variant, size, color }), className)}
      {...props}
    >
      {loading && <Spinner className="absolute" />}

      <span
        className={cn(
          "inline-flex items-center gap-1.5",
          loading && "opacity-0",
        )}
      >
        {children}
      </span>
    </Comp>
  );
}

export { Button, buttonVariants };
