import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Badge — adapted from the Watermelon UI registry `badge` base, but with the
 * `class-variance-authority` + `@radix-ui/react-slot` dependencies removed:
 * variants are a plain record and only the project's existing deps are used.
 */

type BadgeVariant = "default" | "secondary" | "outline" | "destructive" | "brand" | "success";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  title?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "border-transparent bg-zinc-800 text-zinc-200",
  secondary: "border-transparent bg-zinc-700/60 text-zinc-300",
  outline: "border-zinc-600 text-zinc-300",
  destructive:
    "border-transparent bg-red-500/15 text-red-600 ring-1 ring-inset ring-red-500/40 dark:text-red-300",
  brand: "border-transparent bg-brand text-white dark:bg-blue-600",
  success:
    "border-transparent bg-emerald-500/15 text-emerald-600 ring-1 ring-inset ring-emerald-500/40 dark:text-emerald-300",
};

export function Badge({ children, variant = "default", className, title }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      title={title}
      className={cn(
        "inline-flex w-fit items-center justify-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium [&>svg]:size-3 [&>svg]:shrink-0",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
