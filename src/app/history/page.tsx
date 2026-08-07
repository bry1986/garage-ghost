import type { Metadata } from "next";
import { HistoryList } from "@/components/history-list";

export const metadata: Metadata = {
  title: "History",
  description: "Your saved local diagnosis history.",
};

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Diagnosis history</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Reports you generated on this device are saved here.
        </p>
      </div>
      <HistoryList />
    </div>
  );
}
