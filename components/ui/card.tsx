import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const base =
  "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds default inner padding. Set to false when the card wraps its own layout. */
  padded?: boolean;
}

/**
 * The standard surface used across the app (dashboard stats, panels, empty
 * states). Keeps radius, border and background consistent in light/dark.
 */
export function Card({
  padded = false,
  className,
  ...props
}: CardProps) {
  return (
    <div className={cn(base, padded && "p-5", className)} {...props} />
  );
}
