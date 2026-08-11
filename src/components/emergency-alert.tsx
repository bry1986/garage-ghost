import { OctagonAlert } from "lucide-react";
import { EMERGENCY_MESSAGE } from "@/lib/constants";

export function EmergencyAlert() {
  return (
    <section
      role="alert"
      aria-label="Emergency safety warning"
      className="rounded-xl border-2 border-red-500/50 bg-red-500/10 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
          <OctagonAlert className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-red-600 dark:text-red-300">
            Stop safely
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-red-800 dark:text-red-100/90">{EMERGENCY_MESSAGE}</p>
        </div>
      </div>
    </section>
  );
}
