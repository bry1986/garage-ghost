import { ShieldAlert } from "lucide-react";
import { DISCLAIMER } from "@/lib/constants";

/**
 * Fixed bottom emergency disclaimer. Rendered by the diagnose page before a
 * result exists and by the result view (which keeps its own copy so the
 * disclaimer is never duplicated).
 */
export function FixedDisclaimer() {
  return (
    <div
      role="note"
      aria-label="Safety disclaimer"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-2 text-xs leading-relaxed text-zinc-300">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <p>{DISCLAIMER}</p>
      </div>
    </div>
  );
}
