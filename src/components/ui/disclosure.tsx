"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Disclosure — accessible expand/collapse section.
 *
 * Adapted from the Watermelon UI registry `accordion` pattern, but built on a
 * native button + region (no @radix-ui/react-accordion dependency, matching
 * the project's minimal-dependency philosophy). Keyboard support (Enter /
 * Space / arrow keys) and aria-expanded wiring come for free from the native
 * button; the region uses aria-labelledby for screen readers.
 */

interface DisclosureProps {
  title: string;
  /** Optional lucide icon rendered inline with the title. */
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  /** Accessible label for the toggle button, e.g. "Show possible causes". */
  buttonLabel?: string;
  badge?: ReactNode;
}

export function Disclosure({
  title,
  icon,
  defaultOpen = false,
  children,
  className,
  buttonLabel,
  badge,
}: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const titleId = useId();
  const regionId = useId();

  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900",
        className
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        aria-label={buttonLabel}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-800/50 focus-visible:outline-2 focus-visible:outline-amber-500"
      >
        <span id={titleId} className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          {icon}
          <span>{title}</span>
          {badge}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      <div
        id={regionId}
        role="region"
        aria-labelledby={titleId}
        hidden={!open}
        className={cn(
          "border-t border-zinc-800 px-4 py-4 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
      >
        {children}
      </div>
    </section>
  );
}
