import type { Metadata } from "next";
import { Stethoscope } from "lucide-react";
import { EmergencyAlert } from "@/components/emergency-alert";
import { VehicleDiagnosisForm } from "@/components/vehicle-diagnosis-form";

export const metadata: Metadata = {
  title: "New Diagnosis",
  description:
    "Describe your car's problem and receive safety-first educational guidance with repair cost estimates.",
  alternates: { canonical: "/diagnose" },
};

export default function DiagnosePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rise-in text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-600 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30">
          <Stethoscope className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
          New Diagnosis
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Describe your car&apos;s problem — it&apos;s free!
        </p>
      </div>
      <EmergencyAlert />
      <VehicleDiagnosisForm />
    </div>
  );
}
