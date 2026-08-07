import type { ChatMessage, ChatResponse } from "@heyputer/puter.js";
import {
  AI_MAX_TOKENS,
  AI_TEMPERATURE,
  ANALYSIS_TIMEOUT_HINT_MS,
  ANALYSIS_TIMEOUT_MS,
  CONFIDENCE_LEVELS,
  DEFAULT_MODEL,
  FALLBACK_MODELS,
  RISK_LEVELS,
} from "@/lib/constants";
import { delay } from "@/lib/utils";
import type {
  Confidence,
  DiagnosticResult,
  PossibleCause,
  ResponseLanguage,
  RiskLevel,
} from "@/types/diagnostic";

const LANGUAGE_INSTRUCTIONS: Record<ResponseLanguage, string> = {
  English: "Write every answer in English.",
  German: "Write every answer in German.",
  French: "Write every answer in French.",
  Arabic: "Write every answer in Arabic (Arabic script).",
};

export type DiagnosisSource = "puter" | "demo";

export interface DiagnosisInput {
  vehicle: {
    brand: string;
    model: string;
    year: string;
    fuelType?: string;
    mileage?: string;
  };
  symptoms: string;
  symptomChips: string[];
  language: ResponseLanguage;
}

export interface DiagnosisOutput {
  result: DiagnosticResult;
  source: DiagnosisSource;
}

export function buildSystemPrompt(language: ResponseLanguage): string {
  return `You are "Garage Ghost", a multilingual safety-first automotive triage assistant.

Rules:
- Provide general educational information only, never a certain diagnosis.
- Never tell the user to bypass safety systems.
- Never advise work on airbags, brakes, steering, fuel systems, high-voltage EV components, or on a vehicle that is not supported safely.
- Do not diagnose from an image with certainty.
- Always advise qualified professional help when relevant.
- Treat these as STOP_NOW: red oil-pressure warning, red brake warning, overheating, loss of steering, airbag safety concern, smoke, fuel leak or fuel smell, electrical burning smell, visible fire, or a high-voltage EV warning.
- ${LANGUAGE_INSTRUCTIONS[language]}
- Return JSON only. No Markdown, no code fences, no commentary outside the JSON.

Respond with exactly this JSON shape:
{
  "detectedWarning": "string",
  "confidence": "low | medium | high",
  "riskLevel": "STOP_NOW | DRIVE_CAREFULLY | BOOK_SERVICE",
  "summary": "string",
  "possibleCauses": [ { "cause": "string", "likelihood": "low | medium | high" } ],
  "safeChecks": ["string"],
  "doNotDo": ["string"],
  "questions": ["string"],
  "mechanicReport": "string",
  "disclaimer": "string"
}`;
}

export function buildUserPrompt(input: DiagnosisInput): string {
  const lines = [
    `Vehicle: ${input.vehicle.brand} ${input.vehicle.model} (${input.vehicle.year})`,
  ];
  if (input.vehicle.fuelType) lines.push(`Fuel/power type: ${input.vehicle.fuelType}`);
  if (input.vehicle.mileage) lines.push(`Mileage: ${input.vehicle.mileage}`);
  if (input.symptomChips.length > 0) {
    lines.push(`Selected symptoms: ${input.symptomChips.join(", ")}`);
  }
  lines.push(`User description of symptoms: ${input.symptoms}`);
  return lines.join("\n");
}

/**
 * Messages sent to Puter. Deliberately built without the `images` field:
 * the model endpoint rejects it (400: Unknown parameter 'input[0].images')
 * and this app sends text-only prompts.
 */
export function buildChatMessages(
  input: DiagnosisInput
): Omit<ChatMessage, "images">[] {
  return [
    { role: "system", content: buildSystemPrompt(input.language) },
    { role: "user", content: buildUserPrompt(input) },
  ];
}

// ---------------------------------------------------------------------------
// Resilient JSON parsing
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeDiagnostic(value: unknown): DiagnosticResult {
  if (!isRecord(value)) {
    throw new Error("The AI response is not a JSON object.");
  }

  const rawRiskLevel = value.riskLevel;
  if (
    typeof rawRiskLevel !== "string" ||
    !RISK_LEVELS.includes(rawRiskLevel as RiskLevel)
  ) {
    throw new Error(`Unsupported risk level: ${String(rawRiskLevel)}`);
  }

  const rawConfidence = value.confidence;
  const confidence: Confidence =
    typeof rawConfidence === "string" &&
    CONFIDENCE_LEVELS.includes(rawConfidence as Confidence)
      ? (rawConfidence as Confidence)
      : "medium";

  const possibleCauses: PossibleCause[] = Array.isArray(value.possibleCauses)
    ? value.possibleCauses
        .filter(isRecord)
        .map((item) => ({
          cause: asString(item.cause),
          likelihood:
            typeof item.likelihood === "string" &&
            CONFIDENCE_LEVELS.includes(item.likelihood as Confidence)
              ? (item.likelihood as Confidence)
              : "medium",
        }))
        .filter((item) => item.cause.length > 0)
    : [];

  const summary = asString(value.summary);
  const mechanicReport = asString(value.mechanicReport);
  if (summary.length === 0 || mechanicReport.length === 0) {
    throw new Error('The AI response is missing required fields ("summary", "mechanicReport").');
  }

  return {
    detectedWarning: asString(value.detectedWarning) || "Possible concern",
    confidence,
    riskLevel: rawRiskLevel as RiskLevel,
    summary,
    possibleCauses,
    safeChecks: asStringArray(value.safeChecks),
    doNotDo: asStringArray(value.doNotDo),
    questions: asStringArray(value.questions),
    mechanicReport,
    disclaimer: asString(value.disclaimer),
  };
}

/**
 * Extract JSON-object candidate substrings from a model response, most
 * likely first. Handles prose before/after the JSON, code fences, and — for
 * non-English languages where the model is more verbose and output can get
 * truncated or followed by stray braces — balanced-brace prefixes.
 */
export function extractJsonCandidates(raw: string): string[] {
  const out: string[] = [];
  const trimmed = raw.trim();
  if (trimmed.length > 0) out.push(trimmed);

  const withoutFences = trimmed.replace(/```(?:json|xml)?/gi, "").replace(/```/g, "").trim();
  if (withoutFences.length > 0 && withoutFences !== trimmed) out.push(withoutFences);

  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start !== -1 && end > start) out.push(withoutFences.slice(start, end + 1));

  // Balanced-brace prefixes: every position where the object closes at depth 0.
  // Recovers valid JSON when trailing prose contains stray braces or the
  // response was cut off mid-string after a complete object.
  if (start !== -1) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < withoutFences.length; i++) {
      const ch = withoutFences[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) out.push(withoutFences.slice(start, i + 1));
      }
    }
  }
  return [...new Set(out)];
}

export function parseDiagnosticJson(raw: string): DiagnosticResult {
  if (!raw || raw.trim().length === 0) {
    throw new Error("The AI returned an empty response.");
  }
  for (const candidate of extractJsonCandidates(raw)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(candidate);
    } catch {
      continue; // try the next extraction strategy
    }
    // Valid JSON but the wrong shape: surface that precise error, do not
    // fall through to the next candidate (it would be the same content).
    return normalizeDiagnostic(parsed);
  }
  // Include a short preview of the raw response so non-JSON model output in
  // other languages stays diagnosable instead of failing silently.
  const preview = raw.trim().replace(/\s+/g, " ").slice(0, 180);
  throw new Error(
    preview.length > 0
      ? `The AI response was not valid JSON. The model returned: "${preview}"`
      : "The AI response was not valid JSON."
  );
}

// ---------------------------------------------------------------------------
// Puter.ai integration
// ---------------------------------------------------------------------------

function extractTextFromPart(part: unknown): string {
  if (typeof part === "string") return part;
  if (typeof part === "object" && part !== null) {
    const candidate = (part as Record<string, unknown>).text;
    return typeof candidate === "string" ? candidate : "";
  }
  return "";
}

function extractResponseText(response: ChatResponse): string {
  const content = response?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => extractTextFromPart(part)).join("");
  }
  throw new Error("Unexpected response format from the AI service.");
}

export class DiagnosisTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiagnosisTimeoutError";
  }
}

export const ANALYSIS_TIMEOUT_MESSAGE =
  "The AI request took too long and was cancelled. It may still be waiting for a Puter sign-in that never completed, or the service may be slow. Close any leftover window and click \u201cAnalyze safely\u201d to try again.";

/**
 * Rejects with a `DiagnosisTimeoutError` if `promise` does not settle within
 * `ms`. Used to surface a clear error when the Puter call never settles (e.g.
 * the sign-in popup was closed without completing) instead of hanging forever.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new DiagnosisTimeoutError(message)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/**
 * Extract a human-readable message from an unknown rejection value.
 *
 * Puter can reject with `Error` instances, plain objects carrying
 * `message`/`error`/`code`/`errorCode`, or nested shapes. This never lets a
 * bare "[object Object]" reach the UI.
 */
export function toReadableError(error: unknown, depth = 0): string {
  if (depth > 3) return ""; // guard against circular error shapes
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    const keys = ["message", "errorMessage", "msg", "detail", "reason", "error"] as const;
    // Direct string values
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === "string" && value.trim().length > 0) return value;
    }
    // Nested shapes, e.g. { error: { message: "..." } }
    for (const key of keys) {
      const value = obj[key];
      if (value && typeof value === "object") {
        const nested = toReadableError(value, depth + 1);
        if (nested.length > 0) return nested;
      }
    }
    // Last resort: surface a stable error code instead of an object dump.
    const code = obj.code ?? obj.errorCode;
    if (typeof code === "string" && code.length > 0) {
      return `Puter error (code: ${code})`;
    }
  }
  return "";
}

/** True when the error indicates the requested model is unavailable/unknown. */
export function isModelRelatedError(error: unknown): boolean {
  const lower = toReadableError(error).toLowerCase();
  return /model|does not exist|unknown model|invalid model/i.test(lower);
}

export function describePuterError(error: unknown): string {
  const message = toReadableError(error).trim();
  const lower = message.toLowerCase();
  if (error instanceof DiagnosisTimeoutError || /timed out|took too long/i.test(lower)) {
    return ANALYSIS_TIMEOUT_MESSAGE;
  }
  if (/sign\s?in|auth|login|token|cancell?ed/i.test(lower)) {
    return "Puter sign-in was cancelled or is required. Please try again and complete the Puter sign-in dialog.";
  }
  if (/network|fetch|offline|connection|failed to fetch|timed? out/i.test(lower)) {
    return "A network error occurred while contacting Puter. Check your internet connection and try again.";
  }
  if (/quota|credit|balance|insufficient|usage|billing|payment/i.test(lower)) {
    return "Puter could not complete the request — this may be a usage or credit limit on the Puter account. Please try again later.";
  }
  if (/(?:^|\D)429(?:\D|$)|rate limit|too many requests|throttl/i.test(lower)) {
    return "Puter is temporarily rate-limiting requests. Please wait a moment, then try again.";
  }
  if (isModelRelatedError(error)) {
    return "The AI model is temporarily unavailable or could not be found. Please try again in a moment.";
  }
  if (message.length > 0) {
    return `The AI service returned an error: ${message}`;
  }
  return "Something went wrong while contacting the AI service. Please try again.";
}

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export async function runDiagnosis(
  input: DiagnosisInput,
  onStatus?: (status: string) => void
): Promise<DiagnosisOutput> {
  if (typeof window === "undefined") {
    throw new Error("Diagnosis can only run in the browser.");
  }

  if (isDemoMode()) {
    await delay(900);
    return { result: buildDemoResult(input), source: "demo" };
  }

  onStatus?.("Preparing your vehicle report…");
  await delay(120); // Let the loading state paint before awaiting the network.
  onStatus?.("Connecting to Puter — you may be asked to sign in…");

  // Only ever loaded in the browser, never during SSR.
  const { puter } = await import("@heyputer/puter.js");

  onStatus?.("Analyzing your symptoms…");
  const messages = buildChatMessages(input);

  // Guard against a Puter call that never settles (e.g. the sign-in popup is
  // closed without completing). Warn first, then fail with a clear message so
  // the button re-enables and the visitor can retry.
  let hintTimer: ReturnType<typeof setTimeout> | undefined;
  try {
    hintTimer = setTimeout(() => {
      onStatus?.(
        "Taking longer than expected — if a Puter sign-in window is open, complete it, or close it and try again."
      );
    }, ANALYSIS_TIMEOUT_HINT_MS);

    // Try the preferred model first, then fall back to alternatives when
    // Puter reports the model as unavailable/not found (some gateways require
    // provider-prefixed ids, or the model may be down). Non-model errors
    // (auth, quota, network, rate limit, timeout) surface immediately.
    const attempts = [DEFAULT_MODEL, ...FALLBACK_MODELS];
    let lastError: unknown = new Error("No AI model could be used.");
    for (const model of attempts) {
      try {
        const response = await withTimeout(
          // The API rejects a per-message `images` field (400: Unknown
          // parameter 'input[0].images'), so messages are built without it;
          // the cast satisfies the SDK's `ChatMessage` type without sending it.
          puter.ai.chat(messages as ChatMessage[], {
            model,
            temperature: AI_TEMPERATURE,
            max_tokens: AI_MAX_TOKENS,
          }),
          ANALYSIS_TIMEOUT_MS,
          ANALYSIS_TIMEOUT_MESSAGE
        );
        const text = extractResponseText(response);
        return { result: parseDiagnosticJson(text), source: "puter" };
      } catch (error) {
        lastError = error;
        if (!isModelRelatedError(error)) throw error;
        console.error(`Garage Ghost: model "${model}" unavailable, trying next:`, error);
        onStatus?.(`Model ${model} is unavailable — trying a fallback…`);
      }
    }
    throw lastError;
  } finally {
    if (hintTimer !== undefined) clearTimeout(hintTimer);
  }
}

// ---------------------------------------------------------------------------
// Demo mode fallback (NEXT_PUBLIC_DEMO_MODE=true only)
// ---------------------------------------------------------------------------

function buildDemoResult(input: DiagnosisInput): DiagnosticResult {
  const stopNow = input.symptomChips.some((chip) =>
    ["Smoke", "Fuel smell", "Overheating", "Steering issue", "Strange electrical smell"].includes(
      chip
    )
  );
  const riskLevel: RiskLevel = stopNow ? "STOP_NOW" : "BOOK_SERVICE";
  const vehicleLabel = [input.vehicle.brand, input.vehicle.model, input.vehicle.year]
    .filter(Boolean)
    .join(" ");
  const chipsNote =
    input.symptomChips.length > 0 ? ` (selected: ${input.symptomChips.join(", ")})` : "";

  return {
    detectedWarning: "Possible engine management concern",
    confidence: "low",
    riskLevel,
    summary: `Demo result for ${vehicleLabel}: the reported symptoms ("${input.symptoms}") would normally be reviewed against a diagnostic trouble code (DTC) scan and a workshop inspection. This text was generated locally for testing and is not an AI analysis.`,
    possibleCauses: [
      { cause: "Faulty sensor or actuator reported by the engine control unit", likelihood: "medium" },
      { cause: "Age- and mileage-related component wear", likelihood: "low" },
    ],
    safeChecks: [
      "Note when the symptom first appeared and whether it changes with engine temperature or load.",
      "Make sure the vehicle is parked on level ground before doing any visual check.",
      "Take a photo of any warning light to show the workshop.",
    ],
    doNotDo: [
      "Do not open the coolant or oil system while the engine is hot.",
      "Do not keep driving if the warning is red, flashing, or accompanied by smoke or loss of power.",
    ],
    questions: [
      "Does the warning light stay on, or does it flash?",
      "Does the symptom appear only above a certain engine speed or load?",
    ],
    mechanicReport: `[Demo mode — not an AI analysis]
Vehicle: ${vehicleLabel}
Symptoms: ${input.symptoms}${chipsNote}
Suggested next step: have the vehicle inspected by a qualified workshop and read the fault codes.`,
    disclaimer: "This demo result was generated locally for testing and is not an AI analysis.",
  };
}
