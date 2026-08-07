"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, History as HistoryIcon, ShieldCheck, Trash2 } from "lucide-react";
import { DiagnosisResult } from "@/components/diagnosis-result";
import { RISK_META, safeRiskLevel } from "@/lib/constants";
import { clearHistory, deleteDiagnosis, getHistory } from "@/lib/storage";
import { cn, formatDate } from "@/lib/utils";
import type { SavedDiagnosis } from "@/types/diagnostic";

export function HistoryList() {
  const [items, setItems] = useState<SavedDiagnosis[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Reading the external localStorage store once after mount (client only).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- external-store read on mount is intentional here
    setItems(getHistory());
  }, []);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const toggleOpen = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleDelete = (id: string) => {
    deleteDiagnosis(id);
    setItems((prev) => (prev ? prev.filter((item) => item.id !== id) : prev));
    if (openId === id) setOpenId(null);
  };

  const handleClearAll = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmingClear(false), 3000);
      return;
    }
    clearHistory();
    setItems([]);
    setOpenId(null);
    setConfirmingClear(false);
  };

  if (items === null) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          {items.length === 0
            ? "No saved diagnoses yet."
            : `${items.length} saved report${items.length === 1 ? "" : "s"}.`}
        </p>
        {items.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              confirmingClear
                ? "border-red-500 bg-red-500/15 text-red-300"
                : "border-zinc-700 text-zinc-300 hover:border-red-500/60 hover:text-red-300"
            )}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            {confirmingClear ? "Tap again to confirm" : "Clear all local history"}
          </button>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-xs leading-relaxed text-zinc-400">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
        <p>
          <span className="font-medium text-zinc-300">Privacy:</span> your reports are stored only
          in this browser (localStorage) on this device for this MVP. They are never sent to a
          server. Clearing your browser data removes them.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 p-10 text-center">
          <HistoryIcon className="mx-auto h-8 w-8 text-zinc-600" aria-hidden />
          <h2 className="mt-3 text-sm font-semibold text-zinc-300">No saved diagnoses yet</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Run your first diagnosis and it will be saved here.
          </p>
          <Link
            href="/diagnose"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
          >
            Diagnose a warning
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => {
            const open = openId === item.id;
            const vehicleLabel = [item.vehicle.brand, item.vehicle.model, item.vehicle.year]
              .filter(Boolean)
              .join(" ");
            const riskMeta = RISK_META[safeRiskLevel(item.result.riskLevel)];
            return (
              <li
                key={item.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{vehicleLabel}</h3>
                    <p className="mt-0.5 text-xs text-zinc-500">{formatDate(item.createdAt)}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                      riskMeta.badgeClasses
                    )}
                  >
                    {riskMeta.label}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{item.result.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleOpen(item.id)}
                    aria-expanded={open}
                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-amber-500/60 hover:text-amber-300"
                  >
                    {open ? "Hide report" : "View report"}
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
                      aria-hidden
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-red-500/60 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    Delete
                  </button>
                </div>
                {open && (
                  <div className="mt-4 border-t border-zinc-800 pt-4">
                    <DiagnosisResult
                      result={item.result}
                      source={item.source}
                      vehicleLabel={vehicleLabel}
                      imageNote={false}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
