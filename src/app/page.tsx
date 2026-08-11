import Link from "next/link";
import {
  ArrowRight,
  Camera,
  ClipboardList,
  FileText,
  Globe2,
  Lock,
  MessageSquareText,
  ScanSearch,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { buttonClassNames } from "@/components/ui/button";
import { EmergencyAlert } from "@/components/emergency-alert";
import { Reveal } from "@/components/reveal";
import { SampleReport } from "@/components/sample-report";
import { ResponsiveHeroBanner } from "@/components/ui/responsive-hero-banner";
import { LANGUAGES, RISK_LEVELS, RISK_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Tell us what happened",
    text: "Enter your vehicle details and describe the symptoms you notice — warning light, sound, smell or behaviour.",
  },
  {
    icon: Camera,
    title: "Add a dashboard photo (optional)",
    text: "Attach a photo of the warning light. It helps the analysis, but is never required.",
  },
  {
    icon: ShieldCheck,
    title: "Get a safety-first next step",
    text: "Receive a clear risk level, safe checks, questions for your mechanic and a copyable report.",
  },
];

/** Value grid — asymmetric bento, with the safety tile as the featured cell. */
const VALUE_ITEMS = [
  {
    icon: Globe2,
    title: "Multilingual guidance",
    text: `Answers in ${LANGUAGES.join(", ")} — whatever language you speak.`,
  },
  {
    icon: FileText,
    title: "Mechanic-ready report",
    text: "A copyable, printable hand-off summary you can share with a workshop.",
  },
  {
    icon: Lock,
    title: "Private browser history",
    text: "Your reports stay in this browser. No account required.",
  },
  {
    icon: ScanSearch,
    title: "Fault-code lookup",
    text: "Paste an OBD-II code for an instant plain-English explanation.",
  },
];

const REPORT_INCLUDES = [
  { icon: ShieldCheck, text: "A clear risk level and safe checks" },
  { icon: Wrench, text: "Possible causes with likelihood" },
  { icon: MessageSquareText, text: "Questions to ask your mechanic" },
  { icon: FileText, text: "A copyable, printable hand-off" },
];

export default function HomePage() {
  return (
    <div className="overflow-x-clip">
      {/* ------------------------------------------------ Hero — full-bleed, own nav */}
      <ResponsiveHeroBanner />

      {/* Rest of the page — back inside the standard container */}
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
        {/* ------------------------------------------------ Emergency */}
        <Reveal className="mt-10">
          <EmergencyAlert />
        </Reveal>

        {/* ------------------------------------------------ How it works */}
        <Reveal stagger className="mt-24">
          <section aria-labelledby="how-it-works-heading">
            <div className="text-center">
              <p className="eyebrow">The process</p>
            </div>
            <h2
              id="how-it-works-heading"
              className="mt-3 text-center font-serif text-4xl tracking-tight text-white sm:text-5xl"
            >
              Three steps to a safer next move
            </h2>
            <ol className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="glass-panel card-lift group rounded-2xl p-6 text-center"
                >
                  <span className="font-serif text-4xl text-amber-400/80" aria-hidden>
                    0{index + 1}
                  </span>
                  <span className="mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 transition-colors duration-200 group-hover:bg-amber-500/20">
                    <step.icon className="h-5 w-5 text-amber-400" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-zinc-100">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.text}</p>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>

        {/* ------------------------------------------------ Value bento */}
        <Reveal stagger className="mt-24">
          <section aria-label="What you get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Featured cell — the safety promise, with the real risk levels */}
            <div className="card-glow glass-panel relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/15 via-transparent to-transparent p-6 sm:col-span-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                <ShieldCheck className="h-5 w-5 text-amber-400" aria-hidden />
              </span>
              <h2 className="mt-3 text-sm font-semibold text-zinc-50">Safety comes first</h2>
              <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-zinc-300">
                Every result is rated by risk level, with safe checks, questions for your mechanic
                and a hand-off you can print.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {RISK_LEVELS.map((level) => {
                  const meta = RISK_META[level];
                  return (
                    <span
                      key={level}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${meta.badgeClasses}`}
                    >
                      {meta.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {VALUE_ITEMS.map((item) => (
              <div
                key={item.title}
                className="glass-panel card-lift group rounded-2xl p-5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15 transition-colors duration-200 group-hover:bg-amber-500/20">
                  <item.icon className="h-5 w-5 text-amber-400" aria-hidden />
                </span>
                <h2 className="mt-3 text-sm font-semibold text-zinc-100">{item.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{item.text}</p>
              </div>
            ))}
          </section>
        </Reveal>

        {/* ------------------------------------------------ Sample report (split) */}
        <section id="sample-report" aria-labelledby="sample-report-heading" className="mt-24 scroll-mt-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="eyebrow">A real output</p>
              <h2
                id="sample-report-heading"
                className="mt-3 font-serif text-4xl tracking-tight text-white sm:text-5xl"
              >
                See what a report looks like
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
                A real output from the diagnostic flow, generated from your vehicle details and
                symptoms — not a template.
              </p>
              <ul className="mt-6 space-y-3">
                {REPORT_INCLUDES.map((item) => (
                  <li key={item.text} className="flex items-center gap-3 text-sm text-zinc-300">
                    <span className="glass-chip flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                      <item.icon className="h-4 w-4 text-amber-400" aria-hidden />
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SampleReport />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ Free tools strip */}
        <Reveal stagger className="mt-24">
          <section aria-labelledby="tools-heading">
            <div className="text-center">
              <p className="eyebrow">Always free</p>
            </div>
            <h2
              id="tools-heading"
              className="mt-3 text-center font-serif text-4xl tracking-tight text-white sm:text-5xl"
            >
              More free tools, no sign-up
            </h2>
            <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
              <Link
                href="/vin"
                className="glass-panel card-lift group block rounded-2xl p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15 transition-colors duration-200 group-hover:bg-amber-500/20">
                  <ScanSearch className="h-5 w-5 text-amber-400" aria-hidden />
                </span>
                <h3 className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                  Decode a VIN
                  <ArrowRight
                    className="h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                  Validate a 17-character VIN and read its structure instantly — with optional NHTSA
                  vehicle details.
                </p>
              </Link>
              <Link
                href="/workshops"
                className="glass-panel card-lift group block rounded-2xl p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15 transition-colors duration-200 group-hover:bg-amber-500/20">
                  <Wrench className="h-5 w-5 text-amber-400" aria-hidden />
                </span>
                <h3 className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                  Find a workshop
                  <ArrowRight
                    className="h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                  Car-repair workshops near you, with distance and directions — from free
                  OpenStreetMap data.
                </p>
              </Link>
            </div>
          </section>
        </Reveal>

        {/* ------------------------------------------------ Closing CTA */}
        <Reveal className="mt-24">
          <section className="glass-panel relative overflow-hidden rounded-2xl p-8 text-center sm:p-14">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.12),transparent_60%)]"
            />
            <Wrench className="mx-auto h-8 w-8 text-amber-400" aria-hidden />
            <h2 className="mt-4 font-serif text-4xl tracking-tight text-white sm:text-5xl">
              Your car is trying to tell you something.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
              Don&apos;t guess. Get a clear, safety-first reading of your warning lights and a
              printable report for your mechanic — free, in your browser.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link href="/diagnose" className={cn(buttonClassNames({ size: "lg" }), "group")}>
                Start your diagnosis
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link href="/diagnose" className={cn(buttonClassNames({ variant: "outline", size: "lg" }), "group")}>
                <ScanSearch
                  className="h-4 w-4 transition-transform duration-200 ease-out group-hover:-translate-y-0.5"
                  aria-hidden
                />
                Look up an OBD-II code
              </Link>
            </div>
            <p className="mx-auto mt-6 max-w-xl text-xs leading-relaxed text-zinc-500">
              Emergencies first: red light, smoke, fuel smell, or braking trouble — stop safely and
              call for help.
            </p>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
