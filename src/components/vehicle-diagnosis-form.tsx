"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import {
  ArrowRight,
  Battery,
  BookMarked,
  Camera,
  Car,
  CircleHelp,
  CloudFog,
  Cog,
  Compass,
  Disc3,
  Fuel,
  Gauge,
  ImagePlus,
  Info,
  Loader2,
  ScanLine,
  Search,
  ShieldCheck,
  Thermometer,
  Trash2,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { DiagnosisResult, PrintFallback } from "@/components/diagnosis-result";
import { FixedDisclaimer } from "@/components/fixed-disclaimer";
import { Stepper, type DiagnosisStep } from "@/components/stepper";
import { SymptomSafetyWarning } from "@/components/symptom-safety-warning";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ACCEPTED_IMAGE_TYPES,
  FUEL_TYPES,
  LANGUAGES,
  MAX_IMAGE_BYTES,
  PUTER_DEVELOPER_URL,
  SYMPTOM_CHIPS,
} from "@/lib/constants";
import { describePuterError, runDiagnosis, type DiagnosisOutput } from "@/lib/diagnosis";
import { estimateRepairCosts, formatCostRange } from "@/lib/costs";
import { lookupDtc, type DtcEntry } from "@/lib/dtc";
import { deleteProfile, getProfiles, saveDiagnosis, saveProfile } from "@/lib/storage";
import { cn, generateId } from "@/lib/utils";
import type { ResponseLanguage, SavedVehicle, VehicleProfile } from "@/types/diagnostic";

const inputClasses =
  "w-full rounded-lg border border-zinc-700/80 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-[border-color,box-shadow,background-color] duration-150 hover:border-zinc-600 focus:border-amber-500 focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20";
const labelClasses = "mb-1.5 block text-sm font-medium text-zinc-300";

/** Fields that can carry an inline validation error. */
type FieldKey = "brand" | "model" | "year" | "symptoms";

/** Lucide icon per quick symptom chip (automotive command-center visual). */
const CHIP_ICONS: Record<(typeof SYMPTOM_CHIPS)[number], typeof Gauge> = {
  "Loss of power": Gauge,
  "Engine noise": Cog,
  Vibrations: Waves,
  Smoke: CloudFog,
  "Fuel smell": Fuel,
  Overheating: Thermometer,
  "Hard braking": Disc3,
  "Steering issue": Compass,
  "Battery problem": Battery,
  "Strange electrical smell": Zap,
};

function buildStoredSymptoms(text: string, chips: string[]): string {
  if (chips.length === 0) return text;
  return `${text}${text ? " " : ""}[Selected: ${chips.join(", ")}]`;
}

function ResultSkeleton() {
  return (
    <div className="card-surface space-y-5 p-5 sm:p-6" aria-hidden>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <Skeleton className="h-9 w-36 rounded-md" />
        <Skeleton className="h-9 w-44 rounded-md" />
      </div>
    </div>
  );
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
  const [dragging, setDragging] = useState(false);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
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
  const vehicleRef = useRef<HTMLFieldSetElement>(null);
  const symptomsRef = useRef<HTMLFieldSetElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

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

  // ---------------------------------------------------------------------
  // Guided-step derivation (visual only — the form stays on one page)
  // ---------------------------------------------------------------------
  const vehicleComplete = brand.trim().length > 0 && model.trim().length > 0 && /^\d{4}$/.test(year.trim());
  const symptomsComplete = symptoms.trim().length > 0;
  const assessmentActive = loading || output !== null;

  const currentStep: number = assessmentActive ? 3 : symptomsComplete ? 2 : vehicleComplete ? 1 : 0;
  const activeStep: DiagnosisStep = assessmentActive
    ? "assessment"
    : symptomsComplete
      ? "symptoms"
      : "vehicle";

  const navigateTo = (step: DiagnosisStep) => {
    const target = step === "vehicle" ? vehicleRef : step === "symptoms" ? symptomsRef : resultRef;
    target.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ---------------------------------------------------------------------
  const clearFieldError = (field: FieldKey) => {
    setFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

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
    clearFieldError("symptoms");
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
    setProfileNote(`Saved “${profile.label}” for quick reuse.`);
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
    setProfileNote(`Loaded “${profile.label}”.`);
    clearFieldError("brand");
    clearFieldError("model");
    clearFieldError("year");
  };

  const handleDeleteProfile = () => {
    if (!selectedProfileId) return;
    const profile = profiles.find((item) => item.id === selectedProfileId);
    deleteProfile(selectedProfileId);
    setProfiles(getProfiles());
    setSelectedProfileId("");
    setProfileNote(`Removed saved vehicle${profile ? ` “${profile.label}”` : ""}.`);
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null);
    setImagePreview(null);
    setImageError(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const acceptImageFile = (file: File | null) => {
    setImageError(null);
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Unsupported file type. Please upload a JPG, PNG or WebP photo.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("The photo is larger than 10 MB. Please choose a smaller image.");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    acceptImageFile(event.target.files?.[0] ?? null);
    // Reset the input so selecting the same file again still fires onChange.
    event.currentTarget.value = "";
  };

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    dragCounter.current += 1;
    setDragging(true);
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setDragging(false);
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    acceptImageFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Guard against accidental double submissions while a request is in flight.
    if (loading) return;

    // Field-level errors are shown inline next to each input, plus one
    // aggregate alert near the button so assistive tech announces them.
    const nextFieldErrors: Partial<Record<FieldKey, string>> = {};
    if (brand.trim().length === 0) nextFieldErrors.brand = "Brand is required.";
    if (model.trim().length === 0) nextFieldErrors.model = "Model is required.";
    const yearValue = year.trim();
    if (!/^\d{4}$/.test(yearValue)) {
      nextFieldErrors.year = "Enter a valid 4-digit year.";
    } else {
      const numericYear = Number(yearValue);
      const currentYear = new Date().getFullYear();
      if (numericYear < 1900 || numericYear > currentYear + 1) {
        nextFieldErrors.year = `Year must be between 1900 and ${currentYear + 1}.`;
      }
    }
    if (symptoms.trim().length === 0) nextFieldErrors.symptoms = "Describe your symptoms.";

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setValidationError("Please fix the highlighted fields before analyzing.");
      vehicleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setValidationError(null);
    setFieldErrors({});
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

  const startAnotherAssessment = () => {
    setOutput(null);
    setError(null);
    setValidationError(null);
    setFieldErrors({});
    setImageNote(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="space-y-8 pb-16">
      {/* Guided 3-step progress */}
      <Stepper current={currentStep} active={activeStep} onNavigate={navigateTo} />

      {/* OBD-II code lookup — instant, no AI needed */}
      <section
        aria-labelledby="dtc-heading"
        className="card-surface p-4 sm:p-5"
      >
        <h2
          id="dtc-heading"
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-200"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10">
            <ScanLine className="h-4 w-4 text-amber-400" aria-hidden />
          </span>
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
          <Button type="submit" variant="outline" className="shrink-0">
            <Search className="h-4 w-4" aria-hidden />
            Look up
          </Button>
        </form>
        {dtcError && (
          <p role="alert" className="mt-2 text-xs text-red-400">
            {dtcError}
          </p>
        )}
        {dtcResult && (
          <div role="status" className="mt-3 rounded-md border border-zinc-700 bg-zinc-950/60 p-3">
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
            <Button
              type="button"
              onClick={() => applyDtcToSymptoms(dtcResult)}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Use this code in the analysis
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Button>
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
      <section aria-labelledby="profiles-heading" className="card-surface p-4 sm:p-5">
        <h2
          id="profiles-heading"
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-200"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10">
            <Car className="h-4 w-4 text-amber-400" aria-hidden />
          </span>
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
            <Button
              type="button"
              onClick={handleSaveProfile}
              disabled={!canSaveProfile}
              variant="outline"
              className="shrink-0"
              title="Fill in brand, model and year above, then save"
            >
              <BookMarked className="h-4 w-4" aria-hidden />
              Save current vehicle
            </Button>
            {selectedProfileId && (
              <Button
                type="button"
                onClick={handleDeleteProfile}
                variant="danger"
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Delete saved
              </Button>
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
          {/* ------------------------------ Step 1: Vehicle */}
          <fieldset ref={vehicleRef} className="scroll-mt-24 space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
            <legend className="flex items-center gap-2 px-1.5 text-sm font-semibold uppercase tracking-wide text-zinc-200">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-zinc-950 shadow-[0_0_14px_rgba(245,158,11,0.35)]">
                1
              </span>
              Vehicle details
            </legend>
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
                aria-invalid={Boolean(fieldErrors.brand)}
                aria-describedby={fieldErrors.brand ? "brand-error" : undefined}
                onChange={(event) => {
                  setBrand(event.target.value);
                  clearFieldError("brand");
                }}
                placeholder="e.g. Audi"
                className={cn(inputClasses, fieldErrors.brand && "border-red-500/70 focus:border-red-500")}
              />
              {fieldErrors.brand && (
                <p id="brand-error" className="mt-1 text-xs text-red-400">
                  {fieldErrors.brand}
                </p>
              )}
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
                aria-invalid={Boolean(fieldErrors.model)}
                aria-describedby={fieldErrors.model ? "model-error" : undefined}
                onChange={(event) => {
                  setModel(event.target.value);
                  clearFieldError("model");
                }}
                placeholder="e.g. A3"
                className={cn(inputClasses, fieldErrors.model && "border-red-500/70 focus:border-red-500")}
              />
              {fieldErrors.model && (
                <p id="model-error" className="mt-1 text-xs text-red-400">
                  {fieldErrors.model}
                </p>
              )}
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
                  aria-invalid={Boolean(fieldErrors.year)}
                  aria-describedby={fieldErrors.year ? "year-error" : undefined}
                  onChange={(event) => {
                    setYear(event.target.value.replace(/\D/g, ""));
                    clearFieldError("year");
                  }}
                  placeholder="e.g. 2017"
                  className={cn(inputClasses, fieldErrors.year && "border-red-500/70 focus:border-red-500")}
                />
                {fieldErrors.year && (
                  <p id="year-error" className="mt-1 text-xs text-red-400">
                    {fieldErrors.year}
                  </p>
                )}
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

          {/* ------------------------------ Step 2: Symptoms */}
          <fieldset ref={symptomsRef} className="scroll-mt-24 space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
            <legend className="flex items-center gap-2 px-1.5 text-sm font-semibold uppercase tracking-wide text-zinc-200">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-zinc-950 shadow-[0_0_14px_rgba(245,158,11,0.35)]">
                2
              </span>
              Symptoms
            </legend>
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
                aria-invalid={Boolean(fieldErrors.symptoms)}
                aria-describedby={fieldErrors.symptoms ? "symptoms-error" : undefined}
                onChange={(event) => {
                  setSymptoms(event.target.value);
                  clearFieldError("symptoms");
                }}
                placeholder="e.g. Orange engine light and loss of power above 2500 RPM. When did it start, how often does it happen, does it change with speed or temperature?"
                className={cn(inputClasses, "resize-y", fieldErrors.symptoms && "border-red-500/70 focus:border-red-500")}
              />
              {fieldErrors.symptoms && (
                <p id="symptoms-error" className="mt-1 text-xs text-red-400">
                  {fieldErrors.symptoms}
                </p>
              )}
            </div>

            <div>
              <span className={labelClasses}>Quick symptom chips (optional)</span>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Common symptoms">
                {SYMPTOM_CHIPS.map((chip) => {
                  const selected = selectedChips.includes(chip);
                  const ChipIcon = CHIP_ICONS[chip];
                  return (
                    <button
                      key={chip}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleChip(chip)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-[transform,color,background-color,border-color,box-shadow] duration-150 active:scale-95",
                        selected
                          ? "border-amber-500 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                          : "border-zinc-700/80 bg-zinc-900/70 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
                      )}
                    >
                      <ChipIcon className="h-3.5 w-3.5" aria-hidden />
                      {chip}
                    </button>
                  );
                })}
              </div>
              {/* Non-blocking safety warning for dangerous symptom selections */}
              <SymptomSafetyWarning selectedChips={selectedChips} />
            </div>

            {/* Scanner-style photo uploader */}
            <div>
              <span className={labelClasses}>
                Dashboard warning-light photo{" "}
                <span className="font-normal text-zinc-500">(optional)</span>
              </span>
              {imagePreview ? (
                /* Re-key by URL so the appear animation replays on Replace too. */
                <div key={imagePreview} className="card-sunken photo-in overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element -- client-side blob URL preview; next/image does not apply */}
                  <img
                    src={imagePreview}
                    alt="Preview of the uploaded dashboard warning-light photo"
                    className="aspect-[16/9] w-full object-cover"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                    <p className="max-w-[14rem] truncate text-xs text-zinc-400">
                      {image?.name ?? "Photo attached"}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-amber-500/60 hover:text-amber-300"
                      >
                        <ImagePlus className="h-3.5 w-3.5" aria-hidden />
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={clearImage}
                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:border-red-500/60 hover:bg-red-500/10"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  aria-label="Upload a dashboard warning-light photo — drag and drop or click to browse"
                  className={cn(
                    "relative flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-[border-color,background-color,transform] duration-200 active:scale-[0.99]",
                    dragging
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-zinc-700/80 bg-zinc-900/70 hover:border-amber-500/60 hover:bg-zinc-900"
                  )}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-400">
                    <Camera className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-sm font-medium text-zinc-200">
                    {dragging ? "Release to add photo" : "Drag & drop or click to scan"}
                  </span>
                  <span className="text-xs text-zinc-500">JPG, PNG or WebP · up to 10 MB</span>
                </button>
              )}
              <input
                ref={imageInputRef}
                id="image"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleImageChange}
              />
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

        {/* ------------------------------ Analyze */}
        <div className="card-sunken space-y-3 p-4 sm:p-5">
          {loading && (
            <div
              aria-hidden="true"
              className="h-1 w-full overflow-hidden rounded-full bg-zinc-800"
            >
              <div className="progress-sweep h-full w-1/3 rounded-full bg-amber-500/80" />
            </div>
          )}
          <Button type="submit" disabled={loading} size="full" className={cn(loading && "cursor-wait!")}>
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
          </Button>
          <p aria-live="polite" role="status" className="min-h-5 text-center text-xs text-amber-300">
            {loading ? loadingStatus : ""}
          </p>
          {validationError && (
            <p role="alert" className="text-center text-sm text-red-400">
              {validationError}
            </p>
          )}
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-zinc-500">
            <CircleHelp className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Always prioritize your safety — see the disclaimer at the bottom.
          </p>
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

      <div className="card-sunken p-3 text-xs leading-relaxed text-zinc-400">
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

      {loading && <ResultSkeleton />}

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
            onRestart={startAnotherAssessment}
          />
        </div>
      ) : (
        <>
          <PrintFallback />
          {/* Fixed disclaimer is visible before submitting and while loading */}
          <FixedDisclaimer />
        </>
      )}
    </div>
  );
}
