import { cn } from "@/lib/cn";

export const Pulse = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded bg-muted", className)} />
);