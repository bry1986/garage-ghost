import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { EmergencyAlert } from "@/components/emergency-alert";
import { VehicleDiagnosisForm } from "@/components/vehicle-diagnosis-form";

export const metadata: Metadata = {
  title: "Diagnose",
  description:
    "Enter your vehicle details and symptoms to receive safety-first educational guidance.",
};

export default function DiagnosePage() {
  return (
    <div className="space-y-6">
      <div className="rise-in">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Free · No account needed
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
          Diagnose a warning
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Enter your vehicle details and describe what you notice. You will receive educational
          guidance and safe next steps.
        </p>
      </div>
      <EmergencyAlert />
      <VehicleDiagnosisForm />
    </div>
  );
}
