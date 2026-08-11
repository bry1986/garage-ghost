import type { Metadata } from "next";
import { Fingerprint } from "lucide-react";
import { ObdIiLookup } from "@/components/obd-ii-lookup";
import { VinDecoder } from "@/components/vin-decoder";

export const metadata: Metadata = {
  title: "VIN decoder",
  description:
    "Validate a 17-character VIN's check digit, decode its structure, and look up vehicle details via the free NHTSA database.",
};

export default function VinPage() {
  return (
    <div className="space-y-6">
      <div className="rise-in">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand">
          <Fingerprint className="h-3.5 w-3.5" aria-hidden />
          Free · No API key
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
          Decode a VIN
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-zinc-400">
          Paste a 17-character vehicle identification number to validate it and read its structure
          instantly — then optionally fetch make, model and plant details from the free NHTSA
          database.
        </p>
      </div>
      <VinDecoder />
      <ObdIiLookup />
    </div>
  );
}
