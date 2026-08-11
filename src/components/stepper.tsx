"use client";

import { Car, Check, ClipboardList, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DiagnosisStep = "vehicle" | "symptoms" | "assessment";

const STEP_ORDER: DiagnosisStep[] = ["vehicle", "symptoms", "assessment"];

const STEP_META: Record<DiagnosisStep, { label: string; icon: typeof Car }> = {
  vehicle: { label: "Vehicle", icon: Car },
  symptoms: { label: "Problem", icon: ClipboardList },
  assessment: { label: "Media", icon: ImageIcon },
};

interface StepperProps {
  /** The highest step the user has reached (for filling) — 0..3. */
  current: number;
  /** Which step is active right now (highlighted). */
  active: DiagnosisStep;
  onNavigate?: (step: DiagnosisStep) => void;
}

export function Stepper({ current, active, onNavigate }: StepperProps) {
  return (
    <nav
      aria-label="Diagnosis progress"
      className="card-surface flex w-full items-center justify-between px-2 py-3 sm:px-5"
    >
      <ol className="flex w-full items-center">
        {STEP_ORDER.map((step, index) => {
          const stepNumber = index + 1;
          const reached = current >= stepNumber;
          const isActive = active === step;
          const Icon = STEP_META[step].icon;
          const showCheck = reached && !isActive;
          const button = (
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-md px-1.5 py-1.5 transition-colors sm:gap-2.5 sm:px-2",
                onNavigate && "cursor-pointer hover:bg-zinc-800/60"
              )}
            >
              <span
                /* Re-key by active state so the one-shot glow replays exactly
                   when a step becomes active (and never loops). */
                key={isActive ? "step-active" : "step-idle"}
                className={cn(
                  "step-pop flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors sm:h-7 sm:w-7 sm:text-xs",
                  showCheck
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    : isActive
                      ? "step-pulse border-brand bg-brand text-white shadow-[0_0_16px_rgba(37,99,235,0.35)] dark:bg-blue-600"
                      : "border-zinc-700 bg-zinc-900 text-zinc-500"
                )}
                aria-hidden
              >
                {showCheck ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive ? "text-brand" : reached ? "text-zinc-200" : "text-zinc-500"
                )}
              >
                {STEP_META[step].label}
              </span>
            </span>
          );
          return (
            <li key={step} className={cn("flex items-center", index > 0 && "flex-1")}>
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "mx-0.5 h-px flex-1 transition-colors duration-500 sm:mx-2",
                    current >= stepNumber ? "bg-emerald-500/50" : "bg-zinc-800"
                  )}
                />
              )}
              {onNavigate ? (
                <button
                  type="button"
                  onClick={() => onNavigate(step)}
                  className="rounded-md focus-visible:outline-2 focus-visible:outline-brand"
                  aria-current={isActive ? "step" : undefined}
                >
                  {button}
                </button>
              ) : (
                button
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
