"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, CheckCircle2, Crown, Wrench } from "lucide-react";
import { usePro } from "@/components/pro-provider";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/diagnose", label: "Diagnose" },
  { href: "/history", label: "History" },
];

export function Header() {
  const pathname = usePathname();
  const { isPro, licenseStatus, validating, openModal } = usePro();
  const licenseExpired = !isPro && licenseStatus === "expired";

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md transition-opacity hover:opacity-80"
          aria-label={`${APP_NAME} home`}
        >
          <Wrench className="h-5 w-5 text-amber-400" aria-hidden />
          <span className="text-sm font-semibold tracking-tight text-zinc-100">{APP_NAME}</span>
        </Link>
        <div className="flex items-center gap-2">
          <nav aria-label="Main navigation">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-zinc-800 text-amber-400"
                          : "text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <button
            type="button"
            onClick={openModal}
            title={
              validating
                ? "Checking license…"
                : isPro
                  ? "Pro license active"
                  : licenseExpired
                    ? "Your Pro license has expired — click to renew"
                    : "Upgrade to Pro"
            }
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isPro
                ? "text-emerald-400 hover:bg-zinc-800/60"
                : licenseExpired
                  ? "border border-red-500/40 bg-red-500/5 text-red-300 hover:border-red-400/60 hover:bg-red-500/10"
                  : "border border-amber-500/40 bg-amber-500/5 text-amber-300 hover:border-amber-400/60 hover:bg-amber-500/10"
            )}
            aria-label={
              isPro
                ? "Open Pro settings — license active"
                : licenseExpired
                  ? "Renew Pro — license expired"
                  : "Upgrade to Pro"
            }
          >
            {isPro ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            ) : licenseExpired ? (
              <AlertTriangle className="h-4 w-4" aria-hidden />
            ) : (
              <Crown className="h-4 w-4" aria-hidden />
            )}
            {validating ? "Pro…" : isPro ? "Pro" : licenseExpired ? "Pro expired" : "Go Pro"}
            {isPro && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                aria-hidden
              />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
