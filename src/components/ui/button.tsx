import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Button — single source of truth for button styles in the app (was
 * previously duplicated as inline Tailwind strings across ~7 files).
 * Variants follow the automotive command-center system: amber primary,
 * zinc outline, ghost, red danger, emerald success.
 */

export type ButtonVariant = "primary" | "outline" | "ghost" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg" | "full";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-amber-500 text-zinc-950 hover:bg-amber-400",
  outline:
    "border border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:text-white",
  ghost: "text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100",
  danger:
    "border border-red-500/40 text-red-300 hover:border-red-400/60 hover:bg-red-500/10",
  success: "bg-emerald-500 text-zinc-950 hover:bg-emerald-400",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
  md: "gap-2 rounded-md px-4 py-2.5 text-sm font-semibold",
  lg: "gap-2 rounded-md px-6 py-3 text-sm font-semibold",
  full:
    "w-full items-center justify-center gap-2 rounded-md px-6 py-3.5 text-base font-semibold",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center rounded-md transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]";

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/**
 * Shared class builder so styled <Link>/<a> CTAs match the <Button> exactly
 * (avoiding a second copy of the same Tailwind strings).
 */
export function buttonClassNames({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleOptions = {}): string {
  return cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className);
}

interface ButtonProps extends ComponentPropsWithRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassNames({ variant, size, className })}
      {...props}
    />
  );
}
