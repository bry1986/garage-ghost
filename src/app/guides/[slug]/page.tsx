import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  CircleDollarSign,
  CircleX,
  ListChecks,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { Disclosure } from "@/components/ui/disclosure";
import { lookupDtc } from "@/lib/dtc";
import { APP_NAME, SITE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  getGuide,
  LIGHT_COLOR_DOT,
  listGuideSlugs,
  relatedGuidesFor,
  type LightColor,
} from "@/lib/warning-lights";

export const dynamicParams = false;

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

const URGENCY_META = {
  stop: {
    label: "Stop safely now",
    chip: "bg-red-500/15 text-red-600 ring-red-500/40 dark:text-red-400",
    heading: "Stop safely and get professional help",
    body: "This light is safety-critical. Stop somewhere safe as soon as possible, switch the engine off, and call for help — do not plan to keep driving. If the car is already behaving dangerously (loss of braking, steering or power), stop immediately.",
  },
  soon: {
    label: "Act soon",
    chip: "bg-amber-500/15 text-amber-600 ring-amber-500/40 dark:text-amber-400",
    heading: "Act soon — a short drive is usually fine",
    body: "This warning is serious but rarely requires stopping on the spot. A short, careful drive to a workshop is usually acceptable; a long trip is not. If additional red lights, smoke or odd behaviour appear, stop safely and call for help.",
  },
  watch: {
    label: "Check when convenient",
    chip: "bg-sky-500/15 text-sky-600 ring-sky-500/40 dark:text-sky-400",
    heading: "Check soon — not a stop-now emergency",
    body: "This light usually signals a system worth understanding and checking soon — a low tire, a sensor fault or a disabled assist system. Most causes are inexpensive if caught early, and several hint at tires or brakes, so don't leave it for months.",
  },
} as const;

const COLOR_LABEL: Record<LightColor, string> = {
  red: "Red",
  amber: "Amber",
  blue: "Blue",
};

export function generateStaticParams() {
  return listGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Not found" };
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const urgency = URGENCY_META[guide.urgency];
  const relatedGuides = relatedGuidesFor(guide.slug);
  const relatedCodes = guide.relatedDtc
    .map((code) => ({ code, entry: lookupDtc(code) }))
    .filter((item): item is { code: string; entry: NonNullable<ReturnType<typeof lookupDtc>> } =>
      Boolean(item.entry)
    );

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Warning lights",
        item: `${SITE_URL}/guides`,
      },
      { "@type": "ListItem", position: 3, name: guide.name },
    ],
  };

  const faqSchema = guide.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a.replace(/\n+/g, " ") },
  }));

  const sectionClass = "card-surface rounded-2xl p-5 sm:p-6";
  const sectionHeadingClass =
    "flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wide text-zinc-200";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 pb-16">
      {/* ------------------------------------------------ Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="transition-colors hover:text-brand">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden />
        <Link href="/guides" className="transition-colors hover:text-brand">
          Warning lights
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden />
        <span aria-current="page" className="font-medium text-foreground">
          {guide.name}
        </span>
      </nav>

      {/* ------------------------------------------------ Hero */}
      <section className="glass-panel card-lift rounded-2xl p-6 sm:p-8" aria-labelledby="guide-h1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-brand/15 px-2.5 py-1 text-sm font-semibold text-brand ring-1 ring-inset ring-brand/25">
            <guide.icon className="h-4 w-4" aria-hidden />
            {guide.shortName}
          </span>
          <span className="flex items-center gap-1">
            {guide.colors.map((color) => (
              <span
                key={color}
                aria-hidden
                className={cn("h-1.5 w-1.5 rounded-full", LIGHT_COLOR_DOT[color])}
              />
            ))}
            <span className="ml-1 text-xs font-medium text-muted">
              {guide.colors.map((c) => COLOR_LABEL[c]).join(" & ")} light
            </span>
          </span>
          <span
            className={cn(
              "ml-auto rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
              urgency.chip
            )}
          >
            {guide.urgencyLabel}
          </span>
        </div>
        <h1
          id="guide-h1"
          className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          {guide.name}: meaning, causes &amp; what to do
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{guide.summary}</p>
        <Link
          href="/diagnose"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          <Stethoscope className="h-4 w-4" aria-hidden />
          Get a free AI reading of my exact symptoms
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <p className="mt-3 text-xs text-muted">
          Free · no account · answer in your language — describe your vehicle and the warning for a
          safety-first reading.
        </p>
      </section>

      {/* ------------------------------------------------ What it looks like */}
      <section aria-labelledby="appearance-heading" className={sectionClass}>
        <h2 id="appearance-heading" className={sectionHeadingClass}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-inset ring-brand/20">
            <ScanLine className="h-4 w-4" aria-hidden />
          </span>
          What does the {guide.name.toLowerCase()} look like?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{guide.appearsAs}</p>
      </section>

      {/* ------------------------------------------------ What it means */}
      <section aria-labelledby="meaning-heading" className={sectionClass}>
        <h2 id="meaning-heading" className={sectionHeadingClass}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-inset ring-brand/20">
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </span>
          What the {guide.name.toLowerCase()} means
        </h2>
        <ul className="mt-3 space-y-2">
          {guide.meanings.map((meaning, index) => (
            <li key={index} className="flex items-start gap-2.5 text-sm text-zinc-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/70" aria-hidden />
              {meaning}
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------ Common causes */}
      <section aria-labelledby="causes-heading" className={sectionClass}>
        <h2 id="causes-heading" className={sectionHeadingClass}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-inset ring-brand/20">
            <ListChecks className="h-4 w-4" aria-hidden />
          </span>
          Common causes
        </h2>
        <ul className="mt-3 space-y-2">
          {guide.causes.map((cause, index) => (
            <li key={index} className="flex items-start gap-2.5 text-sm text-zinc-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/70" aria-hidden />
              {cause}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          A warning light points at a system, not a single part — the same light can have several
          causes and behave differently across makes and models. A workshop confirms which one
          applies to your vehicle.
        </p>
      </section>

      {/* ------------------------------------------------ Repair costs */}
      <section aria-labelledby="costs-heading" className={sectionClass}>
        <h2 id="costs-heading" className={sectionHeadingClass}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-inset ring-brand/20">
            <CircleDollarSign className="h-4 w-4" aria-hidden />
          </span>
          Typical repair costs
        </h2>
        <ul className="mt-3 space-y-2">
          {guide.costs.map((cost) => (
            <li
              key={cost.label}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg border border-zinc-700/70 bg-zinc-900/50 px-3.5 py-2.5"
            >
              <span className="text-sm text-zinc-300">{cost.label}</span>
              <span className="font-mono text-sm font-bold text-foreground">{cost.range}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Typical US parts-and-labor ballparks. Actual prices vary by vehicle, region and workshop.
        </p>
      </section>

      {/* ------------------------------------------------ What to do / not to do */}
      <div className="grid gap-5 sm:grid-cols-2">
        <section
          aria-labelledby="dos-heading"
          className={cn(sectionClass, "border-l-[3px] border-l-emerald-500/70")}
        >
          <h2 id="dos-heading" className={sectionHeadingClass}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/25">
              <ShieldCheck className="h-4 w-4" aria-hidden />
            </span>
            What to do
          </h2>
          <ul className="mt-3 space-y-2.5">
            {guide.dos.map((item, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm text-zinc-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section
          aria-labelledby="donts-heading"
          className={cn(sectionClass, "border-l-[3px] border-l-red-500/70")}
        >
          <h2 id="donts-heading" className={sectionHeadingClass}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-500 ring-1 ring-inset ring-red-500/25">
              <CircleX className="h-4 w-4" aria-hidden />
            </span>
            What not to do
          </h2>
          <ul className="mt-3 space-y-2.5">
            {guide.donts.map((item, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm text-zinc-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/70" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ------------------------------------------------ Safety note */}
      <section
        aria-labelledby="safety-heading"
        className={cn(sectionClass, "border-l-[3px]", "border-l-red-500/70")}
      >
        <h2 id="safety-heading" className={sectionHeadingClass}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-500 ring-1 ring-inset ring-red-500/25">
            <AlertTriangle className="h-4 w-4" aria-hidden />
          </span>
          {urgency.heading}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{urgency.body}</p>
        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-caution" aria-hidden />
          Red warning lights, smoke, fuel smell, overheating, or brake and steering trouble always
          mean stop safely and contact roadside assistance — regardless of which light is showing.
        </p>
      </section>

      {/* ------------------------------------------------ Related codes */}
      {relatedCodes.length > 0 && (
        <section aria-labelledby="related-codes-heading" className={sectionClass}>
          <h2 id="related-codes-heading" className={sectionHeadingClass}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-inset ring-brand/20">
              <Wrench className="h-4 w-4" aria-hidden />
            </span>
            Fault codes that often set this light
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {relatedCodes.map(({ code, entry }) => (
              <li key={code}>
                <Link
                  href={`/obd-codes/${code}`}
                  className="group inline-flex items-center gap-2 rounded-full border border-zinc-700/80 px-3 py-1.5 text-xs transition-colors hover:border-brand/60 hover:text-brand"
                >
                  <span className="font-mono font-bold">{code}</span>
                  <span className="max-w-44 truncate text-muted group-hover:text-brand/80">
                    {entry.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ------------------------------------------------ Related guides */}
      {relatedGuides.length > 0 && (
        <section aria-labelledby="related-guides-heading" className={sectionClass}>
          <h2 id="related-guides-heading" className={sectionHeadingClass}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-inset ring-brand/20">
              <ScanLine className="h-4 w-4" aria-hidden />
            </span>
            Related warning-light guides
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {relatedGuides.map((related) => (
              <li key={related.slug}>
                <Link
                  href={`/guides/${related.slug}`}
                  className="group flex items-center gap-2.5 rounded-xl border border-zinc-700/80 px-3.5 py-2.5 transition-colors hover:border-brand/60"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <related.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="text-sm font-medium text-foreground group-hover:text-brand">
                    {related.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ------------------------------------------------ FAQ */}
      <section aria-labelledby="guide-faq-heading" className={sectionClass}>
        <p className="eyebrow">This light, in practice</p>
        <h2
          id="guide-faq-heading"
          className="mt-2 font-display text-xl font-bold tracking-tight text-foreground"
        >
          {guide.name} FAQ
        </h2>
        <div className="mt-4 space-y-3">
          {guide.faq.map((item) => (
            <Disclosure key={item.q} title={item.q}>
              <p className="text-sm leading-relaxed text-muted">{item.a}</p>
            </Disclosure>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ Bottom CTA */}
      <section className="glass-panel rounded-2xl p-6 text-center sm:p-8">
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Not sure your {guide.shortName.toLowerCase()} is serious?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Describe your vehicle and symptoms — {APP_NAME} returns a safety-first reading with a risk
          level, safe checks and a printable report for your mechanic. Free, no account.
        </p>
        <Link
          href="/diagnose"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          Start a free diagnosis
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      <p className="text-xs leading-relaxed text-muted">
        Educational guidance only — not a diagnosis and not a substitute for a qualified mechanic.
      </p>

      {/* ------------------------------------------------ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumbSchema, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqSchema }])
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e"),
        }}
      />
    </div>
  );
}
