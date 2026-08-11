/* Garage Ghost service worker v3 — PWA shell + offline fallback.
 *
 * Strategy:
 * - Precache the app shell (main routes, icons, manifest, offline page) at install.
 * - Cache-first for versioned static assets (/_next/static/, /icons/, manifest).
 * - Network-first for navigations; when offline, serve the cached copy of the
 *   page, falling back to /offline.html for any route not yet visited.
 * - Versioned cache name so old caches are cleaned automatically on activate.
 */
const CACHE = "garage-ghost-v3";
const STATIC_PREFIXES = ["/_next/static/", "/icons/", "/manifest.webmanifest"];

/* Routes precached at install so the app opens offline after first visit. */
const PRECACHE_URLS = [
  "/",
  "/diagnose",
  "/history",
  "/pricing",
  "/legal/privacy",
  "/legal/terms",
  "/legal/refunds",
  "/legal/contact",
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {
        /* Some shell routes may 404 in odd deployments — precaching is
         * best-effort; the network-first fallback still covers them. */
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        // Prefix-based cleanup: drop every cache this app has ever created
        // except the current version, so future cache versions self-clean.
        Promise.all(
          keys
            .filter((key) => key.startsWith("garage-ghost-") && key !== CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  const isStatic = STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
  const isNavigation = request.mode === "navigate";

  // Cache-first for versioned static assets (JS/CSS chunks, icons, manifest)
  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for pages; offline → cached copy → /offline.html
  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline.html"))
            .then((fallback) => fallback || caches.match("/"))
        )
    );
    return;
  }

  // Same-origin non-navigation, non-static (e.g. API-ish fetches): network with
  // cache fallback, no write-back to keep the cache predictable.
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
