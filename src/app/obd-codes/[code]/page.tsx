import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  CircleDollarSign,
  ListChecks,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { COST_DISCLAIMER, estimateDtcCosts, formatCostRange } from "@/lib/costs";
import { listDtcCodes, lookupDtc, relatedDtcCodes, type DtcUrgency } from "@/lib/dtc";
import { APP_NAME, SITE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const dynamicParams = false;

interface ObdCodePageProps {
  params: Promise<{ code: string }>;
}

const URGENCY_META: Record<
  DtcUrgency,
  { label: string; chip: string; heading: string; body: string }
> = {
  high: {
    label: "Act promptly",
    chip: "bg-red-500/15 text-red-600 ring-red-500/40 dark:text-red-400",
    heading: "High urgency — have this checked soon",
    body: "This code can affect safety-critical behaviour. If the warning light is flashing, the engine is actively misfiring — avoid driving and arrange a tow or roadside help where possible. If the car still drives normally, keep speeds moderate and book a workshop promptly.",
  },
  medium: {
    label: "Book service",
    chip: "bg-amber-500/15 text-amber-600 ring-amber-500/40 dark:text-amber-400",
    heading: "Medium urgency — book a service",
    body: "Driving is usually possible, but the fault can worsen or cause secondary damage (fuel economy, emissions, catalysts). Avoid sustained heavy loads and schedule an inspection soon.",
  },
  low: {
    label: "Low urgency",
    chip: "bg-sky-500/15 text-sky-600 ring-sky-500/40 dark:text-sky-400",
    heading: "Low urgency — no immediate safety concern",
    body: "This code typically affects emissions, economy or comfort rather than safety. It can still be worth fixing promptly — a small leak or failing sensor rarely gets better on its own.",
  },
};

export function generateStaticParams() {
  return listDtcCodes().map((code) => ({ code }));
}

export async function generateMetadata({ params }: ObdCodePageProps): Promise<Metadata> {
  const { code } = await params;
  const entry = lookupDtc(code);
  if (!entry) return { title: "Not found" };

  const costLine = (() => {
    const top = estimateDtcCosts(entry).estimates[0];
    return top ? formatCostRange(top) : null;
  })();

  return {
    title: `${entry.code} Code Meaning, Causes & Repair Cost`,
    description: `What does the ${entry.code} OBD-II code mean? Plain-English explanation, the most common causes,${costLine ? ` typical repair cost (${costLine})` : ""} and whether it's safe to keep driving.`,
    alternates: { canonical: `/obd-codes/${entry.code}` },
  };
}

export default async function ObdCodePage({ params }: ObdCodePageProps) {
  const { code } = await params;
  const entry = lookupDtc(code);
  if (!entry) notFound();

  const urgency = URGENCY_META[entry.urgency];
  const costs = estimateDtcCosts(entry);
  const related = relatedDtcCodes(entry.code);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "OBD-II codes",
        item: `${SITE_URL}/obd-codes`,
      },
      { "@type": "ListItem", position: 3, name: entry.code },
    ],
  };

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
        <Link href="/obd-codes" className="transition-colors hover:text-brand">
          OBD-II codes
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden />
        <span aria-current="page" className="font-medium text-foreground">
          {entry.code}
        </span>
      </nav>

      {/* ------------------------------------------------ Hero */}
      <section className="glass-panel card-lift rounded-2xl p-6 sm:p-8" aria-labelledby="dtc-h1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-brand/15 px-2.5 py-1 font-mono text-sm font-bold text-brand ring-1 ring-inset ring-brand/25">
            {entry.code}
          </span>
          <span className="text-xs font-medium text-muted">{entry.system}</span>
          <span
            className={cn(
              "ml-auto rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
              urgency.chip
            )}
          >
            {urgency.label}
          </span>
        </div>
        <h1
          id="dtc-h1"
          className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          {entry.description}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {entry.advice}
        </p>
        <Link
          href={`/diagnose?dtc=${encodeURIComponent(entry.code)}`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          <Stethoscope className="h-4 w-4" aria-hidden />
          Get a free AI reading of my exact symptoms
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <p className="mt-3 text-xs text-muted">
          Free · no account · answer in your language — powered by the {entry.code} reference and
          your vehicle details.
        </p>
      </section>

      {/* ------------------------------------------------ What it means */}
      <section aria-labelledby="meaning-heading" className={sectionClass}>
        <h2 id="meaning-heading" className={sectionHeadingClass}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-inset ring-brand/20">
            <ScanLine className="h-4 w-4" aria-hidden />
          </span>
          What does {entry.code} mean?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          {entry.code} is a {entry.system.toLowerCase()} diagnostic trouble code. It means{" "}
          {entry.description.charAt(0).toLowerCase() + entry.description.slice(1)} The code is
          stored by the vehicle&apos;s control module when that system reports an out-of-range
          reading — it points at the system to inspect, not at a single faulty part.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          The leading <span className="font-mono text-zinc-100">{entry.code[0]}</span> means this
          is a{" "}
          {entry.code[0] === "P"
            ? "powertrain"
            : entry.code[0] === "C"
              ? "chassis"
              : entry.code[0] === "B"
                ? "body"
                : "network (CAN bus)"}{" "}
          code, and the remaining digits narrow it down to the specific test that failed.
        </p>
      </section>

      {/* ------------------------------------------------ Common causes */}
      <section aria-labelledby="causes-heading" className={sectionClass}>
        <h2 id="causes-heading" className={sectionHeadingClass}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-inset ring-brand/20">
            <ListChecks className="h-4 w-4" aria-hidden />
          </span>
          Common causes of {entry.code}
        </h2>
        <ul className="mt-3 space-y-2">
          {entry.possibleCauses.map((cause, index) => (
            <li key={index} className="flex items-start gap-2.5 text-sm text-zinc-300">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/70"
                aria-hidden
              />
              {cause}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          A stored code can have several causes, and the same code can behave differently across
          makes and models. A qualified workshop scan confirms which of these actually applies to
          your vehicle.
        </p>
      </section>

      {/* ------------------------------------------------ Repair costs */}
      <section aria-labelledby="costs-heading" className={sectionClass}>
        <h2 id="costs-heading" className={sectionHeadingClass}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-inset ring-brand/20">
            <CircleDollarSign className="h-4 w-4" aria-hidden />
          </span>
          Typical repair cost for {entry.code}
        </h2>
        {costs.isEmergency ? (
          <p className="mt-3 text-sm text-red-500">
            This situation involves genuine emergency indicators — stop safely and seek professional
            help rather than relying on a cost estimate.
          </p>
        ) : (
          <>
            <ul className="mt-3 space-y-2">
              {costs.estimates.map((estimate) => (
                <li
                  key={estimate.label}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg border border-zinc-700/70 bg-zinc-900/50 px-3.5 py-2.5"
                >
                  <span className="text-sm text-zinc-300">{estimate.label}</span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    {formatCostRange(estimate)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-muted">{COST_DISCLAIMER}</p>
          </>
        )}
      </section>

      {/* ------------------------------------------------ Safe to drive */}
      <section
        aria-labelledby="safety-heading"
        className={cn(
          sectionClass,
          "border-l-[3px]",
          entry.urgency === "high"
            ? "border-l-red-500/70"
            : entry.urgency === "medium"
              ? "border-l-amber-500/70"
              : "border-l-sky-500/70"
        )}
      >
        <h2 id="safety-heading" className={sectionHeadingClass}>
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset",
              entry.urgency === "high"
                ? "bg-red-500/10 text-red-500 ring-red-500/25"
                : entry.urgency === "medium"
                  ? "bg-amber-500/10 text-amber-500 ring-amber-500/25"
                  : "bg-sky-500/10 text-sky-500 ring-sky-500/25"
            )}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </span>
          {urgency.heading}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{urgency.body}</p>
        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-caution" aria-hidden />
          Red warning lights, smoke, fuel smell, overheating, or brake and steering trouble always
          mean stop safely and contact roadside assistance — regardless of the stored code.
        </p>
      </section>

      {/* ------------------------------------------------ Related codes */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className={sectionClass}>
          <h2 id="related-heading" className={sectionHeadingClass}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-inset ring-brand/20">
              <Wrench className="h-4 w-4" aria-hidden />
            </span>
            Codes related to {entry.code}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {related.map((relatedCode) => {
              const relatedEntry = lookupDtc(relatedCode);
              if (!relatedEntry) return null;
              return (
                <li key={relatedCode}>
                  <Link
                    href={`/obd-codes/${relatedCode}`}
                    className="group inline-flex items-center gap-2 rounded-full border border-zinc-700/80 px-3 py-1.5 text-xs transition-colors hover:border-brand/60 hover:text-brand"
                  >
                    <span className="font-mono font-bold">{relatedCode}</span>
                    <span className="max-w-44 truncate text-muted group-hover:text-brand/80">
                      {relatedEntry.description}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ------------------------------------------------ Bottom CTA */}
      <section className="glass-panel rounded-2xl p-6 text-center sm:p-8">
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Not sure {entry.code} applies to your car?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Describe your vehicle and symptoms — {APP_NAME} returns a safety-first reading with a
          risk level, safe checks and a printable report for your mechanic. Free, no account.
        </p>
        <Link
          href={`/diagnose?dtc=${encodeURIComponent(entry.code)}`}
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
          __html: JSON.stringify(breadcrumbSchema)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e"),
        }}
      />
    </div>
  );
}
