import type { Metadata } from "next";
import { CircleHelp, Crown, FileText, FolderOpen, History, Infinity as InfinityIcon } from "lucide-react";
import { PricingCards } from "@/components/pricing-cards";
import { PricingFaq } from "@/components/pricing-faq";
import { FREE_ESTIMATES_PER_DAY, PRO_PRICE_ANNUAL, PRO_PRICE_MONTHLY } from "@/lib/pro";
import { PUTER_DEVELOPER_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Garage Ghost Pro — unlimited repair cost estimates, printable mechanic reports, and saved vehicle profiles.",
};

const WHAT_YOU_BUY = [
  {
    icon: InfinityIcon,
    title: "Unlimited repair cost estimates",
    text: `The free tier allows ${FREE_ESTIMATES_PER_DAY} per day; Pro removes the limit so you can compare ballparks for every issue.`,
  },
  {
    icon: FileText,
    title: "Print / Save-as-PDF mechanic reports",
    text: "Professional, printable hand-off documents for your workshop — save and share the full report.",
  },
  {
    icon: History,
    title: "Saved reports & maintenance history",
    text: "Every report you generate is kept in this browser so you can look back at what you checked and when.",
  },
  {
    icon: FolderOpen,
    title: "Organization features",
    text: "Save your vehicles once and reload them instantly for the next diagnosis.",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <header className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10">
          <Crown className="h-6 w-6 text-amber-400" aria-hidden />
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-zinc-50">
          Garage Ghost Pro
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
          The features drivers pay for most — unlimited repair cost estimates and printable
          mechanic reports — plus saved reports and vehicle profiles that make each check faster.
        </p>
      </header>

      <PricingCards />

      <section aria-labelledby="what-you-buy-heading">
        <h2 id="what-you-buy-heading" className="font-display text-xl font-bold text-zinc-50">
          What you get
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {WHAT_YOU_BUY.map((item) => (
            <div key={item.title} className="card-surface p-5">
              <item.icon className="h-5 w-5 text-amber-400" aria-hidden />
              <h3 className="mt-3 text-sm font-semibold text-zinc-100">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="puter-note-heading"
        className="card-surface border-zinc-700 p-5"
      >
        <h2 id="puter-note-heading" className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <CircleHelp className="h-4 w-4 text-amber-400" aria-hidden />
          How AI analysis is billed
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Pro is a flat subscription for features like unlimited estimates and PDF export — it is
          not &quot;AI credit&quot;. Each AI analysis is powered by{" "}
          <a
            href={PUTER_DEVELOPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-300 underline underline-offset-2 hover:text-amber-200"
          >
            Puter
          </a>
          , which uses a user-pays model: you may be asked to sign in with a Puter account and cover
          your own usage. No API key is used or stored by this app.
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
          Pricing shown is a ballpark for this MVP — the Lemon Squeezy checkout shows the exact
          amounts. Pro is verified in your browser via the Lemon Squeezy license API (${PRO_PRICE_MONTHLY.toFixed(2)}/mo or ${PRO_PRICE_ANNUAL.toFixed(2)}/yr).
        </p>
      </section>

      <PricingFaq />
    </div>
  );
}
