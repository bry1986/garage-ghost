/**
 * Repair cost estimates (FIXD-style ballparks).
 *
 * Deterministic, no AI cost: typical jobs are matched by keyword + OBD-II
 * DTC code against a curated table of parts-and-labor ranges in US dollars.
 * Estimates are educational ballparks only — never a quote.
 */
import type { RiskLevel } from "@/types/diagnostic";

export type CostCurrency = "USD";

export interface RepairCostEstimate {
  label: string;
  min: number;
  max: number;
}

export interface RepairCostEstimateResult {
  estimates: RepairCostEstimate[];
  /** True when nothing specific matched and a broad generic range is shown. */
  isFallback: boolean;
  /** True for STOP_NOW situations — no numeric estimate, guidance instead. */
  isEmergency: boolean;
  currency: CostCurrency;
}

interface CostRule {
  label: string;
  /** Lowercased substrings; any single hit makes the rule match. */
  keywords: string[];
  min: number;
  max: number;
}

/**
 * Typical parts-and-labor ranges (USD) for common jobs, derived from
 * general automotive industry figures. Deliberately wide — real quotes vary
 * by vehicle, region, and workshop.
 */
const COST_RULES: CostRule[] = [
  {
    label: "High-voltage (EV) battery repair/replacement",
    keywords: [
      "high-voltage",
      "high voltage",
      "hv battery",
      "traction battery",
      "ev battery",
      "battery pack",
    ],
    min: 1500,
    max: 9000,
  },
  {
    label: "Head gasket repair",
    keywords: ["head gasket", "blown gasket", "cylinder head"],
    min: 1200,
    max: 2800,
  },
  {
    label: "Transmission replacement/rebuild",
    keywords: ["transmission replacement", "gearbox replacement", "transmission rebuild", "gearbox rebuild"],
    min: 2500,
    max: 6500,
  },
  {
    label: "Turbocharger diagnosis/replacement",
    keywords: ["turbocharger", "turbo charger", "boost leak"],
    min: 1200,
    max: 3000,
  },
  {
    label: "Catalytic converter replacement",
    keywords: ["catalytic", "catalyst"],
    min: 800,
    max: 2500,
  },
  {
    label: "Timing belt/chain replacement",
    keywords: ["timing belt", "timing chain"],
    min: 500,
    max: 1500,
  },
  {
    label: "Transmission service",
    keywords: [
      "transmission fluid",
      "transmission oil",
      "transmission service",
      "transmission control",
      "gearbox fluid",
      "gearbox oil",
      "gearbox control",
      "p0700",
      "p0715",
      "p0741",
      "p0750",
      "p0841",
    ],
    min: 150,
    max: 450,
  },
  {
    label: "Alternator/charging system repair",
    keywords: ["alternator", "voltage regulator", "charging system", "p0562", "p0563"],
    min: 350,
    max: 900,
  },
  {
    label: "Battery replacement",
    keywords: ["battery", "b1320"],
    min: 120,
    max: 350,
  },
  {
    label: "Oxygen (O2/lambda) sensor replacement",
    keywords: ["oxygen sensor", "o2 sensor", "lambda", "p0171", "p0172", "p0174", "p0420", "p0430"],
    min: 150,
    max: 450,
  },
  {
    label: "Mass airflow sensor cleaning/replacement",
    keywords: ["mass airflow", "maf sensor", "airflow sensor", "p0101", "p0102"],
    min: 120,
    max: 400,
  },
  {
    label: "Spark plugs & ignition coils",
    keywords: [
      "spark plug",
      "ignition coil",
      "misfire",
      "misfiring",
      "p0300",
      "p0301",
      "p0302",
      "p0303",
      "p0304",
      "p0325",
    ],
    min: 150,
    max: 600,
  },
  {
    label: "Fuel pump replacement",
    keywords: ["fuel pump"],
    min: 400,
    max: 1000,
  },
  {
    label: "Fuel injector replacement",
    keywords: ["injector", "fuel injection"],
    min: 150,
    max: 600,
  },
  {
    label: "Thermostat replacement",
    keywords: ["thermostat", "p0128"],
    min: 150,
    max: 450,
  },
  {
    label: "Cooling system diagnosis",
    keywords: ["overheat", "overheating", "coolant leak", "cooling system", "radiator", "cooling fan", "water pump"],
    min: 200,
    max: 1000,
  },
  {
    label: "EVAP system check (fuel cap, hoses, valve)",
    keywords: ["evap", "fuel cap", "evaporative", "p0442", "p0446", "p0455"],
    min: 50,
    max: 400,
  },
  {
    label: "Brake pad/rotor replacement",
    keywords: ["brake pad", "brake rotor", "brake disc", "brake disk", "worn brake"],
    min: 150,
    max: 700,
  },
  {
    label: "Wheel speed sensor / ABS repair",
    keywords: ["wheel speed sensor", "abs sensor", "abs module", "abs light", "c0035", "c0040", "c0045", "c0050", "c0121"],
    min: 150,
    max: 500,
  },
  {
    label: "Steering system repair",
    keywords: ["steering rack", "steering pump", "power steering", "steering column"],
    min: 400,
    max: 1800,
  },
  {
    label: "Starter motor replacement",
    keywords: ["starter motor", "starter"],
    min: 250,
    max: 650,
  },
  {
    label: "Engine/motor mount replacement",
    keywords: ["engine mount", "motor mount"],
    min: 200,
    max: 800,
  },
  {
    label: "Clutch replacement",
    keywords: ["clutch"],
    min: 800,
    max: 2000,
  },
  {
    label: "Suspension repair",
    keywords: ["shock absorber", "strut", "control arm", "suspension"],
    min: 300,
    max: 1200,
  },
  {
    label: "Oil leak / gasket repair",
    keywords: ["oil leak", "oil seep", "valve cover gasket", "oil gasket"],
    min: 150,
    max: 600,
  },
  {
    label: "Serpentine/drive belt replacement",
    keywords: ["serpentine belt", "drive belt", "alternator belt"],
    min: 150,
    max: 350,
  },
  {
    label: "Air conditioning repair",
    keywords: ["air conditioning", "a/c", "ac compressor", "aircon"],
    min: 300,
    max: 1200,
  },
];

/** Broad generic range shown when no specific job matched. */
const FALLBACK_RANGES: Record<Exclude<RiskLevel, "STOP_NOW">, { label: string; min: number; max: number }> = {
  DRIVE_CAREFULLY: { label: "Inspection and typical repair", min: 150, max: 900 },
  BOOK_SERVICE: { label: "Diagnosis and typical repair", min: 100, max: 1500 },
};

export interface CostEstimateInput {
  detectedWarning: string;
  summary: string;
  possibleCauses: { cause: string }[];
  riskLevel: RiskLevel;
  /** Raw symptom text — may contain DTC codes, e.g. "(DTC P0300)". */
  symptoms?: string;
}

/** How many matched jobs to show (highest-confidence rules come first). */
const MAX_ESTIMATES = 3;

/**
 * Match an issue against the cost table. Emergency (STOP_NOW) situations get
 * no numeric estimate; when nothing matches, a wide generic range is used so
 * the section never appears empty.
 */
export function estimateRepairCosts(input: CostEstimateInput): RepairCostEstimateResult {
  if (input.riskLevel === "STOP_NOW") {
    return { estimates: [], isFallback: false, isEmergency: true, currency: "USD" };
  }

  const text = [
    input.detectedWarning,
    input.summary,
    ...input.possibleCauses.map((item) => item.cause),
    input.symptoms ?? "",
  ]
    .join(" ")
    .toLowerCase();

  // Score-based matching: rules win by how many of their keywords appear in
  // the text (ties break by rule order). This keeps a specific match like
  // "spark plug" + "ignition coil" ahead of a broad mention of, say,
  // "overheating" inside an unrelated AI summary.
  // Note: the AI returns causes in the selected language, so English keywords
  // mostly match English results plus language-neutral DTC codes; other
  // languages degrade to the generic fallback range by design.
  const scored: Array<{ estimate: RepairCostEstimate; score: number; order: number }> = [];
  for (let order = 0; order < COST_RULES.length; order++) {
    const rule = COST_RULES[order];
    let score = 0;
    for (const keyword of rule.keywords) {
      if (text.includes(keyword)) score++;
    }
    if (score > 0) scored.push({ estimate: { label: rule.label, min: rule.min, max: rule.max }, score, order });
  }
  scored.sort((a, b) => b.score - a.score || a.order - b.order);
  const estimates = scored.slice(0, MAX_ESTIMATES).map((item) => item.estimate);

  if (estimates.length > 0) {
    return { estimates, isFallback: false, isEmergency: false, currency: "USD" };
  }

  const generic = FALLBACK_RANGES[input.riskLevel];
  return {
    estimates: [{ label: generic.label, min: generic.min, max: generic.max }],
    isFallback: true,
    isEmergency: false,
    currency: "USD",
  };
}

/** Format an estimate as a USD range, e.g. "$150–$600". */
export function formatCostRange(estimate: RepairCostEstimate): string {
  return `$${estimate.min.toLocaleString("en-US")}–$${estimate.max.toLocaleString("en-US")}`;
}

export const COST_DISCLAIMER =
  "Rough parts-and-labor ballpark in US dollars for a typical workshop. Real prices vary by vehicle, region and workshop — always get a written quote before approving any work.";
