import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Camera,
  ClipboardList,
  FileSearch,
  Globe2,
  Gauge,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { EmergencyAlert } from "@/components/emergency-alert";
import { InstrumentCluster } from "@/components/instrument-cluster";
import { ProPricingSection } from "@/components/pro-pricing";
import { SampleReport } from "@/components/sample-report";
import { APP_NAME, APP_TAGLINE, LANGUAGES } from "@/lib/constants";

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

const TRUST_ITEMS = [
  {
    icon: BookOpen,
    title: "Educational guidance",
    text: "General information to help you understand the warning — not a diagnosis.",
  },
  {
    icon: Globe2,
    title: "Multilingual",
    text: `Answers in ${LANGUAGES.join(", ")}.`,
  },
  {
    icon: Lock,
    title: "Privacy-first",
    text: "Your reports stay in this browser. No account required.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16 overflow-x-clip pb-4">
      {/* ------------------------------------------------ Hero */}
      <section aria-labelledby="hero-heading" className="grid items-center gap-10 lg:grid-cols-2 lg:gap-8">
        <div>
          <div className="hero-rise inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
            <Gauge className="h-3.5 w-3.5" aria-hidden />
            Safety-first AI triage
          </div>
          <h1
            id="hero-heading"
            className="hero-rise mt-5 font-display text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl"
            style={{ animationDelay: "0.05s" }}
          >
            {APP_NAME}
          </h1>
          <p
            className="hero-rise mt-3 text-lg font-medium text-amber-400"
            style={{ animationDelay: "0.1s" }}
          >
            {APP_TAGLINE}
          </p>
          <p
            className="hero-rise mt-4 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base"
            style={{ animationDelay: "0.15s" }}
          >
            Describe what your vehicle is telling you and get clear, educational guidance on warning
            lights, unusual sounds, smells and behaviour — plus safe checks, questions for your
            mechanic, and a mechanic-ready report.
          </p>
          <div
            className="hero-rise mt-8 flex flex-col gap-3 sm:flex-row"
            style={{ animationDelay: "0.2s" }}
          >
            <Link
              href="/diagnose"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
            >
              Start a safe assessment
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href="#sample-report"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
            >
              <FileSearch className="h-4 w-4" aria-hidden />
              View a sample report
            </a>
          </div>
        </div>

        <div className="hero-rise" style={{ animationDelay: "0.25s" }}>
          <InstrumentCluster />
        </div>
      </section>

      {/* ------------------------------------------------ Emergency */}
      <EmergencyAlert />

      {/* ------------------------------------------------ Trust strip */}
      <section aria-label="What this is" className="grid gap-4 sm:grid-cols-3">
        {TRUST_ITEMS.map((item) => (
          <div key={item.title} className="card-surface p-5">
            <item.icon className="h-5 w-5 text-amber-400" aria-hidden />
            <h2 className="mt-3 text-sm font-semibold text-zinc-100">{item.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{item.text}</p>
          </div>
        ))}
      </section>

      {/* ------------------------------------------------ How it works */}
      <section aria-labelledby="how-it-works-heading">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
            How it works
          </p>
          <h2 id="how-it-works-heading" className="mt-2 font-display text-2xl font-bold tracking-tight text-zinc-50">
            Three steps to a safer next move
          </h2>
        </div>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card-surface relative p-6">
              <span
                className="absolute right-4 top-4 font-mono text-xs font-bold text-zinc-600"
                aria-hidden
              >
                0{index + 1}
              </span>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10">
                <step.icon className="h-5 w-5 text-amber-400" aria-hidden />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-zinc-100">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------ Sample report */}
      <section id="sample-report" aria-label="Sample report" className="scroll-mt-24">
        <SampleReport />
      </section>

      {/* ------------------------------------------------ Pro teaser */}
      <ProPricingSection />

      {/* ------------------------------------------------ Final CTA */}
      <section className="card-surface border-amber-500/30 bg-amber-500/5 p-8 text-center">
        <h2 className="font-display text-xl font-bold text-zinc-50">
          A warning light on? Start here.
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400">
          If the situation is dangerous, stop safely and call for help first — then use{" "}
          {APP_NAME} to understand the warning.
        </p>
        <Link
          href="/diagnose"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
        >
          Start a safe assessment
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
