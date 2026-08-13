/**
 * Vehicle Identification Number (VIN) helpers.
 *
 * Educational only. A valid check digit proves the VIN string is internally
 * consistent — it never proves the vehicle, mileage, or history. Decode is
 * ISO 3779 / 49 CFR Part 565 structural; make/model detail comes from the
 * free NHTSA vPIC API (no key), which mainly covers the North American market.
 */

export type VinValidity = "valid" | "invalid";

export interface VinDecodeResult {
  vin: string;
  valid: boolean;
  /** Human-readable reason when invalid. */
  error?: string;
  /** Position 9 check digit after validation. */
  checkDigit: string;
  checkDigitPassed: boolean;
  region: string;
  country: string;
  /** Model year decoded from position 10 (30-year rotating cycle). */
  modelYear: number;
  /** True when position 10 maps to a 1980–2009 or 2010–2039 cycle year. */
  modelYearFrom2010?: boolean;
  wmi: string;
  vds: string;
  vis: string;
  serial: string;
}

/** Characters allowed in a VIN: A–Z minus I, O, Q, plus digits. */
const ALLOWED_CHARS = /^[A-HJ-NPR-Z0-9]+$/;

/**
 * Position-2 → country lookup (ISO 3779). Keys are the second character;
 * many map to several countries, so this returns the most common reading.
 */
const COUNTRY_BY_POS2: Record<string, string> = {
  "1": "United States",
  "2": "Canada",
  "3": "Mexico",
  "4": "United States",
  "5": "United States",
  "6": "Australia",
  "7": "New Zealand",
  "8": "Argentina",
  "9": "Brazil",
  A: "South Africa",
  B: "Angola",
  C: "Democratic Republic of the Congo",
  D: "Ivory Coast",
  E: "Ghana",
  F: "Nigeria",
  G: "Tanzania",
  H: "Kenya",
  J: "Japan",
  K: "South Korea",
  L: "China",
  M: "India",
  N: "Indonesia",
  P: "Philippines",
  R: "Taiwan",
  S: "United Kingdom",
  T: "Switzerland",
  U: "Europe (other)",
  V: "France",
  W: "Germany",
  X: "Russia",
  Y: "Belgium",
  Z: "Italy",
};

/** Position-1 → region lookup (ISO 3779). */
const REGION_BY_POS1: Record<string, string> = {
  "1": "North America",
  "2": "North America",
  "3": "North America",
  "4": "North America",
  "5": "North America",
  "6": "Oceania",
  "7": "Oceania",
  "8": "South America",
  "9": "South America",
  A: "Africa",
  B: "Africa",
  C: "Africa",
  D: "Africa",
  E: "Africa",
  F: "Africa",
  G: "Africa",
  H: "Africa",
  J: "Asia",
  K: "Asia",
  L: "Asia",
  M: "Asia",
  N: "Asia",
  P: "Asia",
  R: "Asia",
  S: "Europe",
  T: "Europe",
  U: "Europe",
  V: "Europe",
  W: "Europe",
  X: "Europe",
  Y: "Europe",
  Z: "Europe",
};

/**
 * Position-10 model-year codes: a 30-character rotating cycle starting at
 * A = 1980. Skips I, O, Q, U, Z and 0. 2010–2039 repeats the same letters,
 * so pre-2010 VINs are ambiguous on year alone (position 7 disambiguates).
 */
const YEAR_CHARS = "ABCDEFGHJKLMNPRSTVWXY123456789";
const YEAR_CYCLE_BASE = 1980;

/** Transliteration table for the check-digit algorithm (position 9). */
const CHECK_TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5,
  P: 7,
  R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};

/** Fixed positional weights, 1-indexed; position 9 (check digit) is 0. */
const CHECK_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

/** Normalize raw input: uppercase, keep only legal VIN characters. */
export function normalizeVin(input: string): string {
  return input.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
}

/** Structural validation: length + character set (before check digit). */
export function validateVinStructure(input: string): { ok: boolean; error?: string } {
  const vin = normalizeVin(input);
  if (vin.length === 0) return { ok: false, error: "Enter a 17-character VIN." };
  if (vin.length !== 17) {
    return { ok: false, error: `A VIN has 17 characters — you entered ${vin.length}.` };
  }
  if (!ALLOWED_CHARS.test(vin)) {
    return { ok: false, error: "VINs never contain I, O or Q." };
  }
  return { ok: true };
}

/** Compute the expected check digit for a 17-character VIN (position 9). */
export function computeCheckDigit(vin: string): string | null {
  if (vin.length !== 17 || !ALLOWED_CHARS.test(vin)) return null;
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = vin[i];
    const value = char >= "0" && char <= "9" ? Number(char) : CHECK_TRANSLITERATION[char];
    if (value === undefined) return null;
    sum += value * CHECK_WEIGHTS[i];
  }
  const remainder = sum % 11;
  return remainder === 10 ? "X" : String(remainder);
}

/** Decode the model year from position 10 (with the 2010+ ambiguity note). */
function decodeModelYear(char: string): { year: number; from2010: boolean } {
  const index = YEAR_CHARS.indexOf(char);
  if (index === -1) return { year: NaN, from2010: false };
  const year = YEAR_CYCLE_BASE + index;
  // Years ≥ 2010 reuse the same codes; position 7 would disambiguate.
  return { year, from2010: year >= 2010 };
}

/**
 * Structural decode of a 17-character VIN — fully local, no network.
 * Never claims to identify the exact vehicle; that is NHTSA's job.
 */
export function decodeVin(input: string): VinDecodeResult {
  const vin = normalizeVin(input);
  const structural = validateVinStructure(vin);
  const expected = computeCheckDigit(vin);

  const checkDigitPassed = structural.ok && expected !== null && vin[8] === expected;
  const yearInfo = structural.ok ? decodeModelYear(vin[9]) : { year: NaN, from2010: false };

  return {
    vin,
    valid: structural.ok && checkDigitPassed,
    error: !structural.ok ? structural.error : !checkDigitPassed ? "Check digit mismatch — this VIN fails validation." : undefined,
    checkDigit: vin[8] ?? "",
    checkDigitPassed,
    region: vin[0] ? (REGION_BY_POS1[vin[0]] ?? "Unknown") : "Unknown",
    country: vin[1] ? (COUNTRY_BY_POS2[vin[1]] ?? "Unknown") : "Unknown",
    modelYear: yearInfo.year,
    modelYearFrom2010: yearInfo.from2010,
    wmi: vin.slice(0, 3),
    vds: vin.slice(3, 9),
    vis: vin.slice(9),
    serial: vin.slice(11),
  };
}

// ---------------------------------------------------------------------------
// NHTSA vPIC enrichment (free, no API key; mainly North American market)
// ---------------------------------------------------------------------------

export interface NhtsaDecode {
  make?: string;
  model?: string;
  modelYear?: string;
  bodyClass?: string;
  engine?: string;
  displacement?: string;
  cylinders?: string;
  fuel?: string;
  plantCity?: string;
  plantCompany?: string;
  series?: string;
  trim?: string;
  vehicleType?: string;
  driveType?: string;
}

const NHTSA_API = "https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues";

/** Pick non-empty, meaningful fields out of a vPIC result row. */
function pickNhtsaFields(row: Record<string, string | undefined>): NhtsaDecode {
  const clean = (value: string | undefined): string | undefined => {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (
      trimmed.length === 0 ||
      trimmed.toLowerCase() === "n/a" ||
      trimmed.toLowerCase() === "not applicable" ||
      trimmed.toLowerCase() === "not available" ||
      trimmed.toLowerCase() === "null"
    ) {
      return undefined;
    }
    return trimmed;
  };

  return {
    make: clean(row.Make),
    model: clean(row.Model),
    modelYear: clean(row.ModelYear),
    bodyClass: clean(row.BodyClass),
    engine: clean(row.EngineModel),
    displacement: clean(row.DisplacementL) ? `${row.DisplacementL} L` : undefined,
    cylinders: clean(row.EngineCylinders),
    fuel: clean(row.FuelTypePrimary),
    plantCity: clean(row.PlantCity),
    plantCompany: clean(row.PlantCompanyName),
    series: clean(row.Series),
    trim: clean(row.Trim),
    vehicleType: clean(row.VehicleType),
    driveType: clean(row.DriveType),
  };
}

/** Query NHTSA vPIC for decoded vehicle details. Throws on network failure. */
export async function decodeVinViaNhtsa(vin: string): Promise<NhtsaDecode | null> {
  const structural = validateVinStructure(vin);
  if (!structural.ok) return null;

  const response = await fetch(`${NHTSA_API}/${encodeURIComponent(normalizeVin(vin))}?format=json`, {
    // vPIC is slow (2–3s); give the browser time without blocking forever.
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`NHTSA request failed (${response.status}).`);
  const data: unknown = await response.json();

  const row = (data as { Results?: Record<string, string | undefined>[] })?.Results?.[0];
  if (!row || !row.Make) return null; // vPIC knows nothing about this VIN.
  return pickNhtsaFields(row);
}

/** Well-known valid VINs for trying the tool (structural + check digit). */
export const EXAMPLE_VINS = [
  { vin: "1HGCM82633A004352", label: "Honda Accord (2003, USA)" },
  { vin: "1M8GDM9AXKP042788", label: "Mazda B-Series (1989, USA)" },
] as const;
