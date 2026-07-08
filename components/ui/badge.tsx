import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export type BadgeVariant =
  | "brand"
  | "neutral"
  | "success"
  | "warning"
  | "muted"
  | "danger";

const base =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium";

const variants: Record<BadgeVariant, string> = {
  brand: "bg-brand/15 text-brand-strong dark:text-brand",
  neutral:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  muted: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

/**
 * Maps a slab lifecycle status to a badge variant so status pills look the same
 * everywhere (inventory table, slab detail, admin, etc.).
 */
export const slabStatusVariant: Record<string, BadgeVariant> = {
  available: "success",
  reserved: "warning",
  sold: "neutral",
  hidden: "muted",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  variant = "neutral",
  className,
  ...props
}: BadgeProps) {
  return <span className={cn(base, variants[variant], className)} {...props} />;
}
