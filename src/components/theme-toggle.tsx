"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  /** "hero" style for a light text over image (currently unused, kept for parity). */
  tone?: "default" | "hero";
  className?: string;
}

export function ThemeToggle({ tone = "default", className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  // The icon state depends on the theme, which is only known on the client.
  // Until mounted, render the server-side default so React never sees a
  // hydration mismatch for dark-mode visitors.
  const [mounted, setMounted] = useState(false);
  // One-shot mount flag to align first client render with the SSR tree.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-shot hydration gate
  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        tone === "hero"
          ? "ring-1 ring-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
          : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200",
        className
      )}
    >
      {/* Both icons present, cross-fade via opacity — no layout shift on swap. */}
      <span className="relative h-5 w-5">
        <Sun
          aria-hidden
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-300",
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          )}
        />
        <Moon
          aria-hidden
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-300",
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          )}
        />
      </span>
    </button>
  );
}
