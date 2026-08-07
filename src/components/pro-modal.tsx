"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Crown,
  ExternalLink,
  FileText,
  Infinity as InfinityIcon,
  KeyRound,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FREE_ESTIMATES_PER_DAY,
  PRO_PRICE_ANNUAL,
  PRO_PRICE_MONTHLY,
  getAnnualCheckoutUrl,
  getBillingPortalUrl,
  getMonthlyCheckoutUrl,
  isCheckoutConfigured,
} from "@/lib/pro";

interface ProModalProps {
  open: boolean;
  isPro: boolean;
  onClose: () => void;
  onActivate: (licenseKey: string) => Promise<{ ok: boolean; error?: string }>;
  onDeactivate: () => Promise<void>;
}

const PRO_FEATURES = [
  {
    icon: InfinityIcon,
    title: "Unlimited repair cost estimates",
    text: `No daily limit — the free tier allows ${FREE_ESTIMATES_PER_DAY} per day.`,
  },
  {
    icon: FileText,
    title: "Print / Save-as-PDF mechanic reports",
    text: "Professional, printable hand-off documents for your workshop.",
  },
];

export function ProModal({ open, isPro, onClose, onActivate, onDeactivate }: ProModalProps) {
  const [licenseKey, setLicenseKey] = useState("");
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationOk, setActivationOk] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const monthlyUrl = getMonthlyCheckoutUrl();
  const annualUrl = getAnnualCheckoutUrl();
  const billingUrl = getBillingPortalUrl();
  const checkoutConfigured = isCheckoutConfigured();

  // Focus + escape handling + scroll lock + a minimal focus trap while open.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      // Keep Tab/Shift+Tab cycling inside the dialog.
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || (active instanceof Node && !panel.contains(active))) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || (active instanceof Node && !panel.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  // Move focus to the license input when the activation form becomes visible.
  useEffect(() => {
    if (open && !isPro) {
      const timer = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(timer);
    }
  }, [open, isPro]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const key = licenseKey.trim();
    if (!key || activating) return;
    setActivating(true);
    setActivationError(null);
    setActivationOk(null);
    const result = await onActivate(key);
    setActivating(false);
    if (result.ok) {
      setActivationOk("License activated — Pro features are now unlocked.");
      setLicenseKey("");
    } else {
      setActivationError(
        result.error ?? "Activation failed. Check the key and try again."
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-modal-title"
    >
      {/* Backdrop (clickable to close, but out of the tab order) */}
      <button
        type="button"
        aria-label="Close upgrade dialog"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 id="pro-modal-title" className="flex items-center gap-2 text-sm font-semibold text-zinc-50">
            <Crown className="h-4 w-4 text-amber-400" aria-hidden />
            Garage Ghost Pro
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {isPro ? (
          <div className="space-y-4 px-5 py-5">
            <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                <span className="font-semibold">You&apos;re Pro.</span> Unlimited cost estimates and
                PDF report export are unlocked.
              </p>
            </div>
            {billingUrl && (
              <a
                href={billingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-amber-500/60 hover:text-amber-300"
              >
                Manage subscription
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
            <button
              type="button"
              onClick={async () => {
                await onDeactivate();
                onClose();
              }}
              className="text-xs text-zinc-400 underline-offset-2 transition-colors hover:text-red-300 hover:underline"
            >
              Remove Pro from this browser
            </button>
          </div>
        ) : (
          <div className="space-y-4 px-5 py-5">
            <p className="text-sm leading-relaxed text-zinc-300">
              Unlock the features drivers pay for most: unlimited repair cost estimates and
              printable mechanic reports.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-zinc-700 bg-zinc-950/60 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Monthly</p>
                <p className="mt-1 text-lg font-bold text-zinc-50">
                  ${PRO_PRICE_MONTHLY.toFixed(2)}
                  <span className="text-xs font-normal text-zinc-500">/mo</span>
                </p>
              </div>
              <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-300">
                  Yearly <span className="ml-1 rounded bg-amber-500/15 px-1 py-0.5 text-[10px]">Save ~30%</span>
                </p>
                <p className="mt-1 text-lg font-bold text-zinc-50">
                  ${PRO_PRICE_ANNUAL.toFixed(2)}
                  <span className="text-xs font-normal text-zinc-500">/yr</span>
                </p>
              </div>
            </div>

            <ul className="space-y-2">
              {PRO_FEATURES.map((feature) => (
                <li key={feature.title} className="flex items-start gap-2 text-sm text-zinc-300">
                  <feature.icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                  <span>
                    <span className="font-medium text-zinc-100">{feature.title}.</span>{" "}
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2">
              {monthlyUrl ? (
                <a
                  href={monthlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
                >
                  Get Pro — ${PRO_PRICE_MONTHLY.toFixed(2)}/month
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              ) : (
                <p className="rounded-md border border-zinc-700 bg-zinc-950/60 p-2 text-center text-xs text-zinc-500">
                  Checkout is not configured yet — set the Lemon Squeezy checkout URL to enable
                  purchases.
                </p>
              )}
              {annualUrl && (
                <a
                  href={annualUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-amber-500/60 hover:text-amber-300"
                >
                  ${PRO_PRICE_ANNUAL.toFixed(2)}/year
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              )}
            </div>

            <div className="border-t border-zinc-800 pt-4">
              <p className="text-xs text-zinc-400">
                Already a member? Your license key was emailed to you after checkout. Enter it
                below to activate this browser.
              </p>
              <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2">
                <label htmlFor="pro-license-key" className="sr-only">
                  License key
                </label>
                <input
                  ref={inputRef}
                  id="pro-license-key"
                  name="pro-license-key"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={licenseKey}
                  onChange={(event) => setLicenseKey(event.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  disabled={activating}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100 placeholder-zinc-600 transition-colors focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={activating || licenseKey.trim().length === 0}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-amber-500/60 hover:text-amber-300",
                    (activating || licenseKey.trim().length === 0) &&
                      "cursor-not-allowed opacity-60"
                  )}
                >
                  {activating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Activating…
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" aria-hidden />
                      Activate license
                    </>
                  )}
                </button>
              </form>
              {activationOk && (
                <p role="status" aria-live="polite" className="mt-2 text-xs text-emerald-300">
                  {activationOk}
                </p>
              )}
              {activationError && (
                <p role="alert" className="mt-2 text-xs text-red-400">
                  {activationError}
                </p>
              )}
              {!checkoutConfigured && (
                <p className="mt-2 text-[10px] leading-relaxed text-zinc-600">
                  You can test activation once a Lemon Squeezy product with license keys is
                  configured. See the README for the one-time setup.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
