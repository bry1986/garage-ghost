"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Battery,
  BookMarked,
  Camera,
  ChevronDown,
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
  ShieldCheck,
  Thermometer,
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
  CAR_MAKES,
  FUEL_TYPES,
  LANGUAGES,
  MAX_IMAGE_BYTES,
  MODEL_YEARS,
  PUTER_DEVELOPER_URL,
  SYMPTOM_CHIPS,
} from "@/lib/constants";
import { describePuterError, runDiagnosis, type DiagnosisOutput } from "@/lib/diagnosis";
import { lookupDtc } from "@/lib/dtc";
import { getProfiles, saveDiagnosis, saveProfile } from "@/lib/storage";
import { cn, generateId } from "@/lib/utils";
import type { ResponseLanguage, SavedVehicle, VehicleProfile } from "@/types/diagnostic";

const inputClasses =
  "w-full rounded-lg border border-zinc-700/80 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-[border-color,box-shadow,background-color] duration-150 hover:border-zinc-600 focus:border-brand focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand/20";
const labelClasses = "mb-1.5 block text-sm font-medium text-zinc-300";

/** Select shell with a native dropdown chevron (matches the reference control). */
function SelectShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      {children}
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
        aria-hidden
      />
    </div>
  );
}

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

  // Compact save-for-reuse affordance inside the vehicle card.
  const [profileNote, setProfileNote] = useState<string | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);
  const vehicleRef = useRef<HTMLDivElement>(null);
  const symptomsRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time query-param/external-store read on mount is intentional */
    // Deep links: ?vehicle=ID prefills the vehicle from a saved profile,
    // ?dtc=CODE prefills the symptom description from the OBD-II reference.
    const params = new URLSearchParams(window.location.search);

    const vehicleId = params.get("vehicle");
    if (vehicleId) {
      const profile = getProfiles().find((item) => item.id === vehicleId);
      if (profile) {
        setBrand(profile.vehicle.brand);
        setModel(profile.vehicle.model);
        setYear(profile.vehicle.year);
        setFuelType(profile.vehicle.fuelType ?? "");
        setMileage(profile.vehicle.mileage ?? "");
        setProfileNote(`Loaded “${profile.label}”.`);
      }
    }

    const dtcCode = params.get("dtc");
    if (dtcCode) {
      const entry = lookupDtc(dtcCode);
      if (entry) {
        setSymptoms(`Diagnostic trouble code ${entry.code} — describe what you notice.`);
        setProfileNote((prev) => `${prev ? `${prev} ` : ""}${entry.code} was added to your description.`);
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // ---------------------------------------------------------------------
  // Guided-step derivation (visual only — the form stays on one page)
  // ---------------------------------------------------------------------
  const vehicleComplete =
    brand.trim().length > 0 && model.trim().length > 0 && /^\d{4}$/.test(year.trim());
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
    setProfileNote(`Saved “${profile.label}” for quick reuse.`);
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
    if (brand.trim().length === 0) nextFieldErrors.brand = "Select your car's make.";
    if (model.trim().length === 0) nextFieldErrors.model = "Model is required.";
    const yearValue = year.trim();
    if (!/^\d{4}$/.test(yearValue)) {
      nextFieldErrors.year = "Select the model year.";
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

  return (
    <div className="space-y-10 pb-16">
      {/* Guided 3-step progress: Vehicle → Problem → Media */}
      <Stepper current={currentStep} active={activeStep} onNavigate={navigateTo} />

      <form onSubmit={handleSubmit} noValidate className="space-y-10">
        {/* ------------------------------ Step 1: Vehicle details */}
        <section aria-labelledby="vehicle-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 id="vehicle-heading" className="text-base font-semibold text-zinc-50">
              Vehicle Details
            </h2>
            <p className="text-xs text-zinc-500">
              Tell us about your car for a more accurate diagnosis
            </p>
          </div>

          <div
            ref={vehicleRef}
            className="scroll-mt-24 space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="brand" className={labelClasses}>
                  Make <span className="text-red-400" aria-hidden>*</span>
                </label>
                <SelectShell>
                  <select
                    id="brand"
                    name="brand"
                    autoComplete="off"
                    required
                    value={brand}
                    aria-invalid={Boolean(fieldErrors.brand)}
                    aria-describedby={fieldErrors.brand ? "brand-error" : undefined}
                    onChange={(event) => {
                      setBrand(event.target.value);
                      clearFieldError("brand");
                    }}
                    className={cn(
                      inputClasses,
                      "appearance-none pr-9",
                      fieldErrors.brand && "border-red-500/70 focus:border-red-500"
                    )}
                  >
                    <option value="">Select make…</option>
                    {CAR_MAKES.map((make) => (
                      <option key={make} value={make}>
                        {make}
                      </option>
                    ))}
                  </select>
                </SelectShell>
                {fieldErrors.brand && (
                  <p id="brand-error" className="mt-1 text-xs text-red-400">
                    {fieldErrors.brand}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="year" className={labelClasses}>
                  Year <span className="text-red-400" aria-hidden>*</span>
                </label>
                <SelectShell>
                  <select
                    id="year"
                    name="year"
                    required
                    value={year}
                    aria-invalid={Boolean(fieldErrors.year)}
                    aria-describedby={fieldErrors.year ? "year-error" : undefined}
                    onChange={(event) => {
                      setYear(event.target.value);
                      clearFieldError("year");
                    }}
                    className={cn(
                      inputClasses,
                      "appearance-none pr-9",
                      fieldErrors.year && "border-red-500/70 focus:border-red-500"
                    )}
                  >
                    <option value="">Select year…</option>
                    {MODEL_YEARS.map((modelYear) => (
                      <option key={modelYear} value={modelYear}>
                        {modelYear}
                      </option>
                    ))}
                  </select>
                </SelectShell>
                {fieldErrors.year && (
                  <p id="year-error" className="mt-1 text-xs text-red-400">
                    {fieldErrors.year}
                  </p>
                )}
              </div>
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

            <div className="grid gap-4 sm:grid-cols-2">
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
              <div>
                <label htmlFor="fuelType" className={labelClasses}>
                  Fuel / power type <span className="font-normal text-zinc-500">(optional)</span>
                </label>
                <SelectShell>
                  <select
                    id="fuelType"
                    name="fuelType"
                    value={fuelType}
                    onChange={(event) => setFuelType(event.target.value)}
                    className={cn(inputClasses, "appearance-none pr-9")}
                  >
                    <option value="">Select…</option>
                    {FUEL_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </SelectShell>
              </div>
            </div>

            <div>
              <label htmlFor="language" className={labelClasses}>
                Response language
              </label>
              <SelectShell>
                <select
                  id="language"
                  name="language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as ResponseLanguage)}
                  className={cn(inputClasses, "appearance-none pr-9")}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </SelectShell>
            </div>

            {/* Compact save-for-reuse (full management lives on the History page) */}
            <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800/80 pt-3">
              <Button
                type="button"
                onClick={handleSaveProfile}
                disabled={!canSaveProfile}
                variant="outline"
                className="shrink-0"
                title="Fill in make, model and year above, then save"
              >
                <BookMarked className="h-3.5 w-3.5" aria-hidden />
                Save this vehicle
              </Button>
              {profileNote && (
                <p aria-live="polite" className="text-xs text-brand">
                  {profileNote}
                </p>
              )}
            </div>
          </div>

          {/* Reference actions: continue or skip the vehicle details */}
          <div className="mt-5 flex flex-col items-center gap-3">
            <Button
              type="button"
              onClick={() => navigateTo("symptoms")}
              size="lg"
              className="w-full sm:w-auto"
            >
              Next
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
            <button
              type="button"
              onClick={() => navigateTo("symptoms")}
              className="text-sm text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-200 hover:underline dark:text-zinc-400 dark:hover:text-white"
            >
              Skip — I&apos;ll describe the problem only
            </button>
          </div>
        </section>

        {/* ------------------------------ Step 2: Problem */}
        <section aria-labelledby="problem-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 id="problem-heading" className="text-base font-semibold text-zinc-50">
              Problem
            </h2>
            <p className="text-xs text-zinc-500">Describe what you&apos;re noticing</p>
          </div>

          <div
            ref={symptomsRef}
            className="scroll-mt-24 space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5"
          >
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
                className={cn(
                  inputClasses,
                  "resize-y",
                  fieldErrors.symptoms && "border-red-500/70 focus:border-red-500"
                )}
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
                          ? "border-brand bg-brand/15 text-brand shadow-[0_0_12px_rgba(37,99,235,0.15)]"
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
          </div>
        </section>

        {/* ------------------------------ Step 3: Media */}
        <section aria-labelledby="media-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 id="media-heading" className="text-base font-semibold text-zinc-50">
              Media
            </h2>
            <p className="text-xs text-zinc-500">Optional photo of the warning light</p>
          </div>

          <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
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
                      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-brand/60 hover:text-brand"
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
                    ? "border-brand bg-brand/10"
                    : "border-zinc-700/80 bg-zinc-900/70 hover:border-brand/60 hover:bg-zinc-900"
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
              <p role="alert" className="text-xs text-red-400">
                {imageError}
              </p>
            ) : (
              <p className="text-xs text-zinc-500">
                Images are optional and do not guarantee correct identification. When attached,
                your photo is sent together with your written description to help the analysis.
              </p>
            )}
          </div>
        </section>

        {/* ------------------------------ Analyze */}
        <div className="card-sunken space-y-3 p-4 sm:p-5">
          {loading && (
            <div aria-hidden="true" className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="progress-sweep h-full w-1/3 rounded-full bg-brand/80" />
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
          <p aria-live="polite" role="status" className="min-h-5 text-center text-xs text-brand">
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
          <Info className="h-3.5 w-3.5 text-brand" aria-hidden />
          About AI analysis
        </p>
        <p className="mt-1">
          Analysis is provided by{" "}
          <a
            href={PUTER_DEVELOPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline underline-offset-2 hover:text-brand-strong"
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
            // Only claim the photo was included when it actually reached the
            // analysis — the image→text retry path drops it (imageIncluded=false).
            imageNote={imageNote && output.imageIncluded}
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
