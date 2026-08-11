"use client";

import Link from "next/link";
import { Check, CheckCircle2, Crown, ExternalLink } from "lucide-react";
import { Button, buttonClassNames } from "@/components/ui/button";
import { usePro } from "@/components/pro-provider";
import { cn } from "@/lib/utils";
import {
  FREE_ESTIMATES_PER_DAY,
  getAnnualCheckoutUrl,
  getMonthlyCheckoutUrl,
  PRO_PRICE_ANNUAL,
  PRO_PRICE_MONTHLY,
} from "@/lib/pro";

interface PricingCardData {
  plan: string;
  price: string;
  period: string;
  note: string;
  href: string;
  cta: string;
  features: string[];
  /** Free tier: gray checks and an in-app CTA instead of checkout. */
  free?: boolean;
  highlighted?: boolean;
}

const FREE_FEATURES = [
  "Unlimited diagnoses, follow-up questions and DTC code lookups",
  `${FREE_ESTIMATES_PER_DAY} repair cost estimates per day`,
  "Copyable mechanic-ready report with free PDF download",
];

const PRO_FEATURES = [
  "Unlimited repair cost estimates",
  "Saved reports & maintenance history on this device",
  "Saved vehicle profiles for faster checks",
];

export function PricingCards() {
  const { isPro, openModal } = usePro();
  const monthlyUrl = getMonthlyCheckoutUrl();
  const annualUrl = getAnnualCheckoutUrl();

  // What yearly saves vs paying monthly for a full year.
  const annualSavings = PRO_PRICE_MONTHLY * 12 - PRO_PRICE_ANNUAL;

  const cards: PricingCardData[] = [
    {
      plan: "Free",
      price: "$0",
      period: "forever",
      note: "Everything you need for occasional checks.",
      href: "/diagnose",
      cta: "Start free",
      features: FREE_FEATURES,
      free: true,
    },
    {
      plan: "Monthly",
      price: `$${PRO_PRICE_MONTHLY.toFixed(2)}`,
      period: "per month",
      note: "Flexible, cancel anytime.",
      href: monthlyUrl,
      cta: "Get Pro monthly",
      features: PRO_FEATURES,
    },
    {
      plan: "Yearly",
      price: `$${PRO_PRICE_ANNUAL.toFixed(2)}`,
      period: "per year",
      note: "Two months free vs monthly.",
      href: annualUrl,
      cta: "Get Pro yearly",
      features: PRO_FEATURES,
      highlighted: true,
    },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.plan}
          className={
            card.highlighted
              ? "card-glow relative flex flex-col rounded-xl border bg-brand/5 p-6"
              : "relative flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-6"
          }
        >
          {card.highlighted && (
            <span className="absolute -top-2.5 left-5 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white dark:bg-blue-600">
              Best value
            </span>
          )}
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-200">
            {card.plan}
          </h3>
          <p className="mt-3">
            <span className="font-display text-3xl font-bold tracking-tight text-zinc-50">
              {card.price}
            </span>{" "}
            <span className="text-sm text-zinc-400">{card.period}</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">{card.note}</p>
          {card.highlighted && (
            <p className="mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
              Save ${annualSavings.toFixed(2)} per year
            </p>
          )}

          <ul className="mt-5 flex-1 space-y-2.5">
            {card.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                {card.free ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                ) : (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                )}
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {card.free ? (
            <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
              No account, no credit card — your reports stay in this browser.
            </p>
          ) : (
            <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
              After checkout you receive a license key by email — enter it in the app to unlock
              this browser.
            </p>
          )}

          {card.free ? (
            <Link href={card.href} className={cn("mt-4", buttonClassNames({ variant: "outline" }))}>
              {card.cta}
            </Link>
          ) : isPro ? (
            <Button type="button" onClick={openModal} variant="outline" className="mt-4">
              <Crown className="h-4 w-4" aria-hidden />
              Manage Pro
            </Button>
          ) : card.href ? (
            <a
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "mt-4",
                buttonClassNames({ variant: card.highlighted ? "primary" : "outline" })
              )}
            >
              {card.cta}
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          ) : (
            <p className="mt-4 rounded-md border border-zinc-700 bg-zinc-950/60 p-2 text-center text-xs text-zinc-500">
              Checkout is not configured yet — set the Lemon Squeezy checkout URL to enable
              purchases.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
