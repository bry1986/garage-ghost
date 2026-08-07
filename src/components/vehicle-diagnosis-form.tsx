"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowRight,
  BookMarked,
  Camera,
  Car,
  Info,
  Loader2,
  ScanLine,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { DiagnosisResult, PrintFallback } from "@/components/diagnosis-result";
import {
  ACCEPTED_IMAGE_TYPES,
  FUEL_TYPES,
  LANGUAGES,
  MAX_IMAGE_BYTES,
  PRIMARY_BUTTON_CLASSES,
  PUTER_DEVELOPER_URL,
  SECONDARY_BUTTON_CLASSES,
  SYMPTOM_CHIPS,
} from "@/lib/constants";
import { describePuterError, runDiagnosis, type DiagnosisOutput } from "@/lib/diagnosis";
import { estimateRepairCosts, formatCostRange } from "@/lib/costs";
import { lookupDtc, type DtcEntry } from "@/lib/dtc";
import { deleteProfile, getProfiles, saveDiagnosis, saveProfile } from "@/lib/storage";
import { cn, generateId } from "@/lib/utils";
import type { ResponseLanguage, SavedVehicle, VehicleProfile } from "@/types/diagnostic";

const inputClasses =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 transition-colors hover:border-zinc-600 focus:border-amber-500 focus:outline-none";
const labelClasses = "mb-1.5 block text-sm font-medium text-zinc-300";
const legendClasses = "mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-200";

function buildStoredSymptoms(text: string, chips: string[]): string {
  if (chips.length === 0) return text;
  return `${text}${text ? " " : ""}[Selected: ${chips.join(", ")}]`;
}

export function VehicleDiagnosisForm() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [mileage, setMileage] = useState("");
  const [language, setLanguage] = useState<ResponseLanguage>("English");
  const [symptoms, setSymptoms] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [output, setOutput] = useState<DiagnosisOutput | null>(null);
  const [imageNote, setImageNote] = useState(false);
  const [lastVehicle, setLastVehicle] = useState<SavedVehicle | null>(null);

  // DTC lookup
  const [dtcInput, setDtcInput] = useState("");
  const [dtcResult, setDtcResult] = useState<DtcEntry | null>(null);
  const [dtcError, setDtcError] = useState<string | null>(null);
  const [dtcSearched, setDtcSearched] = useState(false);
  const [dtcNote, setDtcNote] = useState<string | null>(null);

  // Saved vehicle profiles
  const [profiles, setProfiles] = useState<VehicleProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profileNote, setProfileNote] = useState<string | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reading the external localStorage store once after mount (client only).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- external-store read on mount is intentional here
    setProfiles(getProfiles());
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((item) => item !== chip) : [...prev, chip]
    );
  };

  const handleDtcLookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const raw = dtcInput.trim();
    if (raw.length === 0) {
      setDtcError("Enter an OBD-II code, e.g. P0300.");
      setDtcResult(null);
      setDtcSearched(false);
      return;
    }
    setDtcError(null);
    setDtcResult(lookupDtc(raw));
    setDtcSearched(true);
  };

  const applyDtcToSymptoms = (entry: DtcEntry) => {
    setSymptoms((prev) => {
      const text = prev.trim();
      if (text.length === 0) {
        return `Diagnostic trouble code ${entry.code} — describe what you notice.`;
      }
      return text.toUpperCase().includes(entry.code) ? text : `${text} (DTC ${entry.code})`;
    });
    setDtcInput("");
    setDtcResult(null);
    setDtcSearched(false);
    setDtcError(null);
    setDtcNote(`Added ${entry.code} to your symptom description below.`);
  };

  const canSaveProfile =
    brand.trim().length > 0 && model.trim().length > 0 && /^\d{4}$/.test(year.trim());

  const handleSaveProfile = () => {
    if (!canSaveProfile) return;
    const profile: VehicleProfile = {
      id: generateId(),
      label: [brand.trim(), model.trim(), year.trim()].join(" "),
      vehicle: {
        brand: brand.trim(),
        model: model.trim(),
        year: year.trim(),
        fuelType: fuelType.trim() || undefined,
        mileage: mileage.trim() || undefined,
      },
      createdAt: Date.now(),
    };
    saveProfile(profile);
    setProfiles(getProfiles());
    setSelectedProfileId(profile.id);
    setProfileNote(`Saved \u201c${profile.label}\u201d for quick reuse.`);
  };

  const handleProfileSelect = (id: string) => {
    setSelectedProfileId(id);
    const profile = profiles.find((item) => item.id === id);
    if (!profile) return;
    setBrand(profile.vehicle.brand);
    setModel(profile.vehicle.model);
    setYear(profile.vehicle.year);
    setFuelType(profile.vehicle.fuelType ?? "");
    setMileage(profile.vehicle.mileage ?? "");
    setProfileNote(`Loaded \u201c${profile.label}\u201d.`);
  };

  const handleDeleteProfile = () => {
    if (!selectedProfileId) return;
    const profile = profiles.find((item) => item.id === selectedProfileId);
    deleteProfile(selectedProfileId);
    setProfiles(getProfiles());
    setSelectedProfileId("");
    setProfileNote(`Removed saved vehicle${profile ? ` \u201c${profile.label}\u201d` : ""}.`);
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null);
    setImagePreview(null);
    setImageError(null);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageError(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null);
    setImagePreview(null);
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Unsupported file type. Please upload a JPG, PNG or WebP photo.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("The photo is larger than 10 MB. Please choose a smaller image.");
      return;
    }
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    // Reset the input so selecting the same file again still fires onChange.
    event.currentTarget.value = "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const problems: string[] = [];
    if (brand.trim().length === 0) problems.push("Brand is required.");
    if (model.trim().length === 0) problems.push("Model is required.");
    const yearValue = year.trim();
    if (!/^\d{4}$/.test(yearValue)) {
      problems.push("Enter a valid 4-digit year.");
    } else {
      const numericYear = Number(yearValue);
      const currentYear = new Date().getFullYear();
      if (numericYear < 1900 || numericYear > currentYear + 1) {
        problems.push(`Year must be between 1900 and ${currentYear + 1}.`);
      }
    }
    if (symptoms.trim().length === 0) problems.push("Describe your symptoms.");

    if (problems.length > 0) {
      setValidationError(problems.join(" "));
      return;
    }

    setValidationError(null);
    setError(null);
    setOutput(null);
    setImageNote(image !== null);
    setLoading(true);
    setLoadingStatus("Preparing your vehicle report…");

    try {
      const vehicle = {
        brand: brand.trim(),
        model: model.trim(),
        year: yearValue,
        fuelType: fuelType.trim() || undefined,
        mileage: mileage.trim() || undefined,
      };
      const diagnosis = await runDiagnosis(
        {
          vehicle,
          symptoms: symptoms.trim(),
          symptomChips: selectedChips,
          language,
          image: image ?? undefined,
        },
        setLoadingStatus
      );
      setOutput(diagnosis);
      setLastVehicle(vehicle);
      saveDiagnosis({
        id: generateId(),
        createdAt: Date.now(),
        source: diagnosis.source,
        vehicle,
        language,
        symptoms: buildStoredSymptoms(symptoms.trim(), selectedChips),
        result: diagnosis.result,
      });
      window.requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (cause) {
      console.error("Garage Ghost analysis failed:", cause);
      setError(describePuterError(cause));
    } finally {
      setLoading(false);
    }
  };

  const vehicleLabel = [brand.trim(), model.trim(), year.trim()].filter(Boolean).join(" ");

  // FIXD-style ballpark cost for the DTC card (derived during render, not a hook).
  const dtcCostLine = dtcResult
    ? (() => {
        const costs = estimateRepairCosts({
          detectedWarning: dtcResult.description,
          summary: dtcResult.advice,
          possibleCauses: dtcResult.possibleCauses.map((cause) => ({ cause })),
          riskLevel: dtcResult.urgency === "high" ? "DRIVE_CAREFULLY" : "BOOK_SERVICE",
        });
        const top = costs.estimates[0];
        return top ? `${top.label}: ${formatCostRange(top)}` : null;
      })()
    : null;

  return (
    <div className="space-y-8">
      {/* OBD-II code lookup — instant, no AI needed */}
      <section
        aria-labelledby="dtc-heading"
        className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
      >
        <h2
          id="dtc-heading"
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-200"
        >
          <ScanLine className="h-4 w-4 text-amber-400" aria-hidden />
          OBD-II code lookup
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          Have a code from an OBD-II scanner (e.g. <code className="text-zinc-400">P0300</code>)?
          Get an instant plain-English explanation — free and no AI call needed.
        </p>
        <form onSubmit={handleDtcLookup} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="dtc-code" className="sr-only">
            OBD-II code
          </label>
          <input
            id="dtc-code"
            name="dtc-code"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={dtcInput}
            onChange={(event) => setDtcInput(event.target.value)}
            placeholder="e.g. P0300"
            className={cn(inputClasses, "uppercase sm:max-w-44")}
          />
          <button type="submit" className={cn(SECONDARY_BUTTON_CLASSES, "shrink-0")}>
            <Search className="h-4 w-4" aria-hidden />
            Look up
          </button>
        </form>
        {dtcError && (
          <p role="alert" className="mt-2 text-xs text-red-400">
            {dtcError}
          </p>
        )}
        {dtcResult && (
          <div
            role="status"
            className="mt-3 rounded-md border border-zinc-700 bg-zinc-950/60 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-amber-500/15 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
                {dtcResult.code}
              </span>
              <span className="text-xs font-medium text-zinc-400">{dtcResult.system}</span>
              <span
                className={cn(
                  "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  dtcResult.urgency === "high"
                    ? "bg-red-500/15 text-red-300"
                    : dtcResult.urgency === "medium"
                      ? "bg-amber-500/15 text-amber-300"
                      : "bg-sky-500/15 text-sky-300"
                )}
              >
                {dtcResult.urgency === "high"
                  ? "Act promptly"
                  : dtcResult.urgency === "medium"
                    ? "Book service"
                    : "Low urgency"}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-zinc-200">{dtcResult.description}</p>
            <ul className="mt-2 space-y-1">
              {dtcResult.possibleCauses.map((cause, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-zinc-400">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-500" aria-hidden />
                  <span>{cause}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">{dtcResult.advice}</p>
            {dtcCostLine && (
              <p className="mt-2 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">Est. typical cost:</span> {dtcCostLine}{" "}
                — rough ballpark, varies by vehicle, region and workshop.
              </p>
            )}
            <button
              type="button"
              onClick={() => applyDtcToSymptoms(dtcResult)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-amber-500/60 hover:text-amber-300"
            >
              Use this code in the analysis
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        )}
        {dtcSearched && !dtcResult && !dtcError && (
          <p role="status" className="mt-2 text-xs text-zinc-500">
            No entry for that code in our reference yet. You can still describe the symptoms below
            and analyze them with AI.
          </p>
        )}
        {dtcNote && (
          <p role="status" aria-live="polite" className="mt-2 text-xs text-amber-300">
            {dtcNote}
          </p>
        )}
        <p className="mt-2 text-xs text-zinc-600">
          A stored code points at the system a fault was recorded in — it is not a diagnosis.
          Always confirm with a qualified workshop scan when in doubt.
        </p>
      </section>

      {/* Saved vehicles */}
      <section
        aria-labelledby="profiles-heading"
        className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
      >
        <h2
          id="profiles-heading"
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-200"
        >
          <Car className="h-4 w-4 text-amber-400" aria-hidden />
          Saved vehicles
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Save a vehicle once, then load it with one click for the next diagnosis. Stored only in
          this browser.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="profile-select" className="sr-only">
            Saved vehicles
          </label>
          <select
            id="profile-select"
            value={selectedProfileId}
            onChange={(event) => handleProfileSelect(event.target.value)}
            className={cn(inputClasses, "appearance-none sm:max-w-xs")}
          >
            <option value="">Select a saved vehicle…</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.label}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={!canSaveProfile}
              className={cn(
                SECONDARY_BUTTON_CLASSES,
                "shrink-0",
                !canSaveProfile && "cursor-not-allowed opacity-50"
              )}
              title="Fill in brand, model and year above, then save"
            >
              <BookMarked className="h-4 w-4" aria-hidden />
              Save current vehicle
            </button>
            {selectedProfileId && (
              <button
                type="button"
                onClick={handleDeleteProfile}
                className="inline-flex shrink-0 items-center gap-2 rounded-md border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-red-500/60 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Delete saved
              </button>
            )}
          </div>
        </div>
        {profileNote && (
          <p aria-live="polite" className="mt-2 text-xs text-amber-300">
            {profileNote}
          </p>
        )}
      </section>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Vehicle details */}
          <fieldset className="space-y-4">
            <legend className={legendClasses}>Vehicle details</legend>
            <div>
              <label htmlFor="brand" className={labelClasses}>
                Brand <span className="text-red-400" aria-hidden>*</span>
              </label>
              <input
                id="brand"
                name="brand"
                type="text"
                autoComplete="off"
                required
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                placeholder="e.g. Audi"
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="model" className={labelClasses}>
                Model <span className="text-red-400" aria-hidden>*</span>
              </label>
              <input
                id="model"
                name="model"
                type="text"
                autoComplete="off"
                required
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="e.g. A3"
                className={inputClasses}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="year" className={labelClasses}>
                  Year <span className="text-red-400" aria-hidden>*</span>
                </label>
                <input
                  id="year"
                  name="year"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  required
                  value={year}
                  onChange={(event) => setYear(event.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 2017"
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="mileage" className={labelClasses}>
                  Mileage <span className="font-normal text-zinc-500">(optional)</span>
                </label>
                <input
                  id="mileage"
                  name="mileage"
                  type="text"
                  inputMode="numeric"
                  value={mileage}
                  onChange={(event) => setMileage(event.target.value)}
                  placeholder="e.g. 145000 km"
                  className={inputClasses}
                />
              </div>
            </div>
            <div>
              <label htmlFor="fuelType" className={labelClasses}>
                Fuel / power type <span className="font-normal text-zinc-500">(optional)</span>
              </label>
              <select
                id="fuelType"
                name="fuelType"
                value={fuelType}
                onChange={(event) => setFuelType(event.target.value)}
                className={cn(inputClasses, "appearance-none")}
              >
                <option value="">Select…</option>
                {FUEL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="language" className={labelClasses}>
                Response language
              </label>
              <select
                id="language"
                name="language"
                value={language}
                onChange={(event) => setLanguage(event.target.value as ResponseLanguage)}
                className={cn(inputClasses, "appearance-none")}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>

          {/* Symptoms */}
          <fieldset className="space-y-4">
            <legend className={legendClasses}>Symptoms</legend>
            <div>
              <label htmlFor="symptoms" className={labelClasses}>
                What are you noticing? <span className="text-red-400" aria-hidden>*</span>
              </label>
              <textarea
                id="symptoms"
                name="symptoms"
                required
                rows={5}
                value={symptoms}
                onChange={(event) => setSymptoms(event.target.value)}
                placeholder="e.g. Orange engine light and loss of power above 2500 RPM. When did it start, how often does it happen, does it change with speed or temperature?"
                className={cn(inputClasses, "resize-y")}
              />
            </div>

            <div>
              <span className={labelClasses}>Quick symptom chips (optional)</span>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Common symptoms">
                {SYMPTOM_CHIPS.map((chip) => {
                  const selected = selectedChips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleChip(chip)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        selected
                          ? "border-amber-500 bg-amber-500/15 text-amber-300"
                          : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
                      )}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="image" className={labelClasses}>
                Dashboard warning-light photo{" "}
                <span className="font-normal text-zinc-500">(optional)</span>
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <label className="inline-flex cursor-pointer items-center gap-2 self-start rounded-md border border-dashed border-zinc-600 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-amber-500/60 hover:text-zinc-100 focus-within:ring-2 focus-within:ring-amber-500">
                  <Camera className="h-4 w-4" aria-hidden />
                  {image ? "Change photo" : "Upload photo"}
                  <input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handleImageChange}
                  />
                </label>
                {imagePreview && (
                  <div className="flex items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- client-side blob URL preview; next/image does not apply */}
                    <img
                      src={imagePreview}
                      alt="Preview of the uploaded dashboard warning-light photo"
                      className="h-20 w-32 rounded-md border border-zinc-700 object-cover"
                    />
                    <div className="text-xs text-zinc-400">
                      <p className="max-w-[12rem] truncate">{image?.name}</p>
                      <button
                        type="button"
                        onClick={clearImage}
                        className="mt-1 font-medium text-red-400 underline-offset-2 hover:underline"
                      >
                        Remove photo
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {imageError ? (
                <p role="alert" className="mt-1.5 text-xs text-red-400">
                  {imageError}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-zinc-500">
                  Images are optional and do not guarantee correct identification. When attached,
                  your photo is sent together with your written description to help the analysis.
                </p>
              )}
            </div>
          </fieldset>
        </div>

        <div className="space-y-3">
          <button
            type="submit"
            disabled={loading}
            className={cn(
              PRIMARY_BUTTON_CLASSES,
              "w-full sm:w-auto",
              loading && "cursor-not-allowed opacity-60"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Analyzing…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Analyze safely
              </>
            )}
          </button>
          <p aria-live="polite" role="status" className="min-h-5 text-xs text-amber-300">
            {loading ? loadingStatus : ""}
          </p>
          {validationError && (
            <p role="alert" className="text-sm text-red-400">
              {validationError}
            </p>
          )}
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-xs leading-relaxed text-zinc-400">
        <p className="flex items-center gap-1.5 font-medium text-zinc-300">
          <Info className="h-3.5 w-3.5 text-amber-400" aria-hidden />
          About AI analysis
        </p>
        <p className="mt-1">
          Analysis is provided by{" "}
          <a
            href={PUTER_DEVELOPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-300 underline underline-offset-2 hover:text-amber-200"
          >
            Puter
          </a>{" "}
          using a user-pays model: you may be asked to sign in with a Puter account and cover your
          own usage. No API key is used or stored by this app.
        </p>
      </div>

      {output ? (
        <div ref={resultRef} className="scroll-mt-24">
          <DiagnosisResult
            result={output.result}
            source={output.source}
            vehicleLabel={vehicleLabel}
            imageNote={imageNote}
            vehicle={lastVehicle ?? undefined}
            symptoms={symptoms.trim()}
            language={language}
          />
        </div>
      ) : (
        <PrintFallback />
      )}
    </div>
  );
}
