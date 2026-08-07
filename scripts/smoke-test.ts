/**
 * Headless smoke test for the Garage Ghost lib layer.
 * Run: npx --yes tsx scripts/smoke-test.ts
 *
 * Verifies: resilient JSON parsing, prompt construction, demo-mode output,
 * STOP_NOW escalation, storage round-trip, and malformed localStorage safety.
 */
import assert from "node:assert";

// Minimal browser shims so client-only lib code can run in Node.
const store = new Map<string, string>();
(globalThis as Record<string, unknown>).window = {
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  },
};

process.env.NEXT_PUBLIC_DEMO_MODE = "true";

import {
  buildSystemPrompt,
  buildUserPrompt,
  parseDiagnosticJson,
  runDiagnosis,
} from "../src/lib/diagnosis";
import {
  clearHistory,
  deleteDiagnosis,
  getHistory,
  saveDiagnosis,
} from "../src/lib/storage";

const DEMO_INPUT = {
  vehicle: { brand: "Audi", model: "A3", year: "2017", fuelType: "Diesel", mileage: "145000 km" },
  symptoms: "Orange engine light and loss of power above 2500 RPM",
  symptomChips: ["Loss of power"],
  language: "English" as const,
};

async function main() {
  // 1. parseDiagnosticJson — fences + surrounding text
  const raw =
    "Sure, here is the JSON:\n```json\n" +
    JSON.stringify({
      detectedWarning: "Check engine",
      confidence: "medium",
      riskLevel: "BOOK_SERVICE",
      summary: "Educational summary.",
      possibleCauses: [{ cause: "Sensor fault", likelihood: "high" }],
      safeChecks: ["Check the fuel cap"],
      doNotDo: ["Do not drive with a red oil light"],
      questions: ["When did it start?"],
      mechanicReport: "Vehicle: Audi A3\nNext step: workshop scan.",
      disclaimer: "Not a diagnosis.",
    }) +
    "\n```\nHope that helps!";
  const parsed = parseDiagnosticJson(raw);
  assert.strictEqual(parsed.riskLevel, "BOOK_SERVICE");
  assert.strictEqual(parsed.possibleCauses.length, 1);
  assert.strictEqual(parsed.safeChecks.length, 1);
  console.log("ok: parseDiagnosticJson strips fences and surrounding text");

  // 2. Invalid JSON throws
  assert.throws(() => parseDiagnosticJson("not json at all"));
  console.log("ok: parseDiagnosticJson throws on non-JSON");

  // 3. Missing required fields throws
  assert.throws(() => parseDiagnosticJson('{"riskLevel":"BOOK_SERVICE","summary":"x"}'));
  console.log("ok: parseDiagnosticJson throws on missing required fields");

  // 4. Unknown risk level throws
  assert.throws(() =>
    parseDiagnosticJson('{"riskLevel":"FLY_TO_MOON","summary":"x","mechanicReport":"y"}')
  );
  console.log("ok: parseDiagnosticJson rejects unknown risk level");

  // 5. Prompts contain the required safety rules and vehicle data
  const system = buildSystemPrompt("English");
  assert.ok(system.includes("Garage Ghost"));
  assert.ok(system.includes("STOP_NOW"));
  assert.ok(system.includes("Return JSON only"));
  const user = buildUserPrompt(DEMO_INPUT);
  assert.ok(user.includes("Audi A3 (2017)"));
  assert.ok(user.includes("Loss of power"));
  console.log("ok: prompts contain safety rules and vehicle data");

  // 6. Demo mode returns a clearly labeled result
  const out = await runDiagnosis(DEMO_INPUT);
  assert.strictEqual(out.source, "demo");
  assert.ok(out.result.summary.includes("Demo"));
  assert.ok(
    ["STOP_NOW", "DRIVE_CAREFULLY", "BOOK_SERVICE"].includes(out.result.riskLevel)
  );
  console.log("ok: demo mode returns a labeled demo result");

  // 7. STOP_NOW escalation from dangerous symptom chips
  const dangerous = await runDiagnosis({
    vehicle: { brand: "Toyota", model: "Yaris", year: "2015" },
    symptoms: "Smoke coming from the bonnet",
    symptomChips: ["Smoke"],
    language: "English",
  });
  assert.strictEqual(dangerous.result.riskLevel, "STOP_NOW");
  console.log("ok: smoke chip escalates to STOP_NOW");

  // 8. Storage round-trip
  clearHistory();
  assert.strictEqual(getHistory().length, 0);
  const entry = {
    id: "test-1",
    createdAt: Date.now(),
    source: "demo" as const,
    vehicle: { brand: "Audi", model: "A3", year: "2017" },
    language: "English" as const,
    symptoms: "Orange engine light",
    result: out.result,
  };
  saveDiagnosis(entry);
  assert.strictEqual(getHistory().length, 1);
  deleteDiagnosis("test-1");
  assert.strictEqual(getHistory().length, 0);
  saveDiagnosis({ ...entry, id: "test-2" });
  clearHistory();
  assert.strictEqual(getHistory().length, 0);
  console.log("ok: storage save/delete/clear round-trip");

  // 9. Malformed localStorage data is handled safely
  store.set("garage-ghost:history:v1", "this is { not json");
  assert.deepStrictEqual(getHistory(), []);
  store.set(
    "garage-ghost:history:v1",
    JSON.stringify([
      {
        id: "x",
        createdAt: Date.now(),
        symptoms: "s",
        result: { riskLevel: "FLY_TO_MOON", summary: "s", mechanicReport: "m" },
      },
    ])
  );
  assert.strictEqual(getHistory().length, 0, "entries with invalid riskLevel must be filtered");
  console.log("ok: malformed localStorage data handled safely");

  console.log("\nAll smoke tests passed ✅");
}

main().catch((error) => {
  console.error("SMOKE TEST FAILED:", error);
  process.exit(1);
});
