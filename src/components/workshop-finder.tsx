"use client";

import { useState, type FormEvent } from "react";
import {
  Clock,
  ExternalLink,
  Globe2,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Search,
  ShieldAlert,
  Store,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  directionsUrl,
  fetchNearbyWorkshops,
  formatDistance,
  geocodePlace,
  getCurrentPosition,
  type LatLon,
  type LocationError,
  type Workshop,
} from "@/lib/workshops";
import { cn } from "@/lib/utils";

const RADIUS_OPTIONS = [
  { value: 5000, label: "5 km" },
  { value: 10000, label: "10 km" },
  { value: 25000, label: "25 km" },
] as const;

const COMMON_BRANDS = [
  "Alfa Romeo",
  "Audi",
  "BMW",
  "BYD",
  "Chevrolet",
  "Citroën",
  "Dacia",
  "Fiat",
  "Ford",
  "Honda",
  "Hyundai",
  "Jeep",
  "Kia",
  "Land Rover",
  "Lexus",
  "Mazda",
  "Mercedes-Benz",
  "Mini",
  "Mitsubishi",
  "Nissan",
  "Opel",
  "Peugeot",
  "Porsche",
  "Renault",
  "Seat",
  "Škoda",
  "Subaru",
  "Suzuki",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
];

const inputClasses =
  "w-full rounded-lg border border-zinc-700/80 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-[border-color,box-shadow,background-color] duration-150 hover:border-zinc-600 focus:border-amber-500 focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20";

export function WorkshopFinder() {
  const [brand, setBrand] = useState("");
  const [place, setPlace] = useState("");
  const [radius, setRadius] = useState<number>(10000);
  const [locationLabel, setLocationLabel] = useState("");
  const [workshops, setWorkshops] = useState<Workshop[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const search = async (origin: LatLon, label: string) => {
    setLoading(true);
    setError(null);
    setStatus("Searching the workshop directory…");
    setLocationLabel(label);
    try {
      const results = await fetchNearbyWorkshops(origin, radius, brand.trim() || undefined);
      setWorkshops(results);
    } catch (cause) {
      console.error("Garage Ghost workshop search failed:", cause);
      setWorkshops(null);
      setError(
        cause instanceof Error
          ? cause.message
          : "The workshop directory could not be reached. Please try again in a moment."
      );
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const handleLocate = async () => {
    setError(null);
    setStatus("Locating you…");
    try {
      const position = await getCurrentPosition();
      await search(position, "your location");
    } catch (cause) {
      const locationError = cause as LocationError;
      setError(locationError.message ?? "Could not determine your location.");
      setStatus("");
    }
  };

  const handlePlaceSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = place.trim();
    if (query.length === 0) return;
    setError(null);
    setStatus(`Finding “${query}”…`);
    try {
      const position = await geocodePlace(query);
      await search(position, query);
    } catch (cause) {
      console.error("Garage Ghost geocoding failed:", cause);
      setWorkshops(null);
      setError(
        cause instanceof Error
          ? cause.message
          : "That place could not be found. Try a city or town name."
      );
      setStatus("");
    }
  };

  const brandQuery = brand.trim();
  const displayBrand = brandQuery
    ? brandQuery
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" ")
    : "";
  const resultsCount = workshops?.length ?? 0;

  return (
    <div className="space-y-6 pb-16">
      {/* ------------------------------------------------ Search */}
      <section aria-labelledby="workshop-search-heading" className="card-surface p-4 sm:p-6">
        <h2 id="workshop-search-heading" className="sr-only">
          Find workshops near you
        </h2>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="button" onClick={handleLocate} disabled={loading} size="lg">
            {loading && status === "Locating you…" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LocateFixed className="h-4 w-4" aria-hidden />
            )}
            Use my location
          </Button>
          <span aria-hidden className="hidden h-5 w-px bg-zinc-700/80 sm:block" />
          <span className="text-xs text-zinc-500">or search by brand &amp; city:</span>
        </div>

        <form onSubmit={handlePlaceSearch} className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div>
            <label htmlFor="brand" className="sr-only">
              Car brand
            </label>
            <input
              id="brand"
              name="brand"
              type="text"
              list="common-car-brands"
              autoComplete="off"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              placeholder="Car brand · e.g. Audi"
              className={inputClasses}
            />
            <datalist id="common-car-brands">
              {COMMON_BRANDS.map((candidate) => (
                <option key={candidate} value={candidate} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="place" className="sr-only">
              City
            </label>
            <input
              id="place"
              name="place"
              type="text"
              autoComplete="off"
              value={place}
              onChange={(event) => setPlace(event.target.value)}
              placeholder="City · e.g. Munich"
              className={inputClasses}
            />
          </div>
          <Button type="submit" variant="outline" disabled={loading || place.trim().length === 0} className="shrink-0">
            <Search className="h-4 w-4" aria-hidden />
            Search
          </Button>
        </form>

        <p className="mt-2 text-[11px] text-zinc-500">
          Leave the brand empty to list every repair workshop in the city — add a brand (Audi,
          Mercedes, Hyundai…) to narrow results to that brand’s workshops and dealers.
        </p>

        {/* Radius */}
        <div className="mt-4 border-t border-zinc-800 pt-3">
          <span className="text-xs font-medium text-zinc-400">Search radius</span>
          <div className="mt-1.5 flex flex-wrap gap-2" role="group" aria-label="Search radius">
            {RADIUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={radius === option.value}
                onClick={() => setRadius(option.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-[transform,color,background-color,border-color,box-shadow] duration-150 active:scale-95",
                  radius === option.value
                    ? "border-amber-500 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "border-zinc-700/80 bg-zinc-900/70 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="mt-4" aria-hidden>
            <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="progress-sweep h-full w-1/3 rounded-full bg-amber-500/80" />
            </div>
          </div>
        )}
        <p aria-live="polite" role="status" className="mt-2 min-h-5 text-xs text-amber-300">
          {status}
        </p>

        {error && (
          <p role="alert" className="error-in mt-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </p>
        )}
      </section>

      {/* ------------------------------------------------ Results */}
      {workshops && (
        <section aria-labelledby="workshop-results-heading" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="workshop-results-heading" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-zinc-50">
              <Store className="h-4.5 w-4.5 text-amber-400" aria-hidden />
              {resultsCount} {displayBrand ? `${displayBrand} ` : ""}workshop{resultsCount === 1 ? "" : "s"} near {locationLabel}
            </h2>
            <p className="text-xs text-zinc-500">Within {formatDistance(radius)}</p>
          </div>

          {resultsCount === 0 ? (
            <div className="card-surface p-10 text-center">
              <MapPin className="mx-auto h-6 w-6 text-zinc-600" aria-hidden />
              <p className="mt-3 text-sm text-zinc-400">
                {displayBrand ? (
                  <>
                    No <span className="font-semibold text-zinc-300">{displayBrand}</span>{" "}
                    workshops found near {locationLabel}. Try a wider radius, a different city, or
                    check the brand spelling.
                  </>
                ) : (
                  "No car-repair workshops found nearby. Try a wider radius or a different place."
                )}
              </p>
            </div>
          ) : (
            <ol className="stagger-in space-y-3">
              {workshops.map((workshop) => (
                <li key={workshop.id} className="card-surface card-lift p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-zinc-100">
                        <Wrench className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                        <span className="truncate">{workshop.name}</span>
                      </h3>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {[workshop.brand, workshop.operator].filter(Boolean).join(" · ") || "Car repair"}
                      </p>
                    </div>
                    <span className="pop-in inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300 ring-1 ring-inset ring-amber-500/30">
                      <Navigation className="h-3 w-3" aria-hidden />
                      {formatDistance(workshop.distanceMeters)}
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                    {workshop.address && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
                        {workshop.address}
                      </span>
                    )}
                    {workshop.phone && (
                      <a
                        href={`tel:${workshop.phone.replace(/[^+\d]/g, "")}`}
                        className="flex items-center gap-1.5 text-zinc-300 underline-offset-2 transition-colors hover:text-amber-300 hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
                        {workshop.phone}
                      </a>
                    )}
                    {workshop.openingHours && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
                        {workshop.openingHours}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={directionsUrl(workshop)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/80 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-[transform,color,background-color,border-color] duration-150 hover:border-amber-500/60 hover:text-amber-300 active:scale-[0.97]"
                    >
                      <Navigation className="h-3.5 w-3.5" aria-hidden />
                      Directions
                    </a>
                    {workshop.website && (
                      <a
                        href={workshop.website.startsWith("http") ? workshop.website : `https://${workshop.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/80 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-[transform,color,background-color,border-color] duration-150 hover:border-amber-500/60 hover:text-amber-300 active:scale-[0.97]"
                      >
                        <Globe2 className="h-3.5 w-3.5" aria-hidden />
                        Website
                        <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-[11px] leading-relaxed text-zinc-500">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
            <p>
              Results come from community-edited OpenStreetMap data and may be incomplete or out of
              date — verify a workshop before visiting. Red light, smoke or braking trouble? Stop
              safely and call roadside assistance first.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
