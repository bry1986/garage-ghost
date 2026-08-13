import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CarFront, ScanLine, Stethoscope } from "lucide-react";
import { Disclosure } from "@/components/ui/disclosure";
import { formatCostRange, topRepairEstimate } from "@/lib/costs";
import { listDtcEntries, type DtcEntry, type DtcUrgency } from "@/lib/dtc";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "OBD-II Codes — Meanings, Causes & Repair Costs",
  description:
    "Free OBD-II (OBD2) trouble code reference: what P0420, P0300, P0171 and 38 more codes mean, common causes, typical repair costs, and whether it's safe to drive.",
  alternates: { canonical: "/obd-codes" },
};

const CODE_LETTERS: Record<string, { label: string; blurb: string }> = {
  P: {
    label: "Powertrain",
    blurb:
      "Engine, fuel, ignition, emissions, transmission and charging systems — the most common codes a generic scanner reports.",
  },
  C: {
    label: "Chassis",
    blurb:
      "Brakes, ABS, steering and suspension. A C code often disables stability systems even when normal braking still works.",
  },
  B: {
    label: "Body",
    blurb:
      "Body control systems — battery voltage, lighting, door locks and interior modules.",
  },
  U: {
    label: "Network",
    blurb:
      "Vehicle network (CAN bus) communication. Lost communication with a module can accompany no-start or loss of dash functions.",
  },
};

const URGENCY_META: Record<DtcUrgency, { label: string; dot: string }> = {
  high: { label: "Act promptly", dot: "bg-red-500" },
  medium: { label: "Book service", dot: "bg-amber-500" },
  low: { label: "Low urgency", dot: "bg-sky-500" },
};

const HUB_FAQ = [
  {
    question: "What is an OBD-II code?",
    answer:
      "OBD-II (On-Board Diagnostics, second generation) is the standardized self-diagnostic system in vehicles from 1996 onward. When a sensor or system reports a fault, the engine control unit stores a five-character Diagnostic Trouble Code — one letter and four digits — and usually turns on the check engine light. A code points at the system a fault was recorded in; it is never a complete diagnosis.",
  },
  {
    question: "How do I read an OBD-II code?",
    answer:
      "The first letter tells you the system: P = Powertrain (engine, fuel, emissions, transmission), C = Chassis (brakes, ABS, suspension), B = Body (interior and body modules), U = Network (CAN bus communication). The first digit after the letter identifies the subsystem — for example P0xxx are generic/standard codes, while P1xxx are manufacturer-specific.",
  },
  {
    question: "Can I drive with a check engine light?",
    answer:
      "It depends on the code and how the car behaves. If the light is flashing, the engine is actively misfiring and driving can damage the catalytic converter — stop and get it scanned. If the car runs normally, a steady light is usually drivable for a short time, but have it diagnosed soon. Red warning lights, smoke, fuel smell, or brake/steering trouble always mean stop safely and call for help.",
  },
  {
    question: "Are these pages a diagnosis?",
    answer:
      "No. Every page here is educational guidance about what a code commonly means. A stored code can have several causes, and the same code can behave differently on different vehicles. Always confirm with a qualified workshop scan — ideally using the printed report this site can generate for you.",
  },
];

/** Group entries by their leading letter, in first-seen order. */
function groupByLetter(entries: DtcEntry[]) {
  const groups = new Map<string, DtcEntry[]>();
  for (const entry of entries) {
    const letter = entry.code[0];
    const bucket = groups.get(letter) ?? [];
    bucket.push(entry);
    groups.set(letter, bucket);
  }
  return [...groups.entries()];
}

export default function ObdCodesPage() {
  const entries = listDtcEntries();

  const faqSchema = HUB_FAQ.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer.replace(/\n+/g, " ") },
  }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 pb-16">
      {/* ------------------------------------------------ Hero */}
      <section className="glass-panel card-lift rounded-2xl p-6 sm:p-8" aria-labelledby="obd-codes-h1">
        <p className="eyebrow">Free OBD-II reference</p>
        <h1
          id="obd-codes-h1"
          className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          OBD-II Codes — Meanings, Causes &amp; Repair Costs
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          A plain-English guide to the most common diagnostic trouble codes (DTCs). For each code:
          what it means, the usual causes, a typical repair-cost range, and whether it is safe to
          keep driving. Free — no account, no paywall.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/diagnose" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong">
            <Stethoscope className="h-4 w-4" aria-hidden />
            Diagnose my symptoms
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <span className="inline-flex items-center gap-2 text-xs text-muted">
            <ScanLine className="h-4 w-4 text-brand" aria-hidden />
            Have a code? Look it up below or paste it into a diagnosis.
          </span>
        </div>
      </section>

      {/* ------------------------------------------------ Letter groups */}
      {groupByLetter(entries).map(([letter, letterEntries]) => {
        const meta = CODE_LETTERS[letter];
        return (
          <section key={letter} aria-labelledby={`group-${letter}`}>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-2xl font-bold text-brand">{letter}</span>
              <div>
                <h2 id={`group-${letter}`} className="font-display text-xl font-bold tracking-tight text-foreground">
                  {meta.label} codes
                </h2>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{meta.blurb}</p>
              </div>
            </div>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {letterEntries.map((entry) => {
                const topCost = (() => {
                  const top = topRepairEstimate(entry);
                  return top ? formatCostRange(top) : null;
                })();
                return (
                  <li key={entry.code}>
                    <Link
                      href={`/obd-codes/${entry.code}`}
                      className="card-surface card-lift group flex h-full flex-col gap-2 rounded-2xl p-4"
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-brand">{entry.code}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                          {entry.system}
                        </span>
                        <span
                          aria-hidden
                          className={cn("ml-auto h-1.5 w-1.5 rounded-full", URGENCY_META[entry.urgency].dot)}
                        />
                        <span className="sr-only">{URGENCY_META[entry.urgency].label}</span>
                      </span>
                      <span className="text-sm font-medium text-foreground">{entry.description}</span>
                      <span className="mt-auto text-xs text-muted">
                        {topCost ? (
                          <>
                            Est. repair: <span className="font-semibold text-foreground">{topCost}</span>
                          </>
                        ) : (
                          "Cost varies — see the code page"
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {/* ------------------------------------------------ Cross-link to guides */}
      <section className="card-surface flex flex-col items-start justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
            Not sure which light turned on?
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
            The warning-light guides explain what the brake, check engine, oil, battery and other
            dashboard lights mean — and what to do before the code even matters.
          </p>
        </div>
        <Link
          href="/guides"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-brand/60 hover:text-brand"
        >
          <CarFront className="h-4 w-4 text-brand" aria-hidden />
          Warning-light guides
        </Link>
      </section>

      {/* ------------------------------------------------ FAQ */}
      <section aria-labelledby="obd-faq-heading" className="max-w-3xl">
        <p className="eyebrow">Good to know</p>
        <h2 id="obd-faq-heading" className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">
          OBD-II FAQ
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
        Codes shown are a curated subset of the most common OBD-II faults — not a full database. A
        stored code points at the system a fault was recorded in, and the same code can have several
        causes. These pages are educational guidance only, not a diagnosis and not a substitute for a
        qualified mechanic.
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
