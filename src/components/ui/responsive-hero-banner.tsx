"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowRight, FileText, Menu, Wrench, X } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  href: string;
}

/** Nav is carried by the hero on the landing page; the primary CTA covers Diagnose. */
const NAV_LINKS: NavLink[] = [
  { label: "VIN decoder", href: "/vin" },
  { label: "Workshops", href: "/workshops" },
  { label: "History", href: "/history" },
  { label: "Pricing", href: "/pricing" },
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

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2400&q=80";

/**
 * Full-bleed cinematic hero for the landing page. Structure follows the
 * responsive-hero-banner template: layered background image, integrated glass
 * nav, badge → headline → description → CTAs, and a code marquee in place of
 * the partner-logo strip. All motion uses the shared entrance/energy curves.
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
    <section className="relative isolate flex min-h-screen w-full flex-col overflow-hidden bg-zinc-950">
      {/* Background — cinematic automotive shot, scrimmed for legibility */}
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        quality={85}
        className="object-cover"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-950/85 via-zinc-950/45 to-zinc-950"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_38%,rgba(9,9,11,0.35),transparent_70%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />

      {/* Integrated glass nav */}
      <header className="relative z-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between py-4 sm:py-5">
            <Link
              href="/"
              aria-label={`${APP_NAME} home`}
              className="group flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-85"
            >
              <span className="glass-chip flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200 group-hover:bg-white/10">
                <Wrench className="h-4 w-4 text-amber-400" aria-hidden />
              </span>
              <span className="font-display text-base font-semibold tracking-tight text-white">
                {APP_NAME}
              </span>
            </Link>

            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10 backdrop-blur lg:flex"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/diagnose"
                className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white/90"
              >
                Diagnose now
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </nav>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              className="glass-chip inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10 lg:hidden"
            >
              <Menu className="h-5 w-5 text-white/90" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* Hero copy */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-10 pt-14 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex animate-fade-slide-in-1 items-center gap-3 rounded-full bg-white/10 px-2.5 py-2 ring-1 ring-white/15 backdrop-blur">
            <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-zinc-900">
              New
            </span>
            <span className="text-sm font-medium text-white/90">
              Free AI check-engine light triage — 100% on-device
            </span>
          </div>

          <h1 className="animate-fade-slide-in-2 font-serif text-5xl leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Decode your
            <br className="hidden sm:block" />
            warning lights
          </h1>

          <p className="mx-auto mt-6 max-w-2xl animate-fade-slide-in-3 text-base text-white/80 sm:text-lg">
            Snap a photo of your dashboard or describe the symptom — Garage Ghost turns it into
            clear, safety-first guidance, honest repair cost ballparks, and a printable report for
            your mechanic. No install. No account.
          </p>

          <div className="mt-10 flex animate-fade-slide-in-4 flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/diagnose"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-white/90"
            >
              Diagnose now
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <a
              href="#sample-report"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-white/90 ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/15 hover:text-white"
            >
              <FileText className="h-4 w-4" aria-hidden />
              See a sample report
            </a>
          </div>
        </div>
      </div>

      {/* Fault-code marquee — the landing's logo-strip stand-in */}
      <div className="relative z-10 pb-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="animate-fade-slide-in-1 text-center text-sm text-white/60">
            Decodes the codes that matter most
          </p>
          <div className="marquee marquee-mask mt-6 animate-fade-slide-in-2">
            {/* The duplicated half exists for the seamless loop — keep it out
                of the tab order and away from screen readers. */}
            <div className="marquee-track">
              {[...DTC_CHIPS, ...DTC_CHIPS].map((chip, index) => (
                <Link
                  key={`${chip.code}-${index}`}
                  href="/diagnose"
                  aria-hidden={index >= DTC_CHIPS.length ? true : undefined}
                  tabIndex={index >= DTC_CHIPS.length ? -1 : undefined}
                  className="glass-chip mr-3 inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm text-white/75 transition-colors hover:text-white"
                >
                  <span className="font-mono text-xs font-semibold text-amber-300">{chip.code}</span>
                  <span className="text-zinc-400">{chip.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
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
            className="drawer-in absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col border-l border-white/10 bg-zinc-950/95 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <span className="font-display text-sm font-semibold text-white">Menu</span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <nav aria-label="Mobile navigation" className="flex flex-1 flex-col gap-1 p-3">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive("/")
                    ? "bg-white/10 text-white"
                    : "text-zinc-300 hover:bg-white/10 hover:text-white"
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
                      ? "bg-white/10 text-white"
                      : "text-zinc-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-white/10 p-3">
              <Link
                href="/diagnose"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white/90"
              >
                Diagnose now
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ResponsiveHeroBanner;
