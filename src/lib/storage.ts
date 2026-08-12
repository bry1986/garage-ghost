import {
  CONFIDENCE_LEVELS,
  HISTORY_STORAGE_KEY,
  MAX_HISTORY_ENTRIES,
  MAX_PROFILES,
  PROFILES_STORAGE_KEY,
  RISK_LEVELS,
} from "@/lib/constants";
import type {
  Confidence,
  RiskLevel,
  SavedDiagnosis,
  VehicleProfile,
} from "@/types/diagnostic";

function isSavedDiagnosis(value: unknown): value is SavedDiagnosis {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  const result = record.result;
  if (
    typeof record.id !== "string" ||
    typeof record.createdAt !== "number" ||
    typeof record.symptoms !== "string" ||
    typeof result !== "object" ||
    result === null
  ) {
    return false;
  }
  const resultRecord = result as Record<string, unknown>;
  const confidence = resultRecord.confidence;
  return (
    typeof resultRecord.riskLevel === "string" &&
    RISK_LEVELS.includes(resultRecord.riskLevel as RiskLevel) &&
    typeof confidence === "string" &&
    CONFIDENCE_LEVELS.includes(confidence as Confidence) &&
    typeof resultRecord.summary === "string" &&
    typeof resultRecord.mechanicReport === "string"
  );
}

export function getHistory(): SavedDiagnosis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isSavedDiagnosis)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_HISTORY_ENTRIES);
  } catch {
    // Malformed or unavailable storage — treat as empty history.
    return [];
  }
}

export function saveDiagnosis(entry: SavedDiagnosis): void {
  if (typeof window === "undefined") return;
  try {
    const history = getHistory();
    history.unshift(entry);
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(history.slice(0, MAX_HISTORY_ENTRIES))
    );
  } catch {
    // Storage full or unavailable — the diagnosis still works for this session.
  }
}

export function deleteDiagnosis(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const history = getHistory().filter((entry) => entry.id !== id);
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Ignore storage failures.
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

// ---------------------------------------------------------------------------
// Saved vehicle profiles
// ---------------------------------------------------------------------------

function isVehicleProfile(value: unknown): value is VehicleProfile {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || typeof record.label !== "string") return false;
  const vehicle = record.vehicle as Record<string, unknown> | undefined;
  if (typeof vehicle !== "object" || vehicle === null) return false;
  return (
    typeof vehicle.brand === "string" &&
    typeof vehicle.model === "string" &&
    typeof vehicle.year === "string"
  );
}

export function getProfiles(): VehicleProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isVehicleProfile)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_PROFILES);
  } catch {
    return [];
  }
}

export function saveProfile(profile: VehicleProfile): void {
  if (typeof window === "undefined") return;
  try {
    const profiles = getProfiles().filter((item) => item.id !== profile.id);
    profiles.unshift({ ...profile, createdAt: Date.now() });
    window.localStorage.setItem(
      PROFILES_STORAGE_KEY,
      JSON.stringify(profiles.slice(0, MAX_PROFILES))
    );
  } catch {
    // Storage full or unavailable — profiles are an optional convenience.
  }
}

export function deleteProfile(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const profiles = getProfiles().filter((item) => item.id !== id);
    window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // Ignore storage failures.
  }
}
