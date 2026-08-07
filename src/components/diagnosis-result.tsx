"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clipboard,
  HelpCircle,
  Info,
  OctagonAlert,
  ShieldAlert,
  Wrench,
  XCircle,
} from "lucide-react";
import { CONFIDENCE_LABEL, DISCLAIMER, RISK_META, safeRiskLevel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type {
  Confidence,
  DiagnosticResult,
  DiagnosisSource,
  RiskLevel,
} from "@/types/diagnostic";

interface DiagnosisResultProps {
  result: DiagnosticResult;
  source: DiagnosisSource;
  vehicleLabel: string;
  imageNote: boolean;
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

function buildReportText(result: DiagnosticResult, vehicleLabel: string): string {
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

export function DiagnosisResult({ result, source, vehicleLabel, imageNote }: DiagnosisResultProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const handleCopy = async () => {
    const text = buildReportText(result, vehicleLabel);
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

  const riskLevel = safeRiskLevel(result.riskLevel);
  const RiskIcon = RISK_ICONS[riskLevel];

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
              A photo was attached, but image analysis is not enabled in this build. Your written
              description was used for this analysis; the photo was not sent.
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
            {RISK_META[result.riskLevel].label}
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
            {copyError && (
              <p role="alert" className="text-xs text-red-400">
                {copyError}
              </p>
            )}
          </div>
        </div>
      </section>

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
