import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ScanLine, Stethoscope } from "lucide-react";
import { Disclosure } from "@/components/ui/disclosure";
import { cn } from "@/lib/utils";
import {
  GUIDE_URGENCY_GROUPS,
  HUB_FAQ,
  LIGHT_COLOR_DOT,
  WARNING_LIGHT_GUIDES,
} from "@/lib/warning-lights";

export const metadata: Metadata = {
  title: "Dashboard Warning Lights: Meanings, Causes & What to Do",
  description:
    "What does that dashboard light mean? Free guides to the brake, check engine, oil pressure, battery, coolant, ABS, airbag, tire pressure and steering warning lights — with common causes, repair costs and what to do.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  const faqSchema = HUB_FAQ.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer.replace(/\n+/g, " ") },
  }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 pb-16">
      {/* ------------------------------------------------ Hero */}
      <section className="glass-panel card-lift rounded-2xl p-6 sm:p-8" aria-labelledby="guides-h1">
        <p className="eyebrow">Free warning-light guides</p>
        <h1
          id="guides-h1"
          className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          Dashboard warning lights — what they mean &amp; what to do
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          A plain-English guide to the most common dashboard warning lights: what each one means,
          the usual causes, typical repair costs, and whether it&apos;s safe to keep driving. Free —
          no account, no paywall.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/diagnose"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
          >
            <Stethoscope className="h-4 w-4" aria-hidden />
            Diagnose my symptoms
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <span className="inline-flex items-center gap-2 text-xs text-muted">
            <ScanLine className="h-4 w-4 text-brand" aria-hidden />
            Have a code instead? Look it up in the OBD-II reference.
          </span>
        </div>
      </section>

      {/* ------------------------------------------------ Groups */}
      {GUIDE_URGENCY_GROUPS.map((group) => {
        const groupGuides = WARNING_LIGHT_GUIDES.filter(
          (guide) => guide.urgency === group.urgency
        );
        if (groupGuides.length === 0) return null;
        return (
          <section key={group.urgency} aria-labelledby={`group-${group.urgency}`}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2
                id={`group-${group.urgency}`}
                className="font-display text-xl font-bold tracking-tight text-foreground"
              >
                {group.title}
              </h2>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                  group.chip
                )}
              >
                {groupGuides.length} guides
              </span>
            </div>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-muted">{group.blurb}</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groupGuides.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="card-surface card-lift group flex h-full flex-col gap-2.5 rounded-2xl p-4"
                  >
                    <span className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-inset ring-brand/20 transition-colors duration-200 group-hover:bg-brand/15">
                        <guide.icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="text-sm font-semibold text-foreground">{guide.name}</span>
                      <span className="ml-auto flex items-center gap-1">
                        {guide.colors.map((color) => (
                          <span
                            key={color}
                            aria-hidden
                            className={cn("h-1.5 w-1.5 rounded-full", LIGHT_COLOR_DOT[color])}
                          />
                        ))}
                        <span className="sr-only">{guide.colors.join(" and ")} light</span>
                      </span>
                    </span>
                    <span className="text-xs leading-relaxed text-muted">{guide.summary}</span>
                    <span
                      className={cn(
                        "mt-auto self-start rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                        group.chip
                      )}
                    >
                      {guide.urgencyLabel}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {/* ------------------------------------------------ Cross-link to OBD codes */}
      <section className="card-surface flex flex-col items-start justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
            Already have the fault code?
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
            The check engine light hides a code behind it. Look up plain-English meanings, causes and
            repair costs for the most common OBD-II codes — or paste the code into a diagnosis.
          </p>
        </div>
        <Link
          href="/obd-codes"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-brand/60 hover:text-brand"
        >
          <ScanLine className="h-4 w-4 text-brand" aria-hidden />
          Browse OBD-II codes
        </Link>
      </section>

      {/* ------------------------------------------------ FAQ */}
      <section aria-labelledby="guides-faq-heading" className="max-w-3xl">
        <p className="eyebrow">Good to know</p>
        <h2
          id="guides-faq-heading"
          className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground"
        >
          Warning lights FAQ
        </h2>
        <div className="mt-5 space-y-3">
          {HUB_FAQ.map((item) => (
            <Disclosure key={item.question} title={item.question}>
              <p className="text-sm leading-relaxed text-muted">{item.answer}</p>
            </Disclosure>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ Disclaimer */}
      <p className="max-w-3xl text-xs leading-relaxed text-muted">
        These guides are educational guidance about what a warning light commonly means. The same
        light can have several causes, and behaviour varies by make and model. Always confirm with a
        qualified workshop — ideally using the printed report this site can generate for you.
      </p>

      {/* ------------------------------------------------ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqSchema,
          })
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e"),
        }}
      />
    </div>
  );
}
