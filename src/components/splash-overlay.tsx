"use client";

import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

/**
 * In-app launch splash. Shown only when Garage Ghost is opened as an
 * installed PWA (display-mode: standalone) — regular browser visits skip it.
 * It fades out after the first paint so the handoff from the OS splash
 * (manifest / apple-touch-startup-image) feels seamless. Respects
 * prefers-reduced-motion by showing a static frame for less time.
 */
export function SplashOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only run in standalone (installed) mode — iOS and Chromium.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- navigator.standalone is Safari-only
      (window.navigator as any).standalone === true;
    if (!standalone) return;

    // One splash per cold launch (sessionStorage resets when the app restarts).
    let shown = false;
    try {
      shown = sessionStorage.getItem("garage-ghost:splash") === "1";
      if (!shown) sessionStorage.setItem("garage-ghost:splash", "1");
    } catch {
      /* storage unavailable — still show the splash */
    }
    if (shown) return;

    // Reading external launch mode + session state once on mount is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- splash shows once per cold standalone launch
    setVisible(true);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Fade out after first paint; a touch longer when motion is allowed.
    const timer = setTimeout(() => setVisible(false), reduced ? 450 : 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-zinc-950 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10">
        <Wrench className="h-8 w-8 text-amber-400" strokeWidth={2} />
      </div>
      <p className="font-display mt-5 text-lg font-bold tracking-tight text-zinc-50">
        {APP_NAME}
      </p>
      <p className="mt-1.5 max-w-[16rem] text-center text-xs text-zinc-500">{APP_TAGLINE}</p>
      <span className="mt-6 h-1 w-24 overflow-hidden rounded-full bg-zinc-800">
        <span className="skeleton block h-full w-full" />
      </span>
    </div>
  );
}
