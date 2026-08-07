import Link from "next/link";
import { ArrowRight, History, Wrench } from "lucide-react";
import { EmergencyAlert } from "@/components/emergency-alert";
import {
  APP_NAME,
  APP_TAGLINE,
  LANGUAGES,
  PRIMARY_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
} from "@/lib/constants";

const STEPS = [
  {
    title: "Tell us about the vehicle",
    text: "Brand, model and year, plus optional details like fuel type or mileage.",
  },
  {
    title: "Describe the symptoms",
    text: "What do you see or hear, when, and how often? Use quick chips and optionally attach a photo of a warning light.",
  },
  {
    title: "Get safe next steps",
    text: "Receive a risk level, safe checks, questions for the mechanic and a copyable report.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section className="pb-4 pt-10 text-center sm:pt-16">
        <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10">
          <Wrench className="h-7 w-7 text-amber-400" aria-hidden />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
          {APP_NAME}
        </h1>
        <p className="mt-3 text-base font-medium text-amber-400 sm:text-lg">{APP_TAGLINE}</p>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Describe what your vehicle is telling you and get clear, educational guidance on warning
          lights, unusual sounds, smells and behaviour — plus safe checks, questions for your
          mechanic, and a mechanic-ready report.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/diagnose" className={PRIMARY_BUTTON_CLASSES}>
            Diagnose my warning <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/history" className={SECONDARY_BUTTON_CLASSES}>
            <History className="h-4 w-4" aria-hidden />
            My saved reports
          </Link>
        </div>
      </section>

      <EmergencyAlert />

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-400">
            What this is
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            A safety-first triage aid. It turns your description into educational guidance:
            possible causes, safe checks you can do without tools, questions to answer or ask, and
            a report to hand to a qualified mechanic.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            What this is not
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            Not a professional diagnosis. It cannot inspect your vehicle and must never replace a
            qualified mechanic, workshop, or roadside assistance in an emergency.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-50">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-sm font-bold text-amber-400">
                {index + 1}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-zinc-100">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-zinc-500">
          Available in {LANGUAGES.join(", ")}.
        </p>
      </section>

      <section className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-zinc-50">A warning light on? Start here.</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400">
          If the situation is dangerous, stop safely and call for help first — then use Garage
          Ghost to understand the warning.
        </p>
        <Link href="/diagnose" className={`${PRIMARY_BUTTON_CLASSES} mt-5`}>
          Analyze safely
        </Link>
      </section>
    </div>
  );
}
