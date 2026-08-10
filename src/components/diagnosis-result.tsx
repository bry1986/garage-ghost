"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clipboard,
  Crown,
  HelpCircle,
  Info,
  Loader2,
  MessageCircle,
  OctagonAlert,
  Printer,
  RotateCcw,
  Send,
  ShieldAlert,
  Wrench,
  XCircle,
} from "lucide-react";
import { Disclosure } from "@/components/ui/disclosure";
import { Button } from "@/components/ui/button";
import { FixedDisclaimer } from "@/components/fixed-disclaimer";
import { CONFIDENCE_LABEL, DISCLAIMER, RISK_META, safeRiskLevel } from "@/lib/constants";
import {
  COST_DISCLAIMER,
  estimateRepairCosts,
  formatCostRange,
  type RepairCostEstimateResult,
} from "@/lib/costs";
import { askFollowUp, describePuterError } from "@/lib/diagnosis";
import { usePro } from "@/components/pro-provider";
import { consumeEstimate, FREE_ESTIMATES_PER_DAY, getRemainingEstimateCount } from "@/lib/pro";
import { cn } from "@/lib/utils";
import type {
  Confidence,
  DiagnosticResult,
  DiagnosisSource,
  ResponseLanguage,
  RiskLevel,
  SavedVehicle,
} from "@/types/diagnostic";

interface DiagnosisResultProps {
  result: DiagnosticResult;
  source: DiagnosisSource;
  vehicleLabel: string;
  imageNote: boolean;
  /** When provided, enables the follow-up question box. */
  vehicle?: SavedVehicle;
  symptoms?: string;
  language?: ResponseLanguage;
  /** Called when the user clicks "Start another assessment". */
  onRestart?: () => void;
  /**
   * False when viewing a report that was already generated (e.g. from history):
   * the report is always shown in full and does not count toward the free
   * 3-estimates-per-day allowance. Only freshly generated results consume quota.
   */
  consumeQuota?: boolean;
}

interface FollowUpItem {
  question: string;
  answer: string;
}

const LIKELIHOOD_CLASSES: Record<Confidence, string> = {
  low: "bg-zinc-700/40 text-zinc-400",
  medium: "bg-amber-500/15 text-amber-300",
  high: "bg-red-500/15 text-red-300",
};

/**
 * Severity band treatment per risk level. Icon + label + text always —
 * severity is never communicated by color alone. STOP_NOW uses the static
 * high-contrast treatment (never animated, role="alert").
 */
const SEVERITY_HEADER: Record<
  RiskLevel,
  {
    band: string;
    iconTile: string;
    badge: string;
    title: string;
    blurb: string;
    icon: typeof OctagonAlert;
  }
> = {
  STOP_NOW: {
    band: "border-red-500/60 bg-red-500/15",
    iconTile: "border-red-500/50 bg-red-500/20 text-red-300",
    badge: "bg-red-500 text-white",
    title: "Stop now — take this seriously",
    blurb: "Stop safely as soon as possible and call for professional help. Do not ignore this.",
    icon: OctagonAlert,
  },
  DRIVE_CAREFULLY: {
    band: "border-amber-500/50 bg-amber-500/10",
    iconTile: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    badge: "bg-amber-500 text-zinc-950",
    title: "Drive carefully",
    blurb: "Drive with care and have the vehicle checked as soon as possible.",
    icon: AlertTriangle,
  },
  BOOK_SERVICE: {
    band: "border-sky-500/50 bg-sky-500/10",
    iconTile: "border-sky-500/40 bg-sky-500/15 text-sky-300",
    badge: "bg-sky-500 text-zinc-950",
    title: "Book a service",
    blurb: "Schedule an inspection with a qualified workshop.",
    icon: CalendarClock,
  },
};

/** Numbered section heading — command-center eyebrow pattern. */
function SectionHeading({
  index,
  icon,
  title,
  iconTileClass,
}: {
  index: string;
  icon: ReactNode;
  title: string;
  iconTileClass?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-zinc-600">
        {index}
      </span>
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 text-zinc-400",
          iconTileClass
        )}
      >
        {icon}
      </span>
      <h3 className="text-sm font-semibold tracking-tight text-zinc-100">{title}</h3>
    </div>
  );
}

function buildReportText(
  result: DiagnosticResult,
  vehicleLabel: string,
  costs: RepairCostEstimateResult,
  estimatesLocked: boolean
): string {
  const costLines = costs.isEmergency
    ? ["- Not estimated — emergency situation. Stop safely and request a written quote from a workshop."]
    : estimatesLocked
      ? ["- Repair cost estimates are a Pro feature — upgrade to see them here."]
      : costs.estimates.map((item) => `- ${item.label}: ${formatCostRange(item)}`);

  const lines: string[] = [
    "Garage Ghost — Mechanic-ready report",
    `Vehicle: ${vehicleLabel}`,
    `Detected warning: ${result.detectedWarning}`,
    `Risk level: ${result.riskLevel}`,
    `Confidence: ${result.confidence}`,
    "",
    `Summary: ${result.summary}`,
    "",
    "Possible causes:",
    ...(result.possibleCauses.length > 0
      ? result.possibleCauses.map((item) => `- ${item.cause} (${item.likelihood})`)
      : ["- (none listed)"]),
    "",
    "Estimated repair cost (ballpark, USD):",
    ...costLines,
    "",
    "Safe checks:",
    ...(result.safeChecks.length > 0 ? result.safeChecks.map((item) => `- ${item}`) : ["- (none listed)"]),
    "",
    "Do not do:",
    ...(result.doNotDo.length > 0 ? result.doNotDo.map((item) => `- ${item}`) : ["- (none listed)"]),
    "",
    "Questions for the mechanic:",
    ...(result.questions.length > 0 ? result.questions.map((item) => `- ${item}`) : ["- (none listed)"]),
    "",
    "Mechanic report:",
    result.mechanicReport,
  ];
  return lines.join("\n");
}

/**
 * Print-only fallback: shown in the print/PDF output only when there is no
 * report in the DOM (prevents a blank page when the visitor prints the
 * diagnose or history page before running a diagnosis). Hidden on screen.
 */
export function PrintFallback() {
  return (
    <div className="print-report" aria-hidden>
      <h1>Garage Ghost</h1>
      <p className="print-muted">
        No report to print yet. Run a diagnosis on the Diagnose page first, then print or save
        this page as a PDF.
      </p>
      <p className="print-muted">{DISCLAIMER}</p>
    </div>
  );
}

export function DiagnosisResult({
  result,
  source,
  vehicleLabel,
  imageNote,
  vehicle,
  symptoms,
  language = "English",
  onRestart,
  consumeQuota = true,
}: DiagnosisResultProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [followUpInput, setFollowUpInput] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpStatus, setFollowUpStatus] = useState("");
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  // FIXD-style repair cost ballparks — deterministic, no AI call.
  const costs = useMemo(
    () =>
      estimateRepairCosts({
        detectedWarning: result.detectedWarning,
        summary: result.summary,
        possibleCauses: result.possibleCauses,
        riskLevel: result.riskLevel,
        symptoms,
      }),
    [result, symptoms]
  );

  const { isPro, openModal } = usePro();

  // Free tier: each freshly generated result that shows cost estimates counts
  // toward the 3/day allowance. Pro users, emergency results, and re-opened
  // reports (consumeQuota=false) are never counted or locked.
  const quotaBumped = useRef(false);
  useEffect(() => {
    if (!consumeQuota || quotaBumped.current || isPro || costs.isEmergency) return;
    quotaBumped.current = true;
    consumeEstimate();
  }, [consumeQuota, isPro, costs.isEmergency]);

  // Free users see numbers on their first 3 generated results each day, then a
  // locked state with an upgrade prompt. Emergencies always show the safety
  // message, and already-generated reports are always shown in full.
  const estimatesLocked =
    consumeQuota && !isPro && !costs.isEmergency && getRemainingEstimateCount() <= 0;

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const handleCopy = async () => {
    const text = buildReportText(result, vehicleLabel, costs, estimatesLocked);
    try {
      await navigator.clipboard.writeText(text);
      setCopyError(null);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyError("Could not copy automatically. Select the report text and copy it manually.");
    }
  };

  const handleFollowUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = followUpInput.trim();
    if (question.length === 0 || followUpLoading || !vehicle) return;
    setFollowUpLoading(true);
    setFollowUpError(null);
    setFollowUpStatus("Answering your question…");
    try {
      const answer = await askFollowUp(
        {
          vehicle,
          symptoms: symptoms ?? "",
          language,
          previousSummary: result.summary,
          question,
        },
        setFollowUpStatus
      );
      setFollowUps((prev) => [...prev, { question, answer }]);
      setFollowUpInput("");
    } catch (cause) {
      console.error("Garage Ghost follow-up failed:", cause);
      setFollowUpError(describePuterError(cause));
    } finally {
      setFollowUpLoading(false);
    }
  };

  const riskLevel = safeRiskLevel(result.riskLevel);
  const severity = SEVERITY_HEADER[riskLevel];
  const SeverityIcon = severity.icon;
  const followUpEnabled = Boolean(vehicle);

  return (
    <>
      <section
        aria-labelledby="diagnosis-result-heading"
        className={cn(
          // STOP_NOW results are never animated — the urgency must read instantly.
          riskLevel !== "STOP_NOW" && "result-rise"
        )}
      >
        {/* Double-bezel outer shell: machined-housing look without gradients */}
        <div className="rounded-[1.75rem] bg-zinc-950/60 p-1.5 ring-1 ring-white/5 sm:p-2">
          <div className="space-y-6 rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-6">
            {/* ----------------------- Header ----------------------- */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10">
                  <ShieldAlert className="h-4.5 w-4.5 text-amber-400" aria-hidden />
                </span>
                <div>
                  <h2
                    id="diagnosis-result-heading"
                    className="font-display text-lg font-bold tracking-tight text-zinc-50"
                  >
                    Assessment
                  </h2>
                  <p className="mt-0.5 text-sm text-zinc-400">{vehicleLabel}</p>
                </div>
              </div>
              {onRestart && (
                <Button type="button" onClick={onRestart} variant="outline" size="sm">
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  Start another assessment
                </Button>
              )}
            </div>

            {source === "demo" && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-amber-200">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>
                  <span className="font-semibold">Demo mode:</span> this result was generated
                  locally for testing and is not an AI analysis. Set{" "}
                  <code className="rounded bg-zinc-900 px-1">NEXT_PUBLIC_DEMO_MODE</code> to{" "}
                  <code className="rounded bg-zinc-900 px-1">false</code> to use Puter.
                </p>
              </div>
            )}

            {imageNote && (
              <div className="flex items-start gap-2 rounded-xl border border-zinc-700 bg-zinc-800/50 p-3 text-sm text-zinc-300">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                <p>
                  A photo was attached and was included alongside your written description.
                  Visual identification is not guaranteed — treat it as a hint, not a certain
                  diagnosis.
                </p>
              </div>
            )}

            {/* ----------------------- Severity hero band ----------------------- */}
            <div
              role={riskLevel === "STOP_NOW" ? "alert" : "status"}
              className={cn("rounded-2xl border-2 p-4 sm:p-5", severity.band)}
            >
              <div className="flex flex-wrap items-start gap-4">
                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border",
                    severity.iconTile
                  )}
                >
                  <SeverityIcon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                        severity.badge
                      )}
                    >
                      {RISK_META[riskLevel].label}
                    </span>
                    <p className="text-sm font-bold text-zinc-50">{severity.title}</p>
                  </div>
                  <p className="mt-2 font-display text-base font-bold tracking-tight text-zinc-100 sm:text-lg">
                    {result.detectedWarning}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    {CONFIDENCE_LABEL[result.confidence]}
                  </p>
                  <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-zinc-300/90">
                    {severity.blurb}
                  </p>
                </div>
              </div>
            </div>

            {/* ----------------------- Bento grid ----------------------- */}
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-12">
              {/* Summary */}
              <div className="lg:col-span-12">
                <SectionHeading
                  index="01"
                  icon={<Info className="h-3.5 w-3.5" aria-hidden />}
                  title="Summary"
                />
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">{result.summary}</p>
              </div>

              {/* Possible causes */}
              {result.possibleCauses.length > 0 && (
                <div className="lg:col-span-7">
                  <Disclosure
                    title="Possible causes"
                    icon={<Wrench className="h-4 w-4 text-zinc-400" aria-hidden />}
                    defaultOpen
                    buttonLabel="Show or hide possible causes"
                  >
                    <ul className="space-y-2">
                      {result.possibleCauses.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-300 transition-colors duration-200 hover:border-zinc-700"
                        >
                          <span>{item.cause}</span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              LIKELIHOOD_CLASSES[item.likelihood]
                            )}
                          >
                            {item.likelihood}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Disclosure>
                </div>
              )}

              {/* Estimated repair cost */}
              <div className="lg:col-span-5">
                <div className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                  <SectionHeading
                    index="02"
                    icon={<CircleDollarSign className="h-3.5 w-3.5 text-emerald-400" aria-hidden />}
                    title="Estimated repair cost"
                  />
                  {costs.isEmergency ? (
                    <div className="mt-3 flex-1 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                      <p className="flex items-start gap-2">
                        <OctagonAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        <span>
                          This is an emergency — stop safely first. Cost estimates are not
                          helpful here: get the vehicle to a workshop and ask for a written
                          quote.
                        </span>
                      </p>
                    </div>
                  ) : estimatesLocked ? (
                    <div className="mt-3 flex-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                      <p className="flex items-start gap-2 text-sm text-amber-200">
                        <Crown className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        <span>
                          <span className="font-semibold">
                            You&apos;ve used your free estimates for today.
                          </span>{" "}
                          Upgrade to Pro for unlimited repair cost estimates.
                        </span>
                      </p>
                      <Button type="button" onClick={openModal} size="sm" className="mt-3">
                        <Crown className="h-3.5 w-3.5" aria-hidden />
                        Go Pro
                      </Button>
                    </div>
                  ) : (
                    <>
                      <ul className="mt-3 flex-1 space-y-2">
                        {costs.estimates.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300 transition-colors duration-200 hover:border-emerald-500/30"
                          >
                            <span>{item.label}</span>
                            <span className="shrink-0 font-mono text-sm font-bold text-amber-300">
                              {formatCostRange(item)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {costs.isFallback && (
                        <p className="mt-2 text-xs text-zinc-500">
                          No specific repair matched your issue yet — this is a broad estimate.
                        </p>
                      )}
                      <p className="mt-2 text-xs text-zinc-500">{COST_DISCLAIMER}</p>
                      {!isPro && consumeQuota && (
                        <p className="mt-1 text-xs text-zinc-500">
                          Free plan: {FREE_ESTIMATES_PER_DAY} estimates per day ·{" "}
                          <button
                            type="button"
                            onClick={openModal}
                            className="font-medium text-amber-400 underline-offset-2 hover:underline"
                          >
                            Go Pro for unlimited
                          </button>
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Safe checks */}
              {result.safeChecks.length > 0 && (
                <div className="lg:col-span-6">
                  <Disclosure
                    title="Safe checks you can do"
                    icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden />}
                    defaultOpen
                    buttonLabel="Show or hide safe checks"
                  >
                    <ul className="space-y-2">
                      {result.safeChecks.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-zinc-300">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Disclosure>
                </div>
              )}

              {/* Do not do — always visible, red treatment */}
              {result.doNotDo.length > 0 && (
                <div className="lg:col-span-6">
                  <div className="flex h-full flex-col rounded-xl border border-red-500/40 bg-red-500/5 p-4">
                    <SectionHeading
                      index="03"
                      icon={<XCircle className="h-3.5 w-3.5" aria-hidden />}
                      title="Do not do"
                      iconTileClass="border-red-500/40 bg-red-500/10 text-red-300"
                    />
                    <ul className="mt-3 flex-1 space-y-2">
                      {result.doNotDo.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-zinc-300">
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Questions */}
              {result.questions.length > 0 && (
                <div className="lg:col-span-12">
                  <Disclosure
                    title="Questions to answer or ask a mechanic"
                    icon={<HelpCircle className="h-4 w-4 text-sky-400" aria-hidden />}
                    buttonLabel="Show or hide questions for the mechanic"
                  >
                    <ul className="space-y-2">
                      {result.questions.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-zinc-300">
                          <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" aria-hidden />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Disclosure>
                </div>
              )}

              {/* Mechanic-ready report */}
              <div className="lg:col-span-12">
                <SectionHeading
                  index="04"
                  icon={<ShieldAlert className="h-3.5 w-3.5 text-amber-400" aria-hidden />}
                  title="Mechanic-ready report"
                />
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-300 ring-1 ring-inset ring-white/5">
                  {result.mechanicReport}
                </pre>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button type="button" onClick={handleCopy} variant="outline" size="sm">
                    {copied ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                    ) : (
                      <Clipboard className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {copied ? "Copied" : "Copy report"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!isPro) {
                        openModal();
                        return;
                      }
                      window.print();
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Printer className="h-3.5 w-3.5" aria-hidden />
                    Print / Save as PDF
                  </Button>
                  {copyError && (
                    <p role="alert" className="text-xs text-red-400">
                      {copyError}
                    </p>
                  )}
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {isPro
                    ? "Tip: choose \"Save as PDF\" in the print dialog to keep a copy of this report."
                    : "Print / Save as PDF is a Pro feature. Upgrade to export a copy of this report."}
                </p>
              </div>

              {/* Follow-up */}
              {followUpEnabled && (
                <div className="border-t border-zinc-800 pt-4 lg:col-span-12">
                  <SectionHeading
                    index="05"
                    icon={<MessageCircle className="h-3.5 w-3.5 text-amber-400" aria-hidden />}
                    title="Ask a follow-up question"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Not sure about a detail? Ask a follow-up about this vehicle and symptom — the
                    answer uses your Puter account like the main analysis.
                  </p>
                  <div className="mt-3 space-y-3">
                    {followUps.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
                      >
                        <p className="text-sm font-medium text-zinc-200">Q: {item.question}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                          {item.answer}
                        </p>
                      </div>
                    ))}
                    <form onSubmit={handleFollowUp} className="flex flex-col gap-2 sm:flex-row">
                      <label htmlFor="follow-up-question" className="sr-only">
                        Follow-up question
                      </label>
                      <input
                        id="follow-up-question"
                        type="text"
                        value={followUpInput}
                        onChange={(event) => setFollowUpInput(event.target.value)}
                        disabled={followUpLoading}
                        placeholder="e.g. It vibrates more when cold — does that change anything?"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-amber-500 focus:outline-none"
                      />
                      <Button
                        type="submit"
                        disabled={followUpLoading || followUpInput.trim().length === 0}
                      >
                        {followUpLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                            Answering…
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" aria-hidden />
                            Ask
                          </>
                        )}
                      </Button>
                    </form>
                    <p aria-live="polite" role="status" className="min-h-4 text-xs text-amber-300">
                      {followUpLoading ? followUpStatus : ""}
                    </p>
                    {followUpError && (
                      <p role="alert" className="text-xs text-red-400">
                        {followUpError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Start another assessment — button-in-button CTA */}
              {onRestart && (
                <div className="border-t border-zinc-800 pt-5 lg:col-span-12">
                  <Button
                    type="button"
                    onClick={onRestart}
                    className="group w-full"
                    size="lg"
                  >
                    Start another assessment
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/25 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                      <RotateCcw className="h-4 w-4" aria-hidden />
                    </span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Print-only report (rendered only when printing / saving as PDF) */}
      <div className="print-report" aria-hidden>
        <h1>Garage Ghost — Mechanic-ready report</h1>
        <p className="print-muted">
          Vehicle: {vehicleLabel} · Generated {new Date().toLocaleString()} ·{" "}
          {source === "demo" ? "Demo result (not an AI analysis)" : "AI analysis via Puter"}
        </p>

        <h2>Detected warning</h2>
        <p>
          {result.detectedWarning} — Risk level: <strong>{result.riskLevel}</strong> (Confidence:{" "}
          {result.confidence})
        </p>

        <h2>Summary</h2>
        <p>{result.summary}</p>

        {result.possibleCauses.length > 0 && (
          <>
            <h2>Possible causes</h2>
            <ul>
              {result.possibleCauses.map((item, index) => (
                <li key={index}>
                  {item.cause} ({item.likelihood})
                </li>
              ))}
            </ul>
          </>
        )}

        <h2>Estimated repair cost (ballpark, USD)</h2>
        {costs.isEmergency ? (
          <p>Not estimated — emergency situation. Stop safely and request a written quote.</p>
        ) : estimatesLocked ? (
          <p>Repair cost estimates are a Pro feature.</p>
        ) : costs.estimates.length > 0 ? (
          <ul>
            {costs.estimates.map((item, index) => (
              <li key={index}>
                {item.label}: {formatCostRange(item)}
              </li>
            ))}
          </ul>
        ) : null}

        {result.safeChecks.length > 0 && (
          <>
            <h2>Safe checks</h2>
            <ul>
              {result.safeChecks.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </>
        )}

        {result.doNotDo.length > 0 && (
          <>
            <h2>Do not do</h2>
            <ul>
              {result.doNotDo.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </>
        )}

        {result.questions.length > 0 && (
          <>
            <h2>Questions for the mechanic</h2>
            <ul>
              {result.questions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </>
        )}

        <h2>Mechanic report</h2>
        <pre>{result.mechanicReport}</pre>

        <p className="print-muted">{DISCLAIMER}</p>
      </div>

      {/* Fixed emergency disclaimer — always visible with a result */}
      <FixedDisclaimer />

      {/* Copy confirmation toast */}
      {copied && (
        <div
          role="status"
          aria-live="polite"
          className="toast-pop fixed bottom-20 left-1/2 z-40 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-zinc-900 px-4 py-2 text-xs font-semibold text-emerald-300 shadow-lg">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Report copied to clipboard
          </div>
        </div>
      )}
    </>
  );
}
