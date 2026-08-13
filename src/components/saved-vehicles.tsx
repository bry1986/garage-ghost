"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Car, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProfile, getProfiles } from "@/lib/storage";
import type { VehicleProfile } from "@/types/diagnostic";

/**
 * Saved vehicle profiles management — lives on the History page so the
 * diagnosis form stays a clean step flow. Loading a profile deep-links back
 * to the diagnosis form with the vehicle prefilled (?vehicle=ID).
 */
export function SavedVehicles() {
  const [profiles, setProfiles] = useState<VehicleProfile[]>([]);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    // Reading the external localStorage store once after mount (client only).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- external-store read on mount is intentional here
    setProfiles(getProfiles());
  }, []);

  const handleDelete = (id: string, label: string) => {
    deleteProfile(id);
    setProfiles(getProfiles());
    setNote(`Removed saved vehicle “${label}”.`);
  };

  return (
    <section aria-labelledby="saved-vehicles-heading" className="card-surface p-4 sm:p-5">
      <h2
        id="saved-vehicles-heading"
        className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-200"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand/30 bg-brand/10">
          <Car className="h-4 w-4 text-brand" aria-hidden />
        </span>
        Saved vehicles
      </h2>
      <p className="mt-1 text-xs text-zinc-500">
        Vehicles you saved for reuse. Stored only in this browser. Load one into a new diagnosis
        with a single click.
      </p>

      {profiles.length === 0 ? (
        <p className="mt-3 rounded-md border border-zinc-700/60 bg-zinc-900/40 p-3 text-xs text-zinc-400">
          No saved vehicles yet. While filling in a diagnosis, use “Save this vehicle” to keep it
          here for quick reuse.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {profiles.map((profile) => (
            <li
              key={profile.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-zinc-700/60 bg-zinc-900/40 px-3 py-2.5"
            >
              <div className="min-w-0">
                {/* Saved names are user data — never machine-translated. */}
                <p className="truncate text-sm font-medium text-zinc-100" data-skip-translate>
                  {profile.label}
                </p>
                {profile.vehicle.mileage && (
                  <p className="mt-0.5 text-xs text-zinc-500" data-skip-translate>
                    {profile.vehicle.mileage}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/diagnose?vehicle=${encodeURIComponent(profile.id)}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-brand/60 hover:text-brand"
                >
                  Use in diagnosis
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(profile.id, profile.label)}
                  aria-label={`Delete saved vehicle ${profile.label}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {note && (
        <p aria-live="polite" className="mt-2 text-xs text-brand">
          {note}
        </p>
      )}
    </section>
  );
}
