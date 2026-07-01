"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // مسیر کامپوننت Tooltip خودتان

type SliderVariant = "primary" | "success" | "error" | "info";

const variantStyles: Record<SliderVariant, { range: string; thumb: string }> = {
  primary: { range: "bg-primary", thumb: "border-primary ring-ring/50" },
  success: {
    range: "bg-[var(--success)]",
    thumb: "border-[var(--success)] ring-[var(--success)]/50",
  },
  error: {
    range: "bg-destructive",
    thumb: "border-destructive ring-destructive/50",
  },
  info: {
    range: "bg-[var(--info)]",
    thumb: "border-[var(--info)] ring-[var(--info)]/50",
  },
};

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  variant = "primary",
  showTooltip = true,
  onValueChange,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  variant?: SliderVariant;
  showTooltip?: boolean;
}) {
  const [draggingIndex, setDraggingIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (value !== undefined) {
      setLiveValues(Array.isArray(value) ? value : [value]);
    }
  }, [value]);

  const [liveValues, setLiveValues] = React.useState<number[]>(
    value ?? defaultValue ?? [min],
  );

  const handleValueChange = (vals: number[]) => {
    setLiveValues(vals);
    onValueChange?.(vals);
  };

  const { range, thumb } = variantStyles[variant];

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      value={liveValues}
      min={min}
      max={max}
      onValueChange={handleValueChange}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full bg-muted data-horizontal:h-1.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-1.5"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute select-none data-horizontal:h-full data-vertical:w-full",
            range,
          )}
        />
      </SliderPrimitive.Track>

      {liveValues.map((val, index) => {
        return showTooltip ? (
          <Tooltip key={index} open={draggingIndex === index}>
            <TooltipTrigger asChild>
              <SliderPrimitive.Thumb
                onPointerDown={() => setDraggingIndex(index)}
                onPointerUp={() => setDraggingIndex(null)}
                onPointerCancel={() => setDraggingIndex(null)}
                className={cn(
                  "block size-4 shrink-0 rounded-full border bg-white shadow-sm transition-[color,box-shadow] select-none hover:ring-4 focus-visible:ring-4 focus-visible:outline-none",
                  thumb,
                )}
              />
            </TooltipTrigger>

            <TooltipContent side="top" sideOffset={8}>
              {val}
            </TooltipContent>
          </Tooltip>
        ) : (
          <SliderPrimitive.Thumb
            className={cn(
              "block size-4 shrink-0 rounded-full border bg-white shadow-sm transition-[color,box-shadow] select-none hover:ring-4 focus-visible:ring-4 focus-visible:outline-none",
              thumb,
            )}
          />
        );
      })}
    </SliderPrimitive.Root>
  );
}

export { Slider };
