import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { WorkshopFinder } from "@/components/workshop-finder";

export const metadata: Metadata = {
  title: "Find a workshop",
  description:
    "Find workshops for your car brand in any city — powered by free OpenStreetMap data, with phone numbers and directions, no account needed.",
};

export default function WorkshopsPage() {
  return (
    <div className="space-y-6">
      <div className="rise-in">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
          <Wrench className="h-3.5 w-3.5" aria-hidden />
          Free · No account needed
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
          Find a workshop
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-zinc-400">
          Type your car brand (Audi, Mercedes, Hyundai…) and a city to find that brand’s workshops
          and dealers with phone numbers and directions — or use your current location. Results
          come from OpenStreetMap and are never stored.
        </p>
      </div>
      <WorkshopFinder />
    </div>
  );
}
