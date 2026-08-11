import { CircleHelp } from "lucide-react";
import { Disclosure } from "@/components/ui/disclosure";
import { PUTER_DEVELOPER_URL } from "@/lib/constants";
import { FREE_ESTIMATES_PER_DAY, PRO_PRICE_ANNUAL, PRO_PRICE_MONTHLY } from "@/lib/pro";

/** What yearly saves vs paying monthly for a full year (mirrors pricing-cards). */
const ANNUAL_SAVINGS = PRO_PRICE_MONTHLY * 12 - PRO_PRICE_ANNUAL;

const FAQ_ITEMS = [
  {
    question: "What's the difference between Free, Monthly and Yearly?",
    answer: [
      `Free costs nothing, forever: unlimited diagnoses, follow-up questions and DTC code lookups, ${FREE_ESTIMATES_PER_DAY} repair cost estimates per day, and a copyable mechanic-ready report with a free PDF download.`,
      `Monthly ($${PRO_PRICE_MONTHLY.toFixed(2)}/month) and Yearly ($${PRO_PRICE_ANNUAL.toFixed(2)}/year) are the same Pro plan — unlimited estimates, saved reports and vehicle profiles. Yearly bills once a year and saves $${ANNUAL_SAVINGS.toFixed(2)} compared with paying month to month.`,
      "Start on Free with nothing to set up and no credit card — PDF downloads are included — then upgrade only if you need unlimited estimates and saved reports.",
    ],
  },
  {
    question: "What exactly does Pro include?",
    answer: [
      `Unlimited repair cost estimates (the free tier allows ${FREE_ESTIMATES_PER_DAY} per day).`,
      "Saved reports & maintenance history on this device.",
      "Saved vehicle profiles for faster checks.",
    ],
  },
  {
    question: "Can I cancel or switch between Monthly and Yearly?",
    answer: [
      "Yes. Both plans are billed by Lemon Squeezy and can be cancelled anytime from the billing portal — you keep Pro until the end of the paid period. Monthly renews month to month; Yearly renews once a year, so cancel before renewal to avoid the next charge. To switch between the two, cancel the current plan and check out with the other one.",
    ],
  },
  {
    question: "How do I activate Pro on my device?",
    answer: [
      "After checkout, Lemon Squeezy emails you a license key. Open the app, choose “Go Pro”, paste the key, and it activates on that browser. Activation is verified through Lemon Squeezy’s license API, and the key can be used on up to two devices.",
    ],
  },
  {
    question: "Does Pro include AI analysis or AI credits?",
    answer: [
      "No. Pro is a flat subscription for product features only — it is not AI credit, unlimited AI, or API access. Every AI analysis is powered by Puter, which uses a user-pays model: you may be asked to sign in with a Puter account and cover your own usage. No API key is used or stored by this app.",
    ],
  },
  {
    question: "What is the refund policy?",
    answer: [
      "Subscriptions and license keys are sold through Lemon Squeezy, which handles payments under their terms. If something is wrong with a Pro purchase, contact us via the Contact page within 14 days and we will help resolve it — including processing a refund through Lemon Squeezy where appropriate.",
    ],
  },
];

/**
 * Pricing FAQ — conversion-focused answers that sell product features (never
 * AI/API access). Reuses the existing accessible Disclosure component.
 */
export function PricingFaq() {
  return (
    <section aria-labelledby="faq-heading" className="mx-auto max-w-2xl">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">FAQ</p>
        <h2 id="faq-heading" className="mt-2 font-display text-xl font-bold tracking-tight text-zinc-50">
          Common questions
        </h2>
      </div>
      <div className="mt-6 space-y-3">
        {FAQ_ITEMS.map((item) => (
          <Disclosure
            key={item.question}
            title={item.question}
            icon={<CircleHelp className="h-4 w-4 text-brand" aria-hidden />}
            buttonLabel={`Show or hide the answer to “${item.question}”`}
          >
            <ul className="space-y-2">
              {item.answer.map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm leading-relaxed text-zinc-300">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-500" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </Disclosure>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-600">
        AI analysis uses Puter&apos;s user-pays model — see the{" "}
        <a
          href={PUTER_DEVELOPER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 underline underline-offset-2 hover:text-brand"
        >
          Puter developer docs
        </a>{" "}
        for details.
      </p>
    </section>
  );
}
