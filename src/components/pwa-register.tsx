"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker. Runs only in the browser, after load, and
 * is skipped in development so the service worker never caches dev assets.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") return;

    // Register as soon as the component hydrates. Do not wait for the `load`
    // event: for statically-served pages it can fire before hydration, which
    // would mean the listener never runs. updateViaCache: "none" ensures the
    // browser always re-fetches /sw.js so SW updates are never stuck in cache.
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });
  }, []);

  return null;
}
