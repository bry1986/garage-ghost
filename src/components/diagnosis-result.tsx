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
  CheckCircle2,
  CircleDollarSign,
  Clipboard,
  Clock,
  Crown,
  Download,
  HelpCircle,
  Info,
  Loader2,
  MessageCircle,
  OctagonAlert,
  RotateCcw,
  ShieldAlert,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";
import { Disclosure } from "@/components/ui/disclosure";
import { Button } from "@/components/ui/button";
import { FixedDisclaimer } from "@/components/fixed-disclaimer";
import { DISCLAIMER, RISK_META, safeRiskLevel } from "@/lib/constants";
import {
  COST_DISCLAIMER,
  estimateRepairCosts,
  formatCostRange,
  type RepairCostEstimateResult,
} from "@/lib/costs";
import { askFollowUp, describePuterError, FOLLOW_UP_RETRY_LABEL } from "@/lib/diagnosis";
import { usePro } from "@/components/pro-provider";
import {
  consumeEstimate,
  FREE_ESTIMATES_PER_DAY,
  shouldConsumeEstimate,
  shouldLockEstimates,
} from "@/lib/pro";
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
  medium:
    "bg-amber-600/15 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  high: "bg-red-600/15 text-red-600 dark:bg-red-500/15 dark:text-red-300",
};

/** Per-risk icon tile treatment for the Problem Detected card. */
const RISK_TILE: Record<RiskLevel, string> = {
  STOP_NOW: "border-red-600/40 bg-red-600/15 text-red-600 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300",
  DRIVE_CAREFULLY:
    "border-amber-600/40 bg-amber-600/15 text-amber-600 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300",
  BOOK_SERVICE:
    "border-sky-600/40 bg-sky-600/15 text-sky-600 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300",
};

/** The 4-level severity scale shown as horizontal segments. */
const SEVERITY_META = [
  { label: "Low", barFilled: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  { label: "Medium", barFilled: "bg-amber-500 dark:bg-amber-400", text: "text-amber-600 dark:text-amber-400" },
  { label: "High", barFilled: "bg-orange-500 dark:bg-orange-400", text: "text-orange-600 dark:text-orange-400" },
  { label: "Critical", barFilled: "bg-red-500 dark:bg-red-400", text: "text-red-600 dark:text-red-400" },
] as const;

/** App risk levels map onto the 4-level scale. */
const RISK_TO_LEVEL_INDEX: Record<RiskLevel, number> = {
  BOOK_SERVICE: 1, // Medium
  DRIVE_CAREFULLY: 2, // High
  STOP_NOW: 3, // Critical
};

const SAFE_TO_DRIVE_META: Record<RiskLevel, { text: string; className: string }> = {
  STOP_NOW: { text: "No — stop now", className: "text-red-600 dark:text-red-400" },
  DRIVE_CAREFULLY: { text: "Limited driving only", className: "text-amber-600 dark:text-amber-400" },
  BOOK_SERVICE: { text: "Yes, with care", className: "text-sky-600 dark:text-sky-400" },
};

const URGENCY_META: Record<RiskLevel, { text: string; className: string }> = {
  STOP_NOW: { text: "Immediately", className: "text-red-600 dark:text-red-400" },
  DRIVE_CAREFULLY: { text: "Fix within 24–48 hours", className: "text-amber-600 dark:text-amber-400" },
  BOOK_SERVICE: { text: "Book within a week", className: "text-sky-600 dark:text-sky-400" },
};

/** Print severity value colors (light report theme). */
const SEVERITY_PRINT_COLOR: Record<RiskLevel, string> = {
  STOP_NOW: "pr-sev-critical",
  DRIVE_CAREFULLY: "pr-sev-high",
  BOOK_SERVICE: "pr-sev-medium",
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
      <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
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

/** Small metric tile in the Problem Detected card (est. cost / safe to drive / urgency). */
function MetricBox({
  icon,
  tileClass,
  label,
  value,
  valueClass,
  note,
  noteClass,
}: {
  icon: ReactNode;
  tileClass: string;
  label: string;
  value: string;
  valueClass: string;
  note?: string;
  noteClass?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tileClass)}>
        {icon}
      </span>
      <p className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <p className={cn("mt-0.5 text-sm font-bold", valueClass)}>{value}</p>
      {note && <p className={cn("mt-0.5 text-[10px]", noteClass)}>{note}</p>}
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
      <div className="pr-header">
        <div className="pr-brand">
          <span className="pr-brand-mark">GG</span>
          <div>
            <p className="pr-brand-name">Garage Ghost</p>
            <p className="pr-title">Vehicle Diagnostic Report</p>
          </div>
        </div>
      </div>
      <div className="pr-section">
        <p className="pr-section-label">Diagnosis</p>
        <p className="pr-summary">
          No report to print yet. Run a diagnosis on the Diagnose page first, then print or save
          this page as a PDF.
        </p>
      </div>
      <div className="pr-footer">
        <p className="pr-muted">{DISCLAIMER}</p>
        <p className="pr-muted">Generated by Garage Ghost</p>
      </div>
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

  const { isPro, openModal, validating } = usePro();

  // Free tier: each freshly generated result that shows cost estimates counts
  // toward the 3/day allowance. Pro users, emergency results, re-opened
  // reports (consumeQuota=false), and results generated while a stored license
  // is still being validated are never counted or locked.
  const quotaBumped = useRef(false);
  useEffect(() => {
    const shouldTrack = shouldConsumeEstimate({
      consumeQuota,
      isPro,
      validating,
      isEmergency: costs.isEmergency,
    });
    if (quotaBumped.current || !shouldTrack) return;
    quotaBumped.current = true;
    consumeEstimate();
  }, [consumeQuota, isPro, validating, costs.isEmergency]);

  // Free users see numbers on their first 3 generated results each day, then a
  // locked state with an upgrade prompt. Emergencies always show the safety
  // message, and already-generated reports are always shown in full.
  const estimatesLocked = shouldLockEstimates({
    consumeQuota,
    isPro,
    validating,
    isEmergency: costs.isEmergency,
  });

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
      setFollowUpError(describePuterError(cause, FOLLOW_UP_RETRY_LABEL));
    } finally {
      setFollowUpLoading(false);
    }
  };

  const riskLevel = safeRiskLevel(result.riskLevel);
  const SeverityIcon = riskLevel === "STOP_NOW" ? OctagonAlert : AlertTriangle;
  const followUpEnabled = Boolean(vehicle);
  const activeLevel = RISK_TO_LEVEL_INDEX[riskLevel];

  // Print report helpers — severity label, confidence label, stable report number.
  const severityLabel = SEVERITY_META[activeLevel].label;
  const confidenceLabel =
    result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1);
  const reportNumber = useMemo(() => {
    const seed = `${vehicleLabel}|${symptoms ?? ""}|${result.detectedWarning}|${result.summary.length}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return String(100 + (hash % 900));
  }, [vehicleLabel, symptoms, result.detectedWarning, result.summary]);
  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // "Check Engine Light + Rattle Noise — Likely Misfire or Exhaust Restriction"
  const likelyCauses = result.possibleCauses.slice(0, 2).map((item) => item.cause);
  const problemHeading =
    likelyCauses.length > 0
      ? `${result.detectedWarning} — Likely ${likelyCauses.join(" or ")}`
      : result.detectedWarning;

  // Combined ballpark across every matched job, e.g. "$180–$2,200".
  const costRangeText = costs.isEmergency
    ? "Not estimated"
    : estimatesLocked
      ? "Pro feature"
      : `$${Math.min(...costs.estimates.map((item) => item.min)).toLocaleString("en-US")}–$${Math.max(...costs.estimates.map((item) => item.max)).toLocaleString("en-US")}`;

  return (
    <>
      <section
        aria-labelledby="diagnosis-result-heading"
        className={cn(
          // STOP_NOW results are never animated — the urgency must read instantly.
          riskLevel !== "STOP_NOW" && "result-rise"
        )}
      >
        <div className="card-surface-raised p-4 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.18)] sm:p-6">
          {/* Section entrances stagger 60ms apart — never applied to STOP_NOW. */}
          <div className={cn("space-y-5", riskLevel !== "STOP_NOW" && "stagger-in")}>
            {/* ----------------- Card 1 — Problem detected ----------------- */}
            <div
              role={riskLevel === "STOP_NOW" ? "alert" : "status"}
              className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start gap-3.5">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                    RISK_TILE[riskLevel]
                  )}
                >
                  <SeverityIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
                    Problem detected
                  </p>
                  <h2
                    id="diagnosis-result-heading"
                    className="mt-1 font-display text-lg font-bold leading-snug tracking-tight text-zinc-50 sm:text-xl"
                  >
                    {problemHeading}
                  </h2>
                </div>
                <span
                  className={cn(
                    "mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1",
                    RISK_META[riskLevel].badgeClasses
                  )}
                >
                  <AlertTriangle className="h-3 w-3" aria-hidden />
                  {RISK_META[riskLevel].label}
                </span>
              </div>

              {/* Severity level — 4 segments */}
              <div className="mt-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                  Severity level
                </p>
                <div className="mt-2 flex gap-1.5">
                  {SEVERITY_META.map((level, index) => {
                    const filled = index <= activeLevel;
                    const isActive = index === activeLevel;
                    return (
                      <div key={level.label} className="flex-1">
                        <div
                          className={cn(
                            "h-2 rounded-full",
                            filled ? level.barFilled : "bg-zinc-700/50"
                          )}
                        />
                        <p
                          className={cn(
                            "mt-1.5 text-center text-[10px] font-semibold",
                            isActive ? level.text : "text-zinc-500"
                          )}
                        >
                          {level.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Static safety guidance — never AI-generated, always visible */}
              <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                {RISK_META[riskLevel].description}
              </p>

              {/* Metrics — est. cost / safe to drive / urgency */}
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MetricBox
                  icon={<CircleDollarSign className="h-4 w-4" aria-hidden />}
                  tileClass="bg-sky-500/15 text-sky-700 dark:text-sky-400"
                  label="Est. cost"
                  value={costRangeText}
                  valueClass={
                    costs.isEmergency
                      ? "text-red-400"
                      : estimatesLocked
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-zinc-100"
                  }
                  note={
                    costs.isEmergency
                      ? "Stop safely first"
                      : estimatesLocked
                        ? "Upgrade for unlimited estimates"
                        : undefined
                  }
                  noteClass={costs.isEmergency ? "text-red-400" : "text-amber-600 dark:text-amber-400"}
                />
                <MetricBox
                  icon={<ShieldAlert className="h-4 w-4" aria-hidden />}
                  tileClass="bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  label="Safe to drive"
                  value={SAFE_TO_DRIVE_META[riskLevel].text}
                  valueClass={SAFE_TO_DRIVE_META[riskLevel].className}
                />
                <MetricBox
                  icon={<Clock className="h-4 w-4" aria-hidden />}
                  tileClass="bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  label="Urgency"
                  value={URGENCY_META[riskLevel].text}
                  valueClass={URGENCY_META[riskLevel].className}
                />
              </div>
            </div>

            {/* Demo / photo notes */}
            {source === "demo" && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-200">
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
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                <p>
                  A photo was attached and was included alongside your written description.
                  Visual identification is not guaranteed — treat it as a hint, not a certain
                  diagnosis.
                </p>
              </div>
            )}

            {/* ----------------- Card 2 — What we found ----------------- */}
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 sm:p-5">
              <div className="flex items-start gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300">
                  <Info className="h-4.5 w-4.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-400">
                    What we found
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">{result.summary}</p>
                </div>
              </div>
            </div>

            {/* ----------------- Card 3 — Ask a follow-up question ----------------- */}
            {followUpEnabled && (
              <div className="relative overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-4 sm:p-5">
                <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-sky-500/80" />
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300">
                    <MessageCircle className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold tracking-tight text-zinc-50">
                      Ask a Follow-Up Question
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Get specific advice about your situation from our AI mechanic.
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {followUps.map((item, index) => (
                    <div key={index} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                      <p className="text-sm font-medium text-zinc-200">Q: {item.question}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                  <form onSubmit={handleFollowUp} className="space-y-2.5">
                    <label htmlFor="follow-up-question" className="sr-only">
                      Follow-up question
                    </label>
                    <input
                      id="follow-up-question"
                      type="text"
                      value={followUpInput}
                      onChange={(event) => setFollowUpInput(event.target.value)}
                      disabled={followUpLoading}
                      placeholder='E.g. "Can I drive 50 miles to a mechanic?" or "What happens if I ignore this?"'
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-sky-500 focus:outline-none"
                    />
                    <Button
                      type="submit"
                      size="full"
                      disabled={followUpLoading || followUpInput.trim().length === 0}
                      className="bg-indigo-500 text-white hover:bg-indigo-400"
                    >
                      {followUpLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          Answering…
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4" aria-hidden />
                          {FOLLOW_UP_RETRY_LABEL}
                        </>
                      )}
                    </Button>
                  </form>
                  <p aria-live="polite" role="status" className="min-h-4 text-xs text-amber-600 dark:text-amber-300">
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

            {/* ----------------- Download Free PDF Report ----------------- */}
            <Button
              type="button"
              variant="outline"
              size="full"
              className="text-sm"
              onClick={() => window.print()}
            >
              <Download className="h-4 w-4" aria-hidden />
              Download Free PDF Report
            </Button>

            {/* ----------------- Disclaimer ----------------- */}
            <div className="rounded-xl border border-zinc-700/70 bg-zinc-800/40 px-4 py-3 text-xs leading-relaxed text-zinc-400">
              {DISCLAIMER}
            </div>

            {/* ----------------- Run another diagnosis ----------------- */}
            {onRestart && (
              <Button type="button" onClick={onRestart} variant="outline" size="full" className="text-sm">
                <RotateCcw className="h-4 w-4" aria-hidden />
                Run Another Diagnosis
              </Button>
            )}

            {/* ----------------- Detailed report sections ----------------- */}
            <div className="border-t border-zinc-800 pt-6">
              <div className="grid gap-4 sm:gap-5 lg:grid-cols-12">
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

                {/* Estimated repair cost — per-item breakdown */}
                <div className="lg:col-span-5">
                  <div className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                    <SectionHeading
                      index="01"
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
                        <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-200">
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
                              <span className="shrink-0 font-mono text-sm font-bold text-amber-600 dark:text-amber-300">
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
                              className="font-medium text-amber-600 underline-offset-2 hover:underline dark:text-amber-400"
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
                        index="02"
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
                    index="03"
                    icon={<ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden />}
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
                    {copyError && (
                      <p role="alert" className="text-xs text-red-400">
                        {copyError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Print-only report (rendered only when printing / saving as PDF) */}
      <div className="print-report" aria-hidden>
        {/* Header band */}
        <div className="pr-header">
          <div className="pr-brand">
            <span className="pr-brand-mark">GG</span>
            <div>
              <p className="pr-brand-name">Garage Ghost</p>
              <p className="pr-title">Vehicle Diagnostic Report</p>
            </div>
          </div>
          <p className="pr-meta">
            Report #{reportNumber} — {reportDate}
            <span className="pr-meta-sub">
              {source === "demo" ? "Demo result (not an AI analysis)" : "AI analysis"}
            </span>
          </p>
        </div>

        {/* Vehicle */}
        <div className="pr-section">
          <p className="pr-section-label">Vehicle</p>
          <p className="pr-vehicle">{vehicleLabel}</p>
        </div>

        {/* Diagnosis */}
        <div className="pr-section">
          <p className="pr-section-label">Diagnosis</p>
          <h1 className="pr-heading">{problemHeading}</h1>
          <p className="pr-summary">{result.summary}</p>
        </div>

        {/* Metrics band */}
        <div className="pr-band">
          <div className="pr-metric">
            <p className="pr-metric-label">Severity</p>
            <p className={cn("pr-metric-value", SEVERITY_PRINT_COLOR[riskLevel])}>
              {severityLabel}
            </p>
          </div>
          <div className="pr-metric">
            <p className="pr-metric-label">Confidence</p>
            <p className="pr-metric-value">{confidenceLabel}</p>
          </div>
          <div className="pr-metric">
            <p className="pr-metric-label">Est. cost</p>
            <p className="pr-metric-value">{costRangeText}</p>
          </div>
          <div className="pr-metric">
            <p className="pr-metric-label">Safe to drive</p>
            <p className="pr-metric-value">{SAFE_TO_DRIVE_META[riskLevel].text}</p>
          </div>
          <div className="pr-metric">
            <p className="pr-metric-label">Urgency</p>
            <p className="pr-metric-value">{URGENCY_META[riskLevel].text}</p>
          </div>
        </div>

        {/* Possible causes */}
        {result.possibleCauses.length > 0 && (
          <div className="pr-section">
            <p className="pr-section-label">Possible Causes</p>
            <ul className="pr-list">
              {result.possibleCauses.map((item, index) => (
                <li key={index} className="pr-cause">
                  <span>{item.cause}</span>
                  <span className="pr-chip">{item.likelihood} likelihood</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Safe checks */}
        {result.safeChecks.length > 0 && (
          <div className="pr-section">
            <p className="pr-section-label">Safe Checks You Can Do</p>
            <ol className="pr-ordered">
              {result.safeChecks.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Do not do */}
        {result.doNotDo.length > 0 && (
          <div className="pr-section">
            <p className="pr-section-label">Do Not Do</p>
            <ul className="pr-bullets">
              {result.doNotDo.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Repair cost breakdown */}
        <div className="pr-section">
          <p className="pr-section-label">Repair Cost Breakdown</p>
          {costs.isEmergency ? (
            <p className="pr-note">
              Not estimated — emergency situation. Stop safely first, then request a written quote.
            </p>
          ) : estimatesLocked ? (
            <p className="pr-note">Repair cost estimates are a Pro feature.</p>
          ) : costs.estimates.length > 0 ? (
            <table className="pr-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Est. cost</th>
                </tr>
              </thead>
              <tbody>
                {costs.estimates.map((item, index) => (
                  <tr key={index}>
                    <td>{item.label}</td>
                    <td className="pr-cost">{formatCostRange(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>

        {/* Questions */}
        {result.questions.length > 0 && (
          <div className="pr-section">
            <p className="pr-section-label">Questions to Ask Your Mechanic</p>
            <ol className="pr-ordered">
              {result.questions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Your description */}
        <div className="pr-section">
          <p className="pr-section-label">Your Description</p>
          <blockquote className="pr-quote">{symptoms || "Not provided."}</blockquote>
        </div>

        {/* Mechanic-ready report — may exceed one page, so page breaks are allowed */}
        <div className="pr-section pr-section-break-ok">
          <p className="pr-section-label">Mechanic-Ready Report</p>
          <pre className="pr-pre">{result.mechanicReport}</pre>
        </div>

        {/* Footer */}
        <div className="pr-footer">
          <p className="pr-muted">{result.disclaimer || DISCLAIMER}</p>
          <p className="pr-muted">
            Generated by Garage Ghost
            {source === "demo" ? " — demo result, not an AI analysis" : ""}
          </p>
        </div>
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
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-zinc-900 px-4 py-2 text-xs font-semibold text-emerald-600 shadow-lg dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Report copied to clipboard
          </div>
        </div>
      )}
    </>
  );
}
