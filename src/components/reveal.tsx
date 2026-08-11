"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-reveal wrapper: fades + rises its children once they enter the
 * viewport. Uses IntersectionObserver (no scroll listeners, no GSAP) and the
 * CSS `.reveal` / `.is-visible` transition in globals.css, which collapses to
 * a static frame under `prefers-reduced-motion`.
 *
 * With `stagger`, the wrapper's direct children rise in sequence (30–80ms
 * apart) via the CSS `[data-stagger]` rules — the observer still only toggles
 * the one class, so the stagger stays pure CSS.
 */
export function Reveal({
  children,
  delay = 0,
  stagger = false,
  className,
}: {
  children: ReactNode;
  /** Stagger delay in ms before the transition starts once visible. */
  delay?: number;
  /** Stagger direct children 60ms apart as the section reveals. */
  stagger?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // No observer support - show content immediately. Synchronous setState
      // here is intentional and runs once per mount, mirroring splash-overlay.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reveal once on mount when IO is unavailable
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -48px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-stagger={stagger || undefined}
      className={cn("reveal", visible && "is-visible", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
