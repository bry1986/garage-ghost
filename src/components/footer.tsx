import Link from "next/link";
import { Wrench } from "lucide-react";
import { APP_NAME, APP_TAGLINE, PUTER_DEVELOPER_URL } from "@/lib/constants";

const LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/refunds", label: "Refunds" },
  { href: "/legal/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-zinc-800 bg-zinc-950">
      {/* Amber hairline mirroring the header — keeps the frame cohesive */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                <Wrench className="h-3.5 w-3.5 text-amber-400" aria-hidden />
              </span>
              <span className="font-display text-sm font-semibold text-zinc-100">{APP_NAME}</span>
            </div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-zinc-500">{APP_TAGLINE}</p>
          </div>

          <nav aria-label="Legal" className="sm:justify-self-center">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Legal</h2>
            <ul className="mt-3 space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-400 underline-offset-2 transition-colors hover:text-amber-300 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sm:justify-self-end">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">About</h2>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href={PUTER_DEVELOPER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-400 underline-offset-2 transition-colors hover:text-amber-300 hover:underline"
                >
                  Powered by Puter
                </a>
              </li>
              <li>
                <Link
                  href="/diagnose"
                  className="text-sm text-zinc-400 underline-offset-2 transition-colors hover:text-amber-300 hover:underline"
                >
                  Diagnose a warning
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-800/80 pt-5">
          <p className="text-xs leading-relaxed text-zinc-500">
            © {new Date().getFullYear()} {APP_NAME}. Educational guidance only - not a diagnosis
            and not a substitute for a qualified mechanic. Your data stays in this browser.
          </p>
        </div>
      </div>
    </footer>
  );
}
