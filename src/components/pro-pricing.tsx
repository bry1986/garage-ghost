"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Crown, FileText, Infinity as InfinityIcon } from "lucide-react";
import { usePro } from "@/components/pro-provider";
import { FREE_ESTIMATES_PER_DAY, PRO_PRICE_ANNUAL, PRO_PRICE_MONTHLY } from "@/lib/pro";

const FREE_FEATURES = [
  "Unlimited diagnoses, follow-up questions and DTC code lookups",
  `${FREE_ESTIMATES_PER_DAY} repair cost estimates per day`,
  "Copyable mechanic-ready report",
];

const PRO_FEATURES = [
  "Unlimited repair cost estimates",
  "Print / Save-as-PDF mechanic reports",
  "Everything in the free plan",
];

export function ProPricingSection() {
  const { openModal, isPro } = usePro();

  return (
    <section aria-labelledby="pro-pricing-heading" className="scroll-mt-24">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">Garage Ghost Pro</p>
        <h2 id="pro-pricing-heading" className="mt-2 font-display text-2xl font-bold tracking-tight text-zinc-50">
          The features drivers pay for most
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400">
          Unlimited repair cost estimates and printable mechanic reports for the workshop.
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
        {/* Free */}
        <div className="card-surface flex flex-col p-5 sm:p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Free</h3>
          <p className="mt-2 font-display text-2xl font-bold text-zinc-50">
            $0<span className="text-xs font-normal text-zinc-500">/forever</span>
          </p>
          <ul className="mt-4 flex-1 space-y-2">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className="card-surface relative flex flex-col border-amber-500/40 bg-amber-500/5 p-5 sm:p-6">
          <span className="absolute -top-2.5 left-5 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-950">
            Pro
          </span>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-300">
            Garage Ghost Pro
          </h3>
          <p className="mt-2 font-display text-2xl font-bold text-zinc-50">
            ${PRO_PRICE_MONTHLY.toFixed(2)}
            <span className="text-xs font-normal text-zinc-500">/mo</span>
            <span className="ml-2 text-xs font-normal text-zinc-400">
              or ${PRO_PRICE_ANNUAL.toFixed(2)}/yr
            </span>
          </p>
          <ul className="mt-4 flex-1 space-y-2">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-zinc-200">
                <Crown className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={openModal}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
          >
            <Crown className="h-4 w-4" aria-hidden />
            {isPro ? "Manage Pro" : "Get Pro"}
          </button>
          <Link
            href="/pricing"
            className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-amber-300 underline-offset-2 hover:underline"
          >
            Compare monthly & yearly plans
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
          <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-zinc-500">
            <FileText className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span>One-time setup per browser: enter the license key you receive by email after checkout.</span>
          </p>
        </div>
      </div>

      <p className="mx-auto mt-4 flex max-w-2xl items-start justify-center gap-1.5 text-center text-[10px] leading-relaxed text-zinc-600">
        <InfinityIcon className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
        <span>
          Pricing is a ballpark guide for this MVP — the checkout page shows the exact amounts. AI
          analysis uses Puter&apos;s user-pays model; Pro is not AI credit. See the Pricing page for
          details.
        </span>
      </p>
    </section>
  );
}
