import { OctagonAlert } from "lucide-react";
import { DANGEROUS_SYMPTOM_CHIPS } from "@/lib/constants";

interface SymptomSafetyWarningProps {
  selectedChips: string[];
}

/**
 * Non-blocking safety warning for the diagnose form: when the user selects a
 * dangerous symptom chip (smoke, fuel smell, overheating, hard braking,
 * steering, electrical smell) a concise warning surfaces immediately, without
 * blocking form completion. Animated in subtly; never delays submission.
 */
export function SymptomSafetyWarning({ selectedChips }: SymptomSafetyWarningProps) {
  const dangerous = selectedChips.filter((chip) =>
    DANGEROUS_SYMPTOM_CHIPS.includes(chip as (typeof DANGEROUS_SYMPTOM_CHIPS)[number])
  );

  if (dangerous.length === 0) return null;

  return (
    // role="status" already implies an aria-live="polite" announcement.
    <div role="status" className="error-in mt-3 flex items-start gap-2.5 rounded-md border border-red-500/40 bg-red-500/10 p-3">
      <OctagonAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden />
      <p className="text-xs leading-relaxed text-red-200">
        <span className="font-semibold text-red-300">
          Safety first — you selected: {dangerous.join(", ")}.
        </span>{" "}
        If this is happening right now, stop safely and contact roadside assistance or a
        qualified workshop. You can still continue with this assessment.
      </p>
    </div>
  );
}
