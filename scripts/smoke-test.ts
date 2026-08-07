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
  DiagnosisTimeoutError,
  askFollowUp,
  buildChatMessages,
  buildFollowUpSystemPrompt,
  buildFollowUpUserPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  buildVisionPrompt,
  describePuterError,
  isImageRelatedError,
  isModelRelatedError,
  parseDiagnosticJson,
  runDiagnosis,
  toReadableError,
  withTimeout,
} from "../src/lib/diagnosis";
import { COST_DISCLAIMER, estimateRepairCosts, formatCostRange } from "../src/lib/costs";
import { listDtcCodes, lookupDtc, normalizeDtcCode } from "../src/lib/dtc";
import {
  activateLicense,
  clearProState,
  consumeEstimate,
  deactivateLicense,
  getBillingPortalUrl,
  getDeviceId,
  getProState,
  getRemainingEstimateCount,
  isCheckoutConfigured,
  isEstimateLocked,
  saveProState,
  todayKey,
  validateLicense,
} from "../src/lib/pro";
import {
  clearHistory,
  deleteDiagnosis,
  deleteProfile,
  getHistory,
  getProfiles,
  saveDiagnosis,
  saveProfile,
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

  // 10. Timeout guard: settles when the promise wins
  const fast = await withTimeout(Promise.resolve("done"), 500, "never");
  assert.strictEqual(fast, "done");
  console.log("ok: withTimeout resolves when the promise settles in time");

  // 11. Timeout guard: rejects with a clear error when the deadline passes
  await assert.rejects(
    withTimeout(
      new Promise((resolve) => setTimeout(() => resolve("late"), 500)),
      30,
      "took too long"
    ),
    DiagnosisTimeoutError
  );
  console.log("ok: withTimeout rejects with DiagnosisTimeoutError on deadline");

  // 12. describePuterError explains timeouts clearly
  assert.ok(describePuterError(new DiagnosisTimeoutError("took too long")).includes("took too long"));
  console.log("ok: describePuterError explains the timeout in plain language");

  // 13. Plain-object errors (Puter shape) must not become "[object Object]"
  assert.strictEqual(toReadableError({ message: "Insufficient quota" }), "Insufficient quota");
  assert.ok(
    describePuterError({ message: "Insufficient quota" }).includes("usage or credit limit"),
    "object errors with a message are mapped to the friendly quota message"
  );
  console.log("ok: plain-object errors are read via their message property");

  // 14. Nested error shapes and error codes
  assert.strictEqual(
    toReadableError({ error: { message: "Model not found" } }),
    "Model not found"
  );
  assert.ok(describePuterError({ code: "auth_token_missing" }).includes("sign-in"));
  console.log("ok: nested errors and errorCode-only errors are handled");

  // 15. Unreadable rejections fall back to a friendly message, never "[object Object]"
  const generic = describePuterError({});
  assert.ok(!generic.includes("[object Object]"), "UI must never show [object Object]");
  assert.ok(generic.includes("Something went wrong"));
  console.log("ok: unreadable rejections get a friendly fallback message");

  // 16. Chat messages must NOT carry an `images` field (the API rejects it:
  // 400 Unknown parameter 'input[0].images')
  const chatMessages = buildChatMessages(DEMO_INPUT);
  assert.strictEqual(chatMessages.length, 2);
  for (const message of chatMessages) {
    assert.ok(!("images" in message), "message must not contain an images field");
  }
  assert.strictEqual(chatMessages[1].content, buildUserPrompt(DEMO_INPUT));
  console.log("ok: chat messages omit the rejected images field");

  // 17. Rate-limit errors get a clear message
  assert.ok(
    describePuterError({ message: "429 Too Many Requests - rate limit exceeded" }).includes(
      "rate-limiting"
    )
  );
  console.log("ok: rate-limit errors are explained clearly");

  // 18. Model-not-found errors are recognized as model-related
  assert.ok(isModelRelatedError("Model not found: gpt-5.6-luna"));
  assert.ok(isModelRelatedError({ error: { message: "unknown model" } }));
  assert.ok(!isModelRelatedError("Insufficient quota"));
  assert.ok(!isModelRelatedError("User cancelled the authentication"));
  assert.ok(
    describePuterError("Model not found: gpt-5.6-luna").includes("temporarily unavailable")
  );
  console.log("ok: model-not-found errors are detected and explained");

  // 19. Non-English responses: French prose around a fenced JSON block
  const frenchWrapped =
    "Voici le résultat :\n```json\n" +
    JSON.stringify({
      detectedWarning: "Témoin moteur",
      confidence: "medium",
      riskLevel: "BOOK_SERVICE",
      summary: "Résumé en français.",
      possibleCauses: [{ cause: "Capteur défectueux", likelihood: "high" }],
      safeChecks: ["Vérifiez le bouchon de carburant"],
      doNotDo: ["Ne roulez pas avec un témoin rouge"],
      questions: ["Depuis quand ?"],
      mechanicReport: "Véhicule: Audi A3\nÉtape suivante: atelier.",
      disclaimer: "Pas un diagnostic.",
    }) +
    "\n```\nJ'espère que cela vous aide !";
  const frenchParsed = parseDiagnosticJson(frenchWrapped);
  assert.strictEqual(frenchParsed.summary, "Résumé en français.");
  console.log("ok: French prose around fenced JSON parses");

  // 20. Arabic text inside JSON values (RTL script)
  const arabicParsed = parseDiagnosticJson(
    JSON.stringify({
      detectedWarning: "مشكلة محتملة",
      confidence: "low",
      riskLevel: "DRIVE_CAREFULLY",
      summary: "قد يحدث بسبب مشكلة في الحساسات",
      possibleCauses: [],
      safeChecks: [],
      doNotDo: [],
      questions: [],
      mechanicReport: "المركبة: أودي A3",
      disclaimer: "ليس تشخيصًا",
    })
  );
  assert.strictEqual(arabicParsed.detectedWarning, "مشكلة محتملة");
  console.log("ok: Arabic text inside JSON parses");

  // 21. Truncation repair: valid JSON followed by prose with a stray brace
  const truncated =
    JSON.stringify({
      detectedWarning: "Possible concern",
      confidence: "medium",
      riskLevel: "STOP_NOW",
      summary: "Educational summary.",
      possibleCauses: [],
      safeChecks: [],
      doNotDo: [],
      questions: [],
      mechanicReport: "Vehicle: Audi A3",
      disclaimer: "Not a diagnosis.",
    }) + "\n(avec une parenthèse { qui n'est pas du JSON";
  const repaired = parseDiagnosticJson(truncated);
  assert.strictEqual(repaired.riskLevel, "STOP_NOW");
  console.log("ok: truncated responses with stray braces are repaired");

  // 22. Valid JSON with the wrong shape keeps its precise error
  assert.throws(
    () => parseDiagnosticJson('{"riskLevel":"BOOK_SERVICE","summary":"x"}'),
    /missing required fields/
  );
  console.log("ok: wrong-shape JSON reports the precise error, not a parse error");

  // 23. DTC lookup: exact match, normalization, unknown/empty handling
  const misfire = lookupDtc("P0300");
  assert.ok(misfire, "P0300 must exist");
  assert.strictEqual(misfire.code, "P0300");
  assert.ok(misfire.description.length > 0);
  assert.ok(misfire.possibleCauses.length > 0);
  assert.strictEqual(lookupDtc("p 0 300")?.code, "P0300", "case/space/dash-insensitive");
  assert.strictEqual(lookupDtc("P0-300")?.code, "P0300");
  assert.strictEqual(lookupDtc("ZZZ999"), null, "unknown code returns null");
  assert.strictEqual(lookupDtc("   "), null, "empty input returns null");
  assert.strictEqual(normalizeDtcCode("p0 300"), "P0300");
  assert.ok(listDtcCodes().length >= 40, "the reference should cover common codes");
  assert.strictEqual(new Set(listDtcCodes()).size, listDtcCodes().length, "codes must be unique");
  console.log("ok: DTC lookup matches, normalizes, and handles unknown codes");

  // 24. Vision prompt (image path) embeds the safety system prompt + vehicle data
  const vision = buildVisionPrompt(DEMO_INPUT);
  assert.ok(vision.includes("Garage Ghost"));
  assert.ok(vision.includes("Return JSON only"));
  assert.ok(vision.includes("Audi A3 (2017)"));
  assert.ok(vision.includes("loss of power above 2500 RPM"));
  console.log("ok: vision prompt embeds system rules and vehicle context");

  // 25. Vehicle profile storage round-trip + malformed-data safety
  getProfiles()
    .map((p) => p.id)
    .forEach((id) => deleteProfile(id));
  assert.strictEqual(getProfiles().length, 0);
  saveProfile({
    id: "profile-1",
    label: "Audi A3 2017",
    vehicle: { brand: "Audi", model: "A3", year: "2017", fuelType: "Diesel" },
    createdAt: Date.now(),
  });
  assert.strictEqual(getProfiles().length, 1);
  assert.strictEqual(getProfiles()[0].vehicle.brand, "Audi");
  store.set(
    "garage-ghost:profiles:v1",
    JSON.stringify([{ id: "bad", label: "x", vehicle: { brand: "Audi" } }])
  );
  assert.strictEqual(getProfiles().length, 0, "profiles missing model/year are filtered");
  store.set("garage-ghost:profiles:v1", "{broken json");
  assert.strictEqual(getProfiles().length, 0, "malformed profile storage handled safely");
  deleteProfile("profile-1");
  console.log("ok: vehicle profiles save, validate, and delete safely");

  // 26. Follow-up prompts carry context and the question
  const followUpInput = {
    vehicle: { brand: "Audi", model: "A3", year: "2017", fuelType: "Diesel" },
    symptoms: "Orange engine light and loss of power above 2500 RPM",
    language: "English" as const,
    previousSummary: "Possible engine management concern.",
    question: "It vibrates more when cold — does that change anything?",
  };
  assert.ok(buildFollowUpSystemPrompt("English").includes("plain text"));
  assert.ok(buildFollowUpSystemPrompt("English").includes("Do not output JSON"));
  const followUpUser = buildFollowUpUserPrompt(followUpInput);
  assert.ok(followUpUser.includes("Audi A3 (2017)"));
  assert.ok(followUpUser.includes("It vibrates more when cold"));
  assert.ok(followUpUser.includes("Possible engine management concern"));
  const followUpAnswer = await askFollowUp(followUpInput);
  assert.ok(followUpAnswer.includes("[Demo"), "demo follow-up is clearly labeled");
  assert.ok(followUpAnswer.includes("It vibrates more when cold"));
  console.log("ok: follow-up prompts and demo-mode answer work");

  // 27. Image-specific errors are recognized so the app can retry text-only
  assert.ok(isImageRelatedError("400 Unknown parameter: 'input[0].images'"));
  assert.ok(isImageRelatedError({ message: "The image format is not supported" }));
  assert.ok(isImageRelatedError("vision model requires an image URL"));
  assert.ok(!isImageRelatedError("Insufficient quota"));
  assert.ok(!isImageRelatedError("Network error"));
  assert.ok(!isImageRelatedError("Model not found"));
  console.log("ok: image-related errors are detected for the text-only retry");

  // 28. Repair cost estimates match typical causes (keyword → range)
  const costs = estimateRepairCosts({
    detectedWarning: "Check engine light",
    summary: "Possible misfire",
    possibleCauses: [{ cause: "Worn spark plugs or ignition coils" }],
    riskLevel: "BOOK_SERVICE",
  });
  assert.ok(costs.estimates.length > 0, "known causes must produce estimates");
  const spark = costs.estimates.find((e) => e.label.toLowerCase().includes("spark"));
  assert.ok(spark, "spark/coil causes map to the ignition estimate");
  assert.ok(spark.min > 0 && spark.min < spark.max, "ranges are ordered low→high");
  assert.ok(!costs.isFallback && !costs.isEmergency);
  assert.strictEqual(costs.currency, "USD");
  console.log("ok: repair cost estimates match known causes");

  // 29. DTC codes inside symptoms drive the estimate (P0300 → ignition)
  const dtcCosts = estimateRepairCosts({
    detectedWarning: "Possible concern",
    summary: "",
    possibleCauses: [],
    riskLevel: "BOOK_SERVICE",
    symptoms: "Orange engine light and loss of power (DTC P0300)",
  });
  assert.ok(
    dtcCosts.estimates.some((e) => e.label.toLowerCase().includes("spark")),
    "P0300 in the symptoms maps to the ignition estimate"
  );
  assert.ok(
    estimateRepairCosts({
      detectedWarning: "ABS light on",
      summary: "",
      possibleCauses: [{ cause: "Wheel speed sensor circuit malfunction" }],
      riskLevel: "DRIVE_CAREFULLY",
    }).estimates.some((e) => e.label.toLowerCase().includes("abs")),
    "ABS/wheel-speed causes map to the ABS estimate"
  );
  console.log("ok: DTC codes and ABS causes drive cost estimates");

  // 30. STOP_NOW suppresses numeric estimates (safety first)
  const emergency = estimateRepairCosts({
    detectedWarning: "Smoke from the bonnet",
    summary: "",
    possibleCauses: [{ cause: "Possible coolant leak" }],
    riskLevel: "STOP_NOW",
  });
  assert.strictEqual(emergency.isEmergency, true);
  assert.strictEqual(emergency.estimates.length, 0, "no numeric estimate in an emergency");
  console.log("ok: emergency results show no cost estimate");

  // 31. Unknown issues fall back to a broad generic range
  const fallback = estimateRepairCosts({
    detectedWarning: "Unusual clicking sound",
    summary: "",
    possibleCauses: [{ cause: "Something odd" }],
    riskLevel: "DRIVE_CAREFULLY",
  });
  assert.strictEqual(fallback.isFallback, true);
  assert.strictEqual(fallback.estimates.length, 1);
  assert.ok(fallback.estimates[0].min > 0);
  console.log("ok: unmatched issues get a broad generic estimate");

  // 32. Range formatter + disclaimer
  assert.strictEqual(formatCostRange({ label: "x", min: 150, max: 600 }), "$150–$600");
  assert.strictEqual(formatCostRange({ label: "x", min: 1000, max: 2500 }), "$1,000–$2,500");
  assert.ok(COST_DISCLAIMER.includes("written quote"));
  console.log("ok: cost ranges format as USD and carry a disclaimer");

  // 33. Pro: local date key is YYYY-MM-DD in local time
  assert.strictEqual(todayKey(new Date(2026, 7, 7)), "2026-08-07");
  assert.strictEqual(todayKey(new Date(2026, 0, 3)), "2026-01-03");
  console.log("ok: todayKey formats local dates as YYYY-MM-DD");

  // 34. Pro: license state persists and malformed data is ignored
  clearProState();
  assert.strictEqual(getProState(), null, "no stored license initially");
  saveProState({ licenseKey: "abc-123", instanceId: "inst-1", activatedAt: 1 });
  assert.strictEqual(getProState()?.licenseKey, "abc-123");
  store.set("garage-ghost:pro:v1", "{broken json");
  assert.strictEqual(getProState(), null, "malformed license storage is ignored");
  store.set("garage-ghost:pro:v1", JSON.stringify({ licenseKey: "" }));
  assert.strictEqual(getProState(), null, "empty license key is not a valid state");
  clearProState();
  console.log("ok: license state persists, validates shape, and clears");

  // 35. Pro: device id is stable per device
  const deviceA = getDeviceId();
  const deviceB = getDeviceId();
  assert.strictEqual(deviceA, deviceB, "device id must be stable across calls");
  assert.ok(deviceA.length > 0);
  console.log("ok: device id is stable and persisted");

  // 36. Pro: activation calls the License API and persists state
  const fetchLog: Array<{ url: string; body: unknown }> = [];
  const stubFetch = (url: string, init?: RequestInit): Promise<Response> => {
    const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, string>;
    fetchLog.push({ url, body });
    const respond = (data: Record<string, unknown>, status = 200) =>
      Promise.resolve(
        new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })
      );
    if (url.endsWith("/licenses/activate")) {
      return respond({ activated: true, instance: { id: "inst-9", name: body.instance_name } });
    }
    if (url.endsWith("/licenses/validate")) {
      return respond({ valid: true, license_key: { status: "active" } });
    }
    if (url.endsWith("/licenses/deactivate")) {
      return respond({ deactivated: true });
    }
    return respond({ error: "not found" }, 404);
  };
  (globalThis as Record<string, unknown>).fetch = stubFetch as unknown as typeof fetch;

  const activated = await activateLicense("key-1234");
  assert.strictEqual(activated.licenseKey, "key-1234");
  assert.strictEqual(activated.instanceId, "inst-9");
  assert.strictEqual(fetchLog[0].url, "https://api.lemonsqueezy.com/v1/licenses/activate");
  assert.strictEqual((fetchLog[0].body as Record<string, string>).license_key, "key-1234");
  assert.strictEqual(getProState()?.licenseKey, "key-1234", "activation persists Pro state");
  console.log("ok: license activation calls the API and persists state");

  // 37. Pro: empty or invalid keys are rejected with a readable error
  await assert.rejects(() => activateLicense("   "), /Enter your license key/);
  (globalThis as Record<string, unknown>).fetch = (async () =>
    new Response(JSON.stringify({ error: "The license key is expired." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })) as unknown as typeof fetch;
  await assert.rejects(() => activateLicense("expired-key"), /expired/);
  console.log("ok: invalid license keys are rejected with the API error message");

  // 38. Pro: validation keeps Pro for active licenses, clears for expired ones
  (globalThis as Record<string, unknown>).fetch = stubFetch as unknown as typeof fetch;
  const active = await validateLicense({ licenseKey: "key-1234", instanceId: "inst-9", activatedAt: 1 });
  assert.strictEqual(active, true);
  assert.strictEqual(getProState()?.licenseKey, "key-1234", "active license keeps stored state");

  (globalThis as Record<string, unknown>).fetch = (async () =>
    new Response(JSON.stringify({ valid: true, license_key: { status: "expired" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as unknown as typeof fetch;
  const expired = await validateLicense({ licenseKey: "key-1234", instanceId: "inst-9", activatedAt: 1 });
  assert.strictEqual(expired, false, "expired subscription loses Pro");
  assert.strictEqual(getProState(), null, "expired license clears stored state");

  // Transient network failure must NOT yank Pro
  (globalThis as Record<string, unknown>).fetch = (async () => {
    throw new Error("network down");
  }) as unknown as typeof fetch;
  saveProState({ licenseKey: "key-1234", instanceId: "inst-9", activatedAt: 1 });
  const transient = await validateLicense({ licenseKey: "key-1234", instanceId: "inst-9", activatedAt: 1 });
  assert.strictEqual(transient, true, "transient errors keep stored Pro");
  assert.ok(getProState(), "stored state survives a transient validation failure");
  clearProState();
  console.log("ok: validation keeps Pro for active licenses and clears expired ones");

  // 39. Pro: deactivation calls the API and clears local state
  (globalThis as Record<string, unknown>).fetch = stubFetch as unknown as typeof fetch;
  saveProState({ licenseKey: "key-1234", instanceId: "inst-9", activatedAt: 1 });
  await deactivateLicense();
  assert.strictEqual(getProState(), null, "deactivation clears local state");
  console.log("ok: license deactivation clears local Pro state");

  // 40. Pro: free-tier estimate quota caps at 3 per day and resets daily
  store.delete("garage-ghost:quota:v1");
  assert.strictEqual(getRemainingEstimateCount(), 3);
  const first = consumeEstimate();
  assert.strictEqual(first.remaining, 2);
  consumeEstimate();
  consumeEstimate();
  assert.strictEqual(getRemainingEstimateCount(), 0, "quota is exhausted after 3 uses");
  assert.strictEqual(isEstimateLocked(), true);
  const afterLocked = consumeEstimate();
  assert.strictEqual(afterLocked.remaining, 0, "locked state never goes negative");
  store.set(
    "garage-ghost:quota:v1",
    JSON.stringify({ date: todayKey(new Date(2026, 7, 6)), count: 3 })
  );
  assert.strictEqual(getRemainingEstimateCount(), 3, "a new day resets the allowance");
  store.set("garage-ghost:quota:v1", "{broken json");
  assert.strictEqual(getRemainingEstimateCount(), 3, "malformed quota storage resets safely");
  console.log("ok: estimate quota caps at 3/day, resets daily, and survives malformed storage");

  // 41. Pro: checkout env defaults are safe when unset
  assert.strictEqual(isCheckoutConfigured(), false, "no checkout URLs configured in tests");
  assert.strictEqual(getBillingPortalUrl(), "", "no billing URL without a store slug");
  console.log("ok: unset checkout env vars degrade gracefully");

  console.log("\nAll smoke tests passed ✅");
}

main().catch((error) => {
  console.error("SMOKE TEST FAILED:", error);
  process.exit(1);
});
