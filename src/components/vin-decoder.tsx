"use client";

import { useState, type FormEvent } from "react";
import {
  Car,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Fingerprint,
  Globe2,
  Hash,
  Info,
  Loader2,
  MapPin,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EXAMPLE_VINS,
  decodeVin,
  decodeVinViaNhtsa,
  validateVinStructure,
  type NhtsaDecode,
  type VinDecodeResult,
} from "@/lib/vin";
import { cn } from "@/lib/utils";

const inputClasses =
  "w-full rounded-lg border border-zinc-700/80 bg-zinc-900/70 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-500 uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-[border-color,box-shadow,background-color] duration-150 hover:border-zinc-600 focus:border-brand focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand/20";

/** One labeled segment of the decoded VIN (WMI / VDS / check / VIS). */
function SegmentCard({
  label,
  value,
  note,
  highlight,
}: {
  label: string;
  value: string;
  note?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "card-sunken p-3",
        highlight && "border-brand/40 bg-brand/5"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm font-bold tracking-widest text-zinc-100">
        {value}
      </p>
      {note && <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">{note}</p>}
    </div>
  );
}

export function VinDecoder() {
  const [raw, setRaw] = useState("");
  const [decoded, setDecoded] = useState<VinDecodeResult | null>(null);
  const [structuralError, setStructuralError] = useState<string | null>(null);

  const [nhtsa, setNhtsa] = useState<NhtsaDecode | null>(null);
  const [nhtsaLoading, setNhtsaLoading] = useState(false);
  const [nhtsaError, setNhtsaError] = useState<string | null>(null);
  const [nhtsaNote, setNhtsaNote] = useState<string | null>(null);

  const vin = raw.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNhtsa(null);
    setNhtsaError(null);
    setNhtsaNote(null);
    const check = validateVinStructure(vin);
    if (!check.ok) {
      setStructuralError(check.error ?? null);
      setDecoded(null);
      return;
    }
    setStructuralError(null);
    setDecoded(decodeVin(vin));
  };

  const handleExample = (exampleVin: string) => {
    setRaw(exampleVin);
    setNhtsa(null);
    setNhtsaError(null);
    setNhtsaNote(null);
    setDecoded(decodeVin(exampleVin));
    setStructuralError(null);
  };

  const handleReset = () => {
    setRaw("");
    setDecoded(null);
    setStructuralError(null);
    setNhtsa(null);
    setNhtsaError(null);
    setNhtsaNote(null);
  };

  const handleNhtsa = async () => {
    if (!decoded || decoded.vin.length !== 17) return;
    setNhtsaLoading(true);
    setNhtsaError(null);
    setNhtsaNote(null);
    try {
      const result = await decodeVinViaNhtsa(decoded.vin);
      if (result) {
        setNhtsa(result);
      } else {
        setNhtsa(null);
        setNhtsaNote(
          "NHTSA has no record for this VIN — it may be a non-US-market vehicle or a very new model."
        );
      }
    } catch (cause) {
      console.error("Garage Ghost NHTSA lookup failed:", cause);
      setNhtsaError(
        "Could not reach the NHTSA service. The structural decode above still works offline — try again in a moment."
      );
    } finally {
      setNhtsaLoading(false);
    }
  };

  const nhtsaRows: { icon: typeof Car; label: string; value?: string }[] = nhtsa
    ? [
        { icon: Car, label: "Make / Model", value: [nhtsa.make, nhtsa.model].filter(Boolean).join(" ") },
        { icon: Hash, label: "Model year", value: nhtsa.modelYear },
        { icon: Fingerprint, label: "Body class", value: nhtsa.bodyClass },
        { icon: Globe2, label: "Vehicle type", value: nhtsa.vehicleType },
        { icon: ChevronRight, label: "Series / Trim", value: [nhtsa.series, nhtsa.trim].filter(Boolean).join(" ") },
        { icon: Info, label: "Engine", value: nhtsa.engine },
        { icon: CircleHelp, label: "Displacement / cylinders", value: [nhtsa.displacement, nhtsa.cylinders].filter(Boolean).join(" · ") },
        { icon: MapPin, label: "Assembly plant", value: [nhtsa.plantCompany, nhtsa.plantCity].filter(Boolean).join(", ") },
      ]
    : [];

  return (
    <div className="space-y-6 pb-16">
      {/* ------------------------------------------------ Input */}
      <section aria-labelledby="vin-input-heading" className="card-surface p-4 sm:p-6">
        <h2 id="vin-input-heading" className="sr-only">
          Enter your VIN
        </h2>
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div>
            <label htmlFor="vin" className="mb-1.5 block text-sm font-medium text-zinc-300">
              Vehicle identification number (VIN)
            </label>
            <input
              id="vin"
              name="vin"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={raw}
              onChange={(event) => {
                setRaw(event.target.value);
                if (structuralError) setStructuralError(null);
              }}
              placeholder="e.g. 1HGCM82633A004352"
              aria-invalid={Boolean(structuralError)}
              aria-describedby={structuralError ? "vin-error" : "vin-hint"}
              className={cn(inputClasses, structuralError && "border-red-500/70 focus:border-red-500")}
            />
            <p id="vin-hint" className="mt-1.5 text-xs text-zinc-500">
              17 characters, found on the dashboard near the windscreen or in the registration
              documents. VINs never contain I, O or Q.
            </p>
            {structuralError && (
              <p id="vin-error" role="alert" className="error-in mt-1.5 text-xs text-red-400">
                {structuralError}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={vin.length === 0}>
              <ScanLine className="h-4 w-4" aria-hidden />
              Decode VIN
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={handleReset} disabled={!raw && !decoded}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Reset
            </Button>
          </div>

          {/* Try examples */}
          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-3">
            <span className="text-xs text-zinc-500">Try an example:</span>
            {EXAMPLE_VINS.map((example) => (
              <button
                key={example.vin}
                type="button"
                onClick={() => handleExample(example.vin)}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/80 bg-zinc-900/70 px-3 py-1 font-mono text-[11px] text-zinc-300 transition-[transform,color,background-color,border-color] duration-150 hover:border-brand/60 hover:text-brand active:scale-95"
              >
                {example.vin}
                <span className="hidden font-sans text-zinc-500 sm:inline">· {example.label}</span>
              </button>
            ))}
          </div>
        </form>
      </section>

      {/* ------------------------------------------------ Structural decode */}
      {decoded && (
        <div className="stagger-in space-y-5">
          <section
            aria-labelledby="structural-heading"
            className="card-surface-raised p-4 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border",
                    decoded.checkDigitPassed
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-red-500/40 bg-red-500/10"
                  )}
                >
                  {decoded.checkDigitPassed ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" aria-hidden />
                  ) : (
                    <ShieldCheck className="h-4.5 w-4.5 text-red-400" aria-hidden />
                  )}
                </span>
                <div>
                  <h2 id="structural-heading" className="font-display text-lg font-bold tracking-tight text-zinc-50">
                    Structural decode
                  </h2>
                  <p className="mt-0.5 font-mono text-xs tracking-widest text-zinc-400">{decoded.vin}</p>
                </div>
              </div>
              <span
                className={cn(
                  "pop-in inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                  decoded.checkDigitPassed
                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/40"
                    : "bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/40"
                )}
              >
                {decoded.checkDigitPassed ? "Valid check digit" : "Check digit failed"}
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <SegmentCard label="WMI" value={decoded.wmi} note="World manufacturer identifier" highlight />
              <SegmentCard label="VDS" value={decoded.vds} note="Vehicle descriptor (positions 4–9)" />
              <SegmentCard
                label={`Check digit · ${decoded.checkDigit}`}
                value={decoded.checkDigitPassed ? "Pass" : "Fail"}
                note="Position 9 — validates the string"
                highlight={decoded.checkDigitPassed}
              />
              <SegmentCard label="VIS" value={decoded.vis} note="Vehicle identifier (positions 10–17)" />
            </div>

            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Region</dt>
                <dd className="mt-0.5 text-sm font-medium text-zinc-200">{decoded.region}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Country</dt>
                <dd className="mt-0.5 text-sm font-medium text-zinc-200">{decoded.country}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Model year</dt>
                <dd className="mt-0.5 text-sm font-medium text-zinc-200">
                  {Number.isFinite(decoded.modelYear)
                    ? `${decoded.modelYear}${decoded.modelYearFrom2010 ? " (2010+ cycle)" : ""}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Serial</dt>
                <dd className="mt-0.5 font-mono text-sm font-medium text-zinc-200">{decoded.serial}</dd>
              </div>
            </dl>
          </section>

          {/* ------------------------------------------------ NHTSA enrichment */}
          <section aria-labelledby="nhtsa-heading" className="card-surface p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand/30 bg-brand/10">
                  <Sparkles className="h-4.5 w-4.5 text-brand" aria-hidden />
                </span>
                <div>
                  <h2 id="nhtsa-heading" className="font-display text-base font-bold tracking-tight text-zinc-50">
                    Vehicle details
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Optional enrichment from the free NHTSA vPIC database (mainly US-market vehicles).
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleNhtsa}
                disabled={nhtsaLoading || Boolean(nhtsa)}
                variant={nhtsa ? "outline" : "primary"}
              >
                {nhtsaLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Fetching…
                  </>
                ) : nhtsa ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden />
                    Details loaded
                  </>
                ) : (
                  <>
                    <Globe2 className="h-4 w-4" aria-hidden />
                    Fetch details
                  </>
                )}
              </Button>
            </div>

            {nhtsaLoading && (
              <div className="mt-4 space-y-2" aria-hidden>
                <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div className="progress-sweep h-full w-1/3 rounded-full bg-brand/80" />
                </div>
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            )}

            {nhtsaError && (
              <p role="alert" className="error-in mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                {nhtsaError}
              </p>
            )}

            {nhtsaNote && (
              <p role="status" className="error-in mt-3 rounded-lg border border-zinc-700 bg-zinc-900/60 p-3 text-sm text-zinc-300">
                {nhtsaNote}
              </p>
            )}

            {nhtsa && (
              <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                {nhtsaRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start gap-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5"
                  >
                    <row.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                    <div className="min-w-0">
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        {row.label}
                      </dt>
                      <dd className="mt-0.5 truncate text-sm font-medium text-zinc-200">
                        {row.value || "—"}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            )}

            <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-zinc-500">
              <CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                A VIN alone never proves a vehicle&apos;s history, mileage or condition. Use it to
                identify the vehicle before a purchase or repair — and always have a workshop verify
                with the actual car.
              </span>
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
