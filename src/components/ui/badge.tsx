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
  default: "border-transparent bg-zinc-200 text-zinc-900",
  secondary: "border-transparent bg-zinc-800 text-zinc-200",
  outline: "border-zinc-700 text-zinc-300",
  destructive: "border-transparent bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/40",
  brand: "border-transparent bg-amber-500 text-zinc-950",
  success: "border-transparent bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/40",
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
