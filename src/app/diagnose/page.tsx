import type { Metadata } from "next";
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Diagnose a warning</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Enter your vehicle details and describe what you notice. You will receive educational
          guidance and safe next steps.
        </p>
      </div>
      <EmergencyAlert />
      <VehicleDiagnosisForm />
    </div>
  );
}
