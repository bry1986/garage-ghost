"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, ScanLine, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { estimateRepairCosts, formatCostRange } from "@/lib/costs";
import { lookupDtc, type DtcEntry } from "@/lib/dtc";
import { cn } from "@/lib/utils";

const inputClasses =
  "w-full rounded-lg border border-zinc-700/80 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-[border-color,box-shadow,background-color] duration-150 hover:border-zinc-600 focus:border-brand focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand/20";

/**
 * OBD-II fault-code lookup — instant, no AI call. Lives on the VIN page so
 * the diagnosis form stays a clean step flow. A matching code can be sent to
 * the diagnosis form via a deep link (/diagnose?dtc=P0300).
 */
export function ObdIiLookup() {
  const [dtcInput, setDtcInput] = useState("");
  const [dtcResult, setDtcResult] = useState<DtcEntry | null>(null);
  const [dtcError, setDtcError] = useState<string | null>(null);
  const [dtcSearched, setDtcSearched] = useState(false);

  const handleLookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const raw = dtcInput.trim();
    if (raw.length === 0) {
      setDtcError("Enter an OBD-II code, e.g. P0300.");
      setDtcResult(null);
      setDtcSearched(false);
      return;
    }
    setDtcError(null);
    setDtcResult(lookupDtc(raw));
    setDtcSearched(true);
  };

  // FIXD-style ballpark cost for the DTC card (derived during render, not a hook).
  const dtcCostLine = dtcResult
    ? (() => {
        const costs = estimateRepairCosts({
          detectedWarning: dtcResult.description,
          summary: dtcResult.advice,
          possibleCauses: dtcResult.possibleCauses.map((cause) => ({ cause })),
          riskLevel: dtcResult.urgency === "high" ? "DRIVE_CAREFULLY" : "BOOK_SERVICE",
        });
        const top = costs.estimates[0];
        return top ? `${top.label}: ${formatCostRange(top)}` : null;
      })()
    : null;

  return (
    <section aria-labelledby="obd-heading" className="card-surface p-4 sm:p-5">
      <h2
        id="obd-heading"
        className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-200"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand/30 bg-brand/10">
          <ScanLine className="h-4 w-4 text-brand" aria-hidden />
        </span>
        OBD-II code lookup
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
        Have a code from an OBD-II scanner (e.g. <code className="text-zinc-400">P0300</code>)?
        Get an instant plain-English explanation — free and no AI call needed.
      </p>
      <form onSubmit={handleLookup} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="obd-code" className="sr-only">
          OBD-II code
        </label>
        <input
          id="obd-code"
          name="obd-code"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={dtcInput}
          onChange={(event) => setDtcInput(event.target.value)}
          placeholder="e.g. P0300"
          className={cn(inputClasses, "uppercase sm:max-w-44")}
        />
        <Button type="submit" variant="outline" className="shrink-0">
          <Search className="h-4 w-4" aria-hidden />
          Look up
        </Button>
      </form>
      {dtcError && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {dtcError}
        </p>
      )}
      {dtcResult && (
        <div role="status" className="mt-3 rounded-md border border-zinc-700 bg-zinc-950/60 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-brand/15 px-2 py-0.5 font-mono text-xs font-bold text-brand">
              {dtcResult.code}
            </span>
            <span className="text-xs font-medium text-zinc-400">{dtcResult.system}</span>
            <span
              className={cn(
                "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                dtcResult.urgency === "high"
                  ? "bg-red-500/15 text-red-300"
                  : dtcResult.urgency === "medium"
                    ? "bg-brand/15 text-brand"
                    : "bg-sky-500/15 text-sky-300"
              )}
            >
              {dtcResult.urgency === "high"
                ? "Act promptly"
                : dtcResult.urgency === "medium"
                  ? "Book service"
                  : "Low urgency"}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-zinc-200">{dtcResult.description}</p>
          <ul className="mt-2 space-y-1">
            {dtcResult.possibleCauses.map((cause, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-zinc-400">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-500" aria-hidden />
                <span>{cause}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">{dtcResult.advice}</p>
          {dtcCostLine && (
            <p className="mt-2 text-xs text-zinc-400">
              <span className="font-medium text-zinc-300">Est. typical cost:</span> {dtcCostLine}{" "}
              — rough ballpark, varies by vehicle, region and workshop.
            </p>
          )}
          <Link
            href={`/diagnose?dtc=${encodeURIComponent(dtcResult.code)}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-brand/60 hover:text-brand"
          >
            Analyze this code in a diagnosis
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      )}
      {dtcSearched && !dtcResult && !dtcError && (
        <p role="status" className="mt-2 text-xs text-zinc-500">
          No entry for that code in our reference yet. You can still describe the symptoms in a
          diagnosis and analyze them with AI.
        </p>
      )}
      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
        A stored code points at the system a fault was recorded in — it is not a diagnosis. Always
        confirm with a qualified workshop scan when in doubt.
      </p>
    </section>
  );
}
