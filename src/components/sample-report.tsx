import { AlertTriangle, CheckCircle2, Wrench, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SAMPLE = {
  vehicle: "Audi A3, 2017, Diesel, 145,000 km",
  detectedWarning: "Engine management light (amber)",
  summary:
    "The amber engine-management light combined with reduced power above 2,500 RPM is typically a drivetrain/management issue rather than an emergency — but a fault scan is needed to pinpoint it. Drive carefully and book a workshop inspection.",
  causes: [
    { cause: "Faulty sensor or actuator reported by the engine control unit", likelihood: "Medium" },
    { cause: "Worn spark plugs or ignition components", likelihood: "Medium" },
  ],
  safeChecks: ["Note when the symptom first appeared and at which speed.", "Check that the fuel cap is properly closed."],
  doNotDo: ["Do not keep driving hard if power loss increases or the light flashes."],
};

/**
 * A compact, static sample report shown on the landing page. Educational
 * preview only — the real flow produces the full interactive report.
 */
export function SampleReport() {
  return (
    <section
      aria-labelledby="sample-report-card-heading"
      className="card-surface max-w-xl p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="sample-report-card-heading" className="font-display text-sm font-semibold text-zinc-100">
          Sample report
        </h2>
        <Badge variant="brand">BOOK SERVICE</Badge>
      </div>
      <p className="mt-1 text-xs text-zinc-500">{SAMPLE.vehicle}</p>

      <p className="mt-4 text-sm font-medium text-zinc-200">{SAMPLE.detectedWarning}</p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{SAMPLE.summary}</p>

      <div className="mt-5">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          <Wrench className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
          Possible causes
        </h3>
        <ul className="mt-2 space-y-2">
          {SAMPLE.causes.map((cause) => (
            <li
              key={cause.cause}
              className="flex items-center justify-between gap-3 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-300"
            >
              <span>{cause.cause}</span>
              <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                {cause.likelihood}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
            Safe checks
          </h3>
          <ul className="mt-2 space-y-1.5">
            {SAMPLE.safeChecks.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-zinc-400">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-500" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            <XCircle className="h-3.5 w-3.5 text-red-400" aria-hidden />
            Do not do
          </h3>
          <ul className="mt-2 space-y-1.5">
            {SAMPLE.doNotDo.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-zinc-400">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-500" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-5 flex items-start gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 p-3 text-[11px] leading-relaxed text-zinc-500">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
        <span>
          Example for illustration only. Your report will be generated from your vehicle details and
          description by the AI analysis.
        </span>
      </p>
    </section>
  );
}
