import { TriangleAlert } from "lucide-react";
import { EMERGENCY_MESSAGE } from "@/lib/constants";

export function EmergencyAlert() {
  return (
    <section
      role="alert"
      aria-label="Emergency safety warning"
      className="rounded-lg border border-red-500/40 bg-red-500/10 p-4"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden />
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-red-300">
            Stop safely
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-red-100/90">{EMERGENCY_MESSAGE}</p>
        </div>
      </div>
    </section>
  );
}
