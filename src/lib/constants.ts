import type { Confidence, ResponseLanguage, RiskLevel } from "@/types/diagnostic";

export const APP_NAME = "Garage Ghost";
export const APP_TAGLINE = "Understand the warning. Choose the safe next step.";
export const PUTER_DEVELOPER_URL = "https://developer.puter.com";

export const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "EV", "Other"] as const;

export const LANGUAGES: ResponseLanguage[] = ["English", "German", "French", "Arabic"];

export const RISK_LEVELS: RiskLevel[] = ["STOP_NOW", "DRIVE_CAREFULLY", "BOOK_SERVICE"];

export const CONFIDENCE_LEVELS: Confidence[] = ["low", "medium", "high"];

export const SYMPTOM_CHIPS = [
  "Loss of power",
  "Engine noise",
  "Vibrations",
  "Smoke",
  "Fuel smell",
  "Overheating",
  "Hard braking",
  "Steering issue",
  "Battery problem",
  "Strange electrical smell",
] as const;

/**
 * Symptom chips that describe potentially dangerous situations. Selecting any
 * of these surfaces a non-blocking safety warning on the diagnose form.
 */
export const DANGEROUS_SYMPTOM_CHIPS = [
  "Smoke",
  "Fuel smell",
  "Overheating",
  "Hard braking",
  "Steering issue",
  "Strange electrical smell",
] as const;

/** Default Puter.ai model for analysis. */
export const DEFAULT_MODEL = "gpt-5.6-luna";

/**
 * Models tried after the default when Puter reports the model as unavailable
 * or not found. Includes a provider-prefixed variant some gateways require
 * and the model used in Puter's own tutorial.
 */
export const FALLBACK_MODELS = ["openai/gpt-5.6-luna", "gpt-5.4-nano", "gpt-5.4"] as const;

export const AI_TEMPERATURE = 0.2;
export const AI_MAX_TOKENS = 2000;

/**
 * Max time to wait for a Puter analysis before treating the request as stuck
 * (e.g. the Puter sign-in popup was closed without completing).
 */
export const ANALYSIS_TIMEOUT_MS = 90_000;
/** Show a hint status this long before the timeout fires. */
export const ANALYSIS_TIMEOUT_HINT_MS = 70_000;

export const HISTORY_STORAGE_KEY = "garage-ghost:history:v1";
export const MAX_HISTORY_ENTRIES = 50;

export const PROFILES_STORAGE_KEY = "garage-ghost:profiles:v1";
export const MAX_PROFILES = 10;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export const EMERGENCY_MESSAGE =
  "If you see a red warning light, smoke, fuel smell, overheating, brake or steering trouble, stop safely and contact roadside assistance or a qualified workshop.";

export const DISCLAIMER =
  "Garage Ghost provides general educational information only. It is not a diagnosis or a substitute for a qualified mechanic. If there is a red warning light, smoke, a fuel smell, loss of braking or steering, overheating, or an electrical burning smell, stop safely and contact roadside assistance or a qualified workshop.";

export interface RiskMeta {
  label: string;
  badgeClasses: string;
  /** Colored left accent for history cards (severity is also text + icon). */
  leftAccent: string;
  description: string;
}

export const RISK_META: Record<RiskLevel, RiskMeta> = {
  STOP_NOW: {
    label: "STOP NOW",
    badgeClasses: "bg-red-500/15 text-red-400 ring-red-500/40",
    leftAccent: "bg-red-500/70",
    description: "Stop safely as soon as possible and call for professional help.",
  },
  DRIVE_CAREFULLY: {
    label: "DRIVE CAREFULLY",
    badgeClasses: "bg-amber-500/15 text-amber-400 ring-amber-500/40",
    leftAccent: "bg-amber-500/70",
    description: "Drive with care and have the vehicle checked soon.",
  },
  BOOK_SERVICE: {
    label: "BOOK SERVICE",
    badgeClasses: "bg-sky-500/15 text-sky-400 ring-sky-500/40",
    leftAccent: "bg-sky-500/70",
    description: "Schedule an inspection with a qualified workshop.",
  },
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
};

/** Coerce an unknown risk level to a valid one (defensive, for stored data). */
export function safeRiskLevel(level: unknown): RiskLevel {
  return typeof level === "string" && level in RISK_META ? (level as RiskLevel) : "BOOK_SERVICE";
}


