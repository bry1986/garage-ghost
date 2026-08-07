"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clipboard,
  Crown,
  HelpCircle,
  Info,
  MessageCircle,
  OctagonAlert,
  Printer,
  Send,
  ShieldAlert,
  Wrench,
  XCircle,
} from "lucide-react";
import { CONFIDENCE_LABEL, DISCLAIMER, PRIMARY_BUTTON_CLASSES, RISK_META, safeRiskLevel } from "@/lib/constants";
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

const RISK_ICONS: Record<RiskLevel, typeof OctagonAlert> = {
  STOP_NOW: OctagonAlert,
  DRIVE_CAREFULLY: AlertTriangle,
  BOOK_SERVICE: CalendarClock,
};

const LIKELIHOOD_CLASSES: Record<Confidence, string> = {
  low: "bg-zinc-700/40 text-zinc-400",
  medium: "bg-amber-500/15 text-amber-300",
  high: "bg-red-500/15 text-red-300",
};

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
  const RiskIcon = RISK_ICONS[riskLevel];
  const followUpEnabled = Boolean(vehicle);

  return (
    <>
      <section
        aria-labelledby="diagnosis-result-heading"
        className="space-y-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4 sm:p-6"
      >
        <div>
          <h2 id="diagnosis-result-heading" className="text-lg font-semibold text-zinc-50">
            Analysis
          </h2>
          <p className="mt-1 text-sm text-zinc-400">{vehicleLabel}</p>
        </div>

        {source === "demo" && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              <span className="font-semibold">Demo mode:</span> this result was generated locally for
              testing and is not an AI analysis. Set <code className="rounded bg-zinc-900 px-1">NEXT_PUBLIC_DEMO_MODE</code>{" "}
              to <code className="rounded bg-zinc-900 px-1">false</code> to use Puter.
            </p>
          </div>
        )}

        {imageNote && (
          <div className="flex items-start gap-2 rounded-md border border-zinc-700 bg-zinc-800/50 p-3 text-sm text-zinc-300">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
            <p>
              A photo was attached and was included alongside your written description. Visual
              identification is not guaranteed — treat it as a hint, not a certain diagnosis.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ring-inset",
              RISK_META[riskLevel].badgeClasses
            )}
          >
            <RiskIcon className="h-3.5 w-3.5" aria-hidden />
            {RISK_META[riskLevel].label}
          </span>
          <p className="text-xs text-zinc-400">
            {result.detectedWarning} · {CONFIDENCE_LABEL[result.confidence]}
          </p>
        </div>
        <p className="text-xs text-zinc-500">{RISK_META[riskLevel].description}</p>

        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Summary</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">{result.summary}</p>
        </div>

        {result.possibleCauses.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <Wrench className="h-4 w-4 text-zinc-400" aria-hidden />
              Possible causes
            </h3>
            <ul className="mt-3 space-y-2">
              {result.possibleCauses.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-3 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-300"
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
          </div>
        )}

        {/* Estimated repair cost — FIXD-style ballpark ranges */}
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <CircleDollarSign className="h-4 w-4 text-emerald-400" aria-hidden />
            Estimated repair cost
          </h3>
          {costs.isEmergency ? (
            <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              <p className="flex items-start gap-2">
                <OctagonAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  This is an emergency — stop safely first. Cost estimates are not helpful here:
                  get the vehicle to a workshop and ask for a written quote.
                </span>
              </p>
            </div>
          ) : estimatesLocked ? (
            <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="flex items-start gap-2 text-sm text-amber-200">
                <Crown className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  <span className="font-semibold">
                    You&apos;ve used your free estimates for today.
                  </span>{" "}
                  Upgrade to Pro for unlimited repair cost estimates.
                </span>
              </p>
              <button
                type="button"
                onClick={openModal}
                className="mt-3 inline-flex items-center gap-2 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
              >
                <Crown className="h-3.5 w-3.5" aria-hidden />
                Go Pro
              </button>
            </div>
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {costs.estimates.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between gap-3 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-300"
                  >
                    <span>{item.label}</span>
                    <span className="shrink-0 font-semibold text-amber-300">
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

        {result.safeChecks.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden />
              Safe checks you can do
            </h3>
            <ul className="mt-3 space-y-2">
              {result.safeChecks.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.doNotDo.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <XCircle className="h-4 w-4 text-red-400" aria-hidden />
              Do not do
            </h3>
            <ul className="mt-3 space-y-2">
              {result.doNotDo.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-zinc-300">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.questions.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <HelpCircle className="h-4 w-4 text-sky-400" aria-hidden />
              Questions to answer or ask a mechanic
            </h3>
            <ul className="mt-3 space-y-2">
              {result.questions.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-zinc-300">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <ShieldAlert className="h-4 w-4 text-amber-400" aria-hidden />
            Mechanic-ready report
          </h3>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-300">
            {result.mechanicReport}
          </pre>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-amber-500/60 hover:text-amber-300"
            >
              {copied ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
              ) : (
                <Clipboard className="h-3.5 w-3.5" aria-hidden />
              )}
              {copied ? "Copied" : "Copy report"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isPro) {
                  openModal();
                  return;
                }
                window.print();
              }}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-amber-500/60 hover:text-amber-300"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden />
              Print / Save as PDF
            </button>
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

        {followUpEnabled && (
          <div className="border-t border-zinc-800 pt-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <MessageCircle className="h-4 w-4 text-amber-400" aria-hidden />
              Ask a follow-up question
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Not sure about a detail? Ask a follow-up about this vehicle and symptom — the answer
              uses your Puter account like the main analysis.
            </p>
            <div className="mt-3 space-y-3">
              {followUps.map((item, index) => (
                <div
                  key={index}
                  className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3"
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
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={followUpLoading || followUpInput.trim().length === 0}
                  className={cn(
                    PRIMARY_BUTTON_CLASSES,
                    "shrink-0",
                    (followUpLoading || followUpInput.trim().length === 0) &&
                      "cursor-not-allowed opacity-60"
                  )}
                >
                  {followUpLoading ? (
                    <span className="text-xs">Answering…</span>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" aria-hidden />
                      Ask
                    </>
                  )}
                </button>
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
      <div
        role="note"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur"
      >
        <div className="mx-auto flex max-w-5xl items-start gap-2 text-xs leading-relaxed text-zinc-300">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
          <p>{DISCLAIMER}</p>
        </div>
      </div>
    </>
  );
}
