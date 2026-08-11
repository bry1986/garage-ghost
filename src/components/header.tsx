"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, CheckCircle2, Crown, Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { usePro } from "@/components/pro-provider";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/diagnose", label: "Diagnose" },
  { href: "/vin", label: "VIN decoder" },
  { href: "/history", label: "History" },
  { href: "/pricing", label: "Pricing" },
];

export function Header() {
  const pathname = usePathname();
  const { isPro, licenseStatus, validating, openModal } = usePro();
  const licenseExpired = !isPro && licenseStatus === "expired";
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer on route change and lock scroll while open.
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setDrawerOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [drawerOpen]);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerWasOpen = useRef(false);

  // Move focus into the drawer when it opens and restore it to the trigger on
  // close, so keyboard/screen-reader users stay oriented. Guarded against the
  // initial mount (the menu button must not steal focus on page load).
  useEffect(() => {
    if (drawerOpen && !drawerWasOpen.current) {
      drawerWasOpen.current = true;
      closeButtonRef.current?.focus();
    } else if (!drawerOpen && drawerWasOpen.current) {
      drawerWasOpen.current = false;
      menuButtonRef.current?.focus();
    }
  }, [drawerOpen]);

  // The landing page carries its own full-bleed hero with an integrated glass
  // nav — the global sticky header stays off it (hooks above are unconditional).
  if (pathname === "/") return null;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const proLabel = validating
    ? "Pro…"
    : isPro
      ? "Pro"
      : licenseExpired
        ? "Pro expired"
        : "Go Pro";

  const proTitle = validating
    ? "Checking license…"
    : isPro
      ? "Pro license active"
      : licenseExpired
        ? "Your Pro license has expired — click to renew"
        : "Upgrade to Pro";

  const proAria = isPro
    ? "Open Pro settings — license active"
    : licenseExpired
      ? "Renew Pro — license expired"
      : "Upgrade to Pro";

  const ProBadge = (
    <button
      type="button"
      onClick={openModal}
      title={proTitle}
      aria-label={proAria}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isPro
          ? "text-emerald-400 hover:bg-zinc-800/60"
          : licenseExpired
            ? "border border-red-500/40 bg-red-500/5 text-red-300 hover:border-red-400/60 hover:bg-red-500/10"
            : "border border-brand/40 bg-brand/10 text-brand hover:border-brand/60 hover:bg-brand/15"
      )}
    >
      {isPro ? (
        <CheckCircle2 className="h-4 w-4" aria-hidden />
      ) : licenseExpired ? (
        <AlertTriangle className="h-4 w-4" aria-hidden />
      ) : (
        <Crown className="h-4 w-4" aria-hidden />
      )}
      {proLabel}
      {isPro && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center rounded-md transition-opacity hover:opacity-80"
          aria-label={`${APP_NAME} home`}
        >
          <Logo />
        </Link>

        {/* Desktop nav */}
        <div className="flex items-center gap-2">
          <nav aria-label="Main navigation" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-zinc-800 text-brand"
                          : "text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
                      )}
                    >
                      {item.label}
                      {/* Active-route underline — scaleX affordance, gated to
                          fine pointers so touch never fires a false hover. */}
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-x-2.5 -bottom-px h-px origin-left scale-x-0 rounded-full bg-gradient-to-r from-brand via-brand/70 to-transparent transition-transform duration-200 ease-[var(--ease-out)]",
                          active && "scale-x-100"
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="hidden md:block">{ProBadge}</div>
          {/* Mobile: menu + compact Pro trigger */}
          <button
            ref={menuButtonRef}
            type="button"
            className="rounded-md p-2 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      {/* Brand-blue hairline — a soft product light across the bottom edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand/25 to-transparent"
      />

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            tabIndex={-1}
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="drawer-in absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4">
              <span className="font-display text-sm font-semibold text-zinc-100">Menu</span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <nav aria-label="Mobile navigation" className="flex flex-1 flex-col gap-1 p-3">
              <Link
                href="/"
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive("/")
                    ? "bg-zinc-800 text-brand"
                    : "text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
                )}
              >
                Home
              </Link>
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-zinc-800 text-brand"
                      : "text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-zinc-800 p-3">{ProBadge}</div>
          </div>
        </div>
      )}
    </header>
  );
}
