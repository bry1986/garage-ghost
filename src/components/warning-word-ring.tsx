"use client";

import { useEffect, useRef } from "react";

/** Dashboard-readout words printed on the hero's orbiting bezel ring. */
const RING_WORDS = ["CHECK", "SERVICE", "SAFE", "READY", "TRIP", "INFO"];

/**
 * Ambient word ring for the landing hero — a CSS 3D turntable of dashboard
 * words orbiting the instrument cluster. Purely decorative (aria-hidden).
 *
 * Motion discipline:
 * - One slow orbit (48s linear) — ambient depth, not a gimmick.
 * - Paused by IntersectionObserver whenever the hero scrolls out of view.
 * - Frozen to a static first word under prefers-reduced-motion (globals.css).
 * - transform/opacity only; no layout properties ever animate.
 */
export function WarningWordRing({ words = RING_WORDS }: { words?: string[] }) {
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ringRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      el.dataset.paused = entry.isIntersecting ? "false" : "true";
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const step = 360 / words.length;

  return (
    <div
      ref={ringRef}
      aria-hidden="true"
      data-paused="false"
      className="word-ring pointer-events-none absolute inset-0 select-none [--ring-r:10rem] md:[--ring-r:13rem]"
    >
      {/* The stage spins as a rigid body; each word is pinned to its own seat
          on the ring (rotateY → translateZ), so all motion comes from one
          transform — cheap, smooth, and retargets cleanly. */}
      <div className="word-ring-stage absolute left-1/2 top-1/2 h-0 w-0 [transform-style:preserve-3d]">
        {words.map((word, index) => (
          <span
            key={word}
            className="word-ring-word absolute left-0 top-0 whitespace-nowrap font-mono text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-500 md:text-xs"
            style={{
              transform: `translate(-50%, -50%) rotateY(${index * step}deg) translateZ(var(--ring-r))`,
            }}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}
