import Link from "next/link";
import { Logo } from "@/components/logo";
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
      {/* Brand-blue hairline mirroring the header — keeps the frame cohesive */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent"
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <Logo size="sm" />
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-zinc-500">{APP_TAGLINE}</p>
          </div>

          <nav aria-label="Legal" className="sm:justify-self-center">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Legal</h2>
            <ul className="mt-3 space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-400 underline-offset-2 transition-colors hover:text-brand hover:underline"
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
                  className="text-sm text-zinc-400 underline-offset-2 transition-colors hover:text-brand hover:underline"
                >
                  Powered by Puter
                </a>
              </li>
              <li>
                <Link
                  href="/diagnose"
                  className="text-sm text-zinc-400 underline-offset-2 transition-colors hover:text-brand hover:underline"
                >
                  Diagnose a warning
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-zinc-400 underline-offset-2 transition-colors hover:text-brand hover:underline"
                >
                  FAQ
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
