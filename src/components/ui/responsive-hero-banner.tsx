"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CheckCircle2, Mail, Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { TranslateButton } from "@/components/translate-button";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  href: string;
}

/** The landing hero carries its own nav (the global sticky header stays off "/"). */
const NAV_LINKS: NavLink[] = [
  { href: "/diagnose", label: "Diagnose" },
  { href: "/vin", label: "VIN decoder" },
  { href: "/history", label: "History" },
  { href: "/faq", label: "FAQ" },
];

/** Well-known OBD-II codes — the landing marquee, an on-brand stand-in for a logo strip. */
const DTC_CHIPS = [
  { code: "P0420", label: "Catalyst efficiency" },
  { code: "P0300", label: "Random misfire" },
  { code: "P0171", label: "System too lean" },
  { code: "P0301", label: "Cylinder 1 misfire" },
  { code: "P0455", label: "EVAP system leak" },
  { code: "P0401", label: "EGR flow insufficient" },
  { code: "P0128", label: "Thermostat temp" },
  { code: "P0430", label: "Catalyst, bank 2" },
  { code: "P0133", label: "O2 sensor response" },
  { code: "P0507", label: "Idle air too high" },
];

/** Green-check trust row under the primary CTA. */
const TRUST_POINTS = [
  "No sign-up required",
  "Results in under 30 seconds",
  "No app download needed",
];

/**
 * Light-first hero for the landing page, matching the product reference:
 * a soft blue glow band, an integrated glass nav, a bold three-line
 * headline, the free-diagnosis info pill, a blue pill CTA, and a
 * green-check trust row. Everything is theme-token driven, so the dark
 * variant is the same layout with inverted surfaces.
 */
export function ResponsiveHeroBanner() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close the mobile menu on route change.
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setMobileMenuOpen(false);
    }
  }, [pathname]);

  // Scroll lock + Escape while the menu is open.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [mobileMenuOpen]);

  // Focus into the menu on open, restore to the trigger on close.
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (mobileMenuOpen && !wasOpen.current) {
      wasOpen.current = true;
      closeButtonRef.current?.focus();
    } else if (!mobileMenuOpen && wasOpen.current) {
      wasOpen.current = false;
      menuButtonRef.current?.focus();
    }
  }, [mobileMenuOpen]);

  const isActive = (href: string) => pathname === href;

  return (
    <section className="relative isolate overflow-hidden">
      {/* Blue glow vignette — mirrors the body's top light, strengthens it here */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_-5%,rgb(37_99_235/0.1),transparent_65%)] dark:bg-[radial-gradient(ellipse_75%_55%_at_50%_-5%,rgb(59_130_246/0.12),transparent_65%)]"
      />

      {/* Integrated glass nav */}
      <header className="relative z-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-3 sm:h-[4.5rem]">
            <Link
              href="/"
              aria-label={`${APP_NAME} home`}
              className="rounded-lg transition-opacity hover:opacity-85"
            >
              <Logo />
            </Link>

            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-1 rounded-full border border-zinc-200/80 bg-white/70 p-1 backdrop-blur md:flex dark:border-white/10 dark:bg-white/5"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-brand text-white"
                      : "text-zinc-500 hover:text-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle className="hidden md:inline-flex" />
              <TranslateButton variant="hero" />
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                className="glass-chip inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-zinc-200/60 md:hidden dark:hover:bg-white/10"
              >
                <Menu className="h-5 w-5 text-zinc-500 dark:text-white/90" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero copy — the reference layout: headline, sub, info pill, CTA, trust row */}
      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-14 pt-14 text-center sm:px-6 sm:pt-20">
        <h1 className="animate-fade-slide-in-1 font-display text-4xl font-bold leading-[1.06] tracking-tight text-zinc-50 sm:text-6xl lg:text-7xl dark:text-white">
          Diagnose Car
          <br />
          Problems with AI
          <br />
          Precision
        </h1>

        <p className="mx-auto mt-6 max-w-xl animate-fade-slide-in-2 text-base leading-relaxed text-zinc-400 sm:text-lg dark:text-zinc-400">
          Describe your car&apos;s symptoms, upload a photo of the warning light, or record the
          engine sound. Our AI mechanic gives you an instant diagnostic report with repair cost
          estimates — completely free.
        </p>

        {/* Info pill — envelope + free-diagnosis promise */}
        <div className="mt-8 inline-flex animate-fade-slide-in-3 items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
          <Mail className="h-4 w-4 shrink-0" aria-hidden />
          Free diagnosis — no email or credit card needed. Your report is instant.
        </div>

        <div className="mt-8 flex animate-fade-slide-in-4 flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/diagnose"
            className="group inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_28px_-10px_rgba(37,99,235,0.55)] transition-[background-color,box-shadow] duration-200 hover:bg-brand-strong dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            Start Free Diagnosis
            <Activity
              className="h-4 w-4 transition-transform duration-200 ease-out group-hover:scale-110"
              aria-hidden
            />
          </Link>
        </div>

        {/* Trust row — green checks, exactly as the reference */}
        <ul className="mt-9 flex animate-fade-slide-in-4 flex-wrap items-center justify-center gap-x-7 gap-y-3">
          {TRUST_POINTS.map((point) => (
            <li
              key={point}
              className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"
            >
              <CheckCircle2
                className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* Fault-code marquee — the landing's logo-strip stand-in */}
      <div className="relative z-10 pb-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Decodes the codes that matter most
          </p>
          <div className="marquee marquee-mask mt-6">
            {/* The duplicated half exists for the seamless loop — keep it out
                of the tab order and away from screen readers. */}
            <div className="marquee-track">
              {[...DTC_CHIPS, ...DTC_CHIPS].map((chip, index) => (
                <Link
                  key={`${chip.code}-${index}`}
                  href={`/diagnose?dtc=${chip.code}`}
                  aria-hidden={index >= DTC_CHIPS.length ? true : undefined}
                  tabIndex={index >= DTC_CHIPS.length ? -1 : undefined}
                  className="mr-3 inline-flex items-center gap-2.5 rounded-full border border-zinc-200/80 bg-white/80 px-4 py-2 text-sm text-zinc-500 transition-colors hover:border-brand/40 hover:text-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:text-white"
                >
                  <span className="font-mono text-xs font-semibold text-brand">{chip.code}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">{chip.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            tabIndex={-1}
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
          />
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="drawer-in absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-white/10">
              <span className="font-display text-sm font-semibold text-zinc-50 dark:text-white">
                Menu
              </span>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-zinc-100 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
            <nav aria-label="Mobile navigation" className="flex flex-1 flex-col gap-1 p-3">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive("/")
                    ? "bg-brand text-white"
                    : "text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                )}
              >
                Home
              </Link>
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-brand text-white"
                      : "text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-zinc-200 p-3 dark:border-white/10">
              <Link
                href="/diagnose"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                Start Free Diagnosis
                <Activity className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ResponsiveHeroBanner;
