"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Warms the JS chunks for the main routes so the service worker caches them,
 * even when the corresponding nav links are hidden inside the mobile drawer.
 *
 * Next.js only prefetches `<Link>` targets that are in the viewport, so at
 * phone widths `/history` and `/faq` are never prefetched — their chunks only
 * load on first visit to the route. With this prefetcher running in the root
 * layout, the chunks are fetched right after load (and again once the service
 * worker is controlling the page), so those routes hydrate fully offline
 * without the user ever having opened them.
 */
const ROUTES_TO_PREFETCH = ["/diagnose", "/vin", "/history", "/faq"] as const;

export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    const prefetchRoutes = () => {
      for (const route of ROUTES_TO_PREFETCH) {
        try {
          router.prefetch(route);
        } catch {
          // Prefetching is best-effort; a failure must never break the app.
        }
      }
    };

    prefetchRoutes();
    // Retry once the service worker is ready in case the first round fired
    // before hydration/registration completed. Next dedupes prefetches, so
    // this is a cheap no-op when the first round already ran.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => prefetchRoutes()).catch(() => undefined);
    }
  }, [router]);

  return null;
}
