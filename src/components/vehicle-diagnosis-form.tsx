"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, Info, Loader2, ShieldCheck } from "lucide-react";
import { DiagnosisResult } from "@/components/diagnosis-result";
import {
  ACCEPTED_IMAGE_TYPES,
  FUEL_TYPES,
  LANGUAGES,
  MAX_IMAGE_BYTES,
  PRIMARY_BUTTON_CLASSES,
  PUTER_DEVELOPER_URL,
  SYMPTOM_CHIPS,
} from "@/lib/constants";
import { describePuterError, runDiagnosis, type DiagnosisOutput } from "@/lib/diagnosis";
import { saveDiagnosis } from "@/lib/storage";
import { cn, generateId } from "@/lib/utils";
import type { ResponseLanguage } from "@/types/diagnostic";

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

  const resultRef = useRef<HTMLDivElement>(null);

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
        },
        setLoadingStatus
      );
      setOutput(diagnosis);
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
      setError(describePuterError(cause));
    } finally {
      setLoading(false);
    }
  };

  const vehicleLabel = [brand.trim(), model.trim(), year.trim()].filter(Boolean).join(" ");

  return (
    <div className="space-y-8">
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
                  Images are optional and do not guarantee correct identification. In this build,
                  analysis uses your written description — the photo is not sent for analysis.
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

      {output && (
        <div ref={resultRef} className="scroll-mt-24">
          <DiagnosisResult
            result={output.result}
            source={output.source}
            vehicleLabel={vehicleLabel}
            imageNote={imageNote}
          />
        </div>
      )}
    </div>
  );
}
