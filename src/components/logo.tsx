import { useId } from "react";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg" | "xl";
type LogoTone = "default" | "hero";

interface LogoProps {
  /** Mark + wordmark scale. */
  size?: LogoSize;
  /** "hero" renders white text for use over the hero image. */
  tone?: LogoTone;
  className?: string;
}

const SIZE_STYLES: Record<LogoSize, { mark: string; wordmark: string; subtext: string }> = {
  sm: { mark: "h-8 w-8", wordmark: "text-sm", subtext: "text-[9px]" },
  md: { mark: "h-9 w-9", wordmark: "text-base", subtext: "text-[9px]" },
  lg: { mark: "h-11 w-11", wordmark: "text-xl", subtext: "text-[10px]" },
  xl: { mark: "h-16 w-16", wordmark: "text-3xl", subtext: "text-xs" },
};

/**
 * The Garage Ghost brand mark — a double-G monogram. The back "echo" G is a
 * translucent ghost of the front G: the "double G" the name's initials spell.
 *
 * Entrance (showstopper, one-shot): the echo fades in, the front G stroke-draws
 * itself, a glow bursts then settles to a soft aura, and a light band shimmers
 * across — then everything settles static. Reduced-motion users get the static
 * logo (base styles are the final state). Hover is gated to fine pointers.
 */
export function Logo({ size = "md", tone = "default", className }: LogoProps) {
  const styles = SIZE_STYLES[size];
  const wordmarkClass = tone === "hero" ? "text-white" : "text-zinc-100";
  const subtextClass = tone === "hero" ? "text-white/60" : "text-zinc-500";

  // Scope the SVG gradient ids per instance — multiple Logos share a page
  // (header + footer, plus the hero on the landing), and url(#id) resolves
  // to the first matching def, so ids must be unique. useId works in server
  // and client components alike; colons are stripped for safe url(#) refs.
  const uid = useId().replace(/:/g, "");
  const frontGradId = `gg-front-grad-${uid}`;
  const echoGradId = `gg-echo-grad-${uid}`;

  return (
    <span className={cn("gg-logo inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "gg-mark relative inline-flex shrink-0 items-center justify-center rounded-xl border border-amber-400/50 bg-amber-500/10 shadow-[0_0_16px_rgba(245,158,11,0.22)]",
          styles.mark
        )}
      >
        {/* Soft aura — flashes on entrance, then stays as a faint glow */}
        <span
          aria-hidden
          className="gg-glow pointer-events-none absolute -inset-1.5 rounded-2xl bg-[radial-gradient(circle,rgba(251,191,36,0.5),transparent_65%)] blur-[6px]"
        />
        <svg viewBox="0 0 48 48" fill="none" className="relative h-[62%] w-[62%]" aria-hidden>
          <defs>
            <linearGradient
              id={frontGradId}
              x1="0"
              y1="0"
              x2="48"
              y2="48"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#fcd34d" />
              <stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient
              id={echoGradId}
              x1="0"
              y1="0"
              x2="48"
              y2="48"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="rgb(161 161 170 / 0.85)" />
              <stop offset="1" stopColor="rgb(113 113 122 / 0.55)" />
            </linearGradient>
          </defs>
          {/* Ghost echo G — the double in GG */}
          <path
            className="gg-g-echo"
            d="M24 14 A12 12 0 1 0 36 26 L22 26"
            transform="translate(-4 -3)"
            stroke={`url(#${echoGradId})`}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Front G — stroke-drawn on entrance */}
          <path
            className="gg-g-front"
            d="M24 14 A12 12 0 1 0 36 26 L22 26"
            stroke={`url(#${frontGradId})`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Shimmer band — one sweep across the badge, then gone */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
        >
          <span className="gg-shimmer-band absolute -inset-y-8 left-0 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </span>
      </span>

      <span className="flex flex-col items-start leading-none">
        <span
          className={cn(
            "gg-wordmark font-display font-extrabold tracking-tight",
            styles.wordmark,
            wordmarkClass
          )}
        >
          GG
        </span>
        <span
          className={cn(
            "gg-subtext mt-1 font-medium uppercase tracking-[0.16em]",
            styles.subtext,
            subtextClass
          )}
        >
          Garage Ghost
        </span>
      </span>
    </span>
  );
}
