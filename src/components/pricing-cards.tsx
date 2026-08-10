"use client";

import { Check, Crown, ExternalLink } from "lucide-react";
import { Button, buttonClassNames } from "@/components/ui/button";
import { usePro } from "@/components/pro-provider";
import { cn } from "@/lib/utils";
import {
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
  highlighted?: boolean;
}

export function PricingCards() {
  const { isPro, openModal } = usePro();
  const monthlyUrl = getMonthlyCheckoutUrl();
  const annualUrl = getAnnualCheckoutUrl();

  const features = [
    "Unlimited repair cost estimates",
    "Print / Save-as-PDF mechanic reports",
    "Saved reports & maintenance history on this device",
    "Saved vehicle profiles for faster checks",
  ];

  const cards: PricingCardData[] = [
    {
      plan: "Monthly",
      price: `$${PRO_PRICE_MONTHLY.toFixed(2)}`,
      period: "per month",
      note: "Flexible, cancel anytime.",
      href: monthlyUrl,
      cta: "Get Pro monthly",
    },
    {
      plan: "Yearly",
      price: `$${PRO_PRICE_ANNUAL.toFixed(2)}`,
      period: "per year",
      note: "Two months free vs monthly.",
      href: annualUrl,
      cta: "Get Pro yearly",
      highlighted: true,
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {cards.map((card) => (
        <div
          key={card.plan}
          className={
            card.highlighted
              ? "relative flex flex-col rounded-xl border border-amber-500/50 bg-amber-500/5 p-6"
              : "relative flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-6"
          }
        >
          {card.highlighted && (
            <span className="absolute -top-2.5 left-5 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-950">
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

          <ul className="mt-5 flex-1 space-y-2.5">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
            After checkout you receive a license key by email — enter it in the app to unlock this
            browser.
          </p>

          {isPro ? (
            <Button
              type="button"
              onClick={openModal}
              variant="outline"
              className="mt-4"
            >
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
