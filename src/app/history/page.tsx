import type { Metadata } from "next";
import { HistoryList } from "@/components/history-list";
import { SavedVehicles } from "@/components/saved-vehicles";

export const metadata: Metadata = {
  title: "History",
  description: "Your saved local diagnosis history.",
};

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
          Diagnosis history
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Reports you generated on this device are saved here.
        </p>
      </div>
      <HistoryList />
      <SavedVehicles />
    </div>
  );
}
