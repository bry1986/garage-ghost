/**
 * Garage Ghost Pro — entitlement via Lemon Squeezy License API.
 *
 * Lemon Squeezy's license API is designed for client-side verification:
 * activation/validation only requires the customer's license key (no secret
 * API key, no server). The license key is emailed to the customer after
 * checkout; we persist `{ licenseKey, instanceId }` in localStorage and
 * re-validate it when the app loads.
 *
 * Honest limits of this approach: because verification happens in the
 * browser, a determined user could tamper with localStorage or share their
 * license key. Activation limits (set per product variant in the Lemon
 * Squeezy dashboard) mitigate sharing. This is appropriate for an MVP.
 */

export const PRO_LICENSE_STORAGE_KEY = "garage-ghost:pro:v1";
export const PRO_DEVICE_ID_KEY = "garage-ghost:device-id:v1";
export const PRO_QUOTA_STORAGE_KEY = "garage-ghost:quota:v1";

/** Free-tier allowance: how many diagnosis results may show cost estimates per day. */
export const FREE_ESTIMATES_PER_DAY = 3;

export const PRO_PRICE_MONTHLY = 5.99;
export const PRO_PRICE_ANNUAL = 49.99;

export const LEMONSQUEEZY_API_BASE = "https://api.lemonsqueezy.com/v1";

export interface ProLicenseState {
  licenseKey: string;
  instanceId: string;
  activatedAt: number;
}

export interface EstimateQuota {
  date: string; // local YYYY-MM-DD
  count: number;
}

// ---------------------------------------------------------------------------
// Public env vars (all safe to ship to the browser)
// ---------------------------------------------------------------------------

/** Checkout URL for the monthly variant, e.g. https://store.lemonsqueezy.com/checkout/buy/uuid */
export function getMonthlyCheckoutUrl(): string {
  return process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL ?? "";
}

/** Checkout URL for the yearly variant. */
export function getAnnualCheckoutUrl(): string {
  return process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL_ANNUAL ?? "";
}

/** Store slug, e.g. "garageghost" — used to build the customer billing portal link. */
export function getStoreSlug(): string {
  return process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE ?? "";
}

export function getBillingPortalUrl(): string {
  const store = getStoreSlug().trim();
  return store ? `https://${store}.lemonsqueezy.com/billing` : "";
}

export function isCheckoutConfigured(): boolean {
  return getMonthlyCheckoutUrl().length > 0 || getAnnualCheckoutUrl().length > 0;
}

// ---------------------------------------------------------------------------
// Local date key (local timezone — a "day" is the visitor's day)
// ---------------------------------------------------------------------------

export function todayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------------------------
// License state persistence
// ---------------------------------------------------------------------------

function isProLicenseState(value: unknown): value is ProLicenseState {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.licenseKey === "string" &&
    record.licenseKey.length > 0 &&
    typeof record.instanceId === "string" &&
    record.instanceId.length > 0
  );
}

export function getProState(): ProLicenseState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PRO_LICENSE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isProLicenseState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveProState(state: ProLicenseState | null): void {
  if (typeof window === "undefined") return;
  try {
    if (state === null) {
      window.localStorage.removeItem(PRO_LICENSE_STORAGE_KEY);
    } else {
      window.localStorage.setItem(PRO_LICENSE_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Storage unavailable — the user simply won't stay signed in.
  }
}

export function clearProState(): void {
  saveProState(null);
}

/**
 * A stable per-device id used as the Lemon Squeezy "instance name" so that
 * re-activating on the same device returns the same instance instead of
 * consuming an activation slot each time.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "garage-ghost-node";
  try {
    const existing = window.localStorage.getItem(PRO_DEVICE_ID_KEY);
    if (existing) return existing;
    const id = `gg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(PRO_DEVICE_ID_KEY, id);
    return id;
  } catch {
    return `gg-${Date.now().toString(36)}`;
  }
}

// ---------------------------------------------------------------------------
// Lemon Squeezy License API calls (client-side, no secret key)
// ---------------------------------------------------------------------------

interface LicenseApiResponse {
  [key: string]: unknown;
  error?: unknown;
  message?: unknown;
}

async function postLicense(path: string, body: Record<string, string>): Promise<LicenseApiResponse> {
  const response = await fetch(`${LEMONSQUEEZY_API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from the license service. Try again in a moment.");
  }
  const record = data as LicenseApiResponse;
  if (!response.ok || record.error || record.message) {
    const message =
      typeof record.error === "string"
        ? record.error
        : typeof record.message === "string"
          ? record.message
          : `License service error (HTTP ${response.status}). Try again.`;
    throw new Error(message);
  }
  return record;
}

/**
 * Activates a license key on this device and persists the Pro state.
 * Throws with a readable error on invalid/expired/at-limit keys.
 */
export async function activateLicense(licenseKey: string): Promise<ProLicenseState> {
  const key = licenseKey.trim();
  if (!key) throw new Error("Enter your license key.");
  const instanceName = getDeviceId();
  const data = await postLicense("/licenses/activate", {
    license_key: key,
    instance_name: instanceName,
  });
  if (data.activated !== true) {
    throw new Error(
      typeof data.error === "string" ? data.error : "This license key could not be activated."
    );
  }
  const instance = data.instance as { id?: unknown } | null | undefined;
  const instanceId =
    typeof instance?.id === "string" && instance.id.length > 0 ? instance.id : instanceName;
  const state: ProLicenseState = { licenseKey: key, instanceId, activatedAt: Date.now() };
  saveProState(state);
  return state;
}

/**
 * Re-validates a stored license (e.g. on app load). Clears local Pro state if
 * the license is no longer active (expired, disabled, cancelled).
 */
export async function validateLicense(state: ProLicenseState): Promise<boolean> {
  let data: LicenseApiResponse;
  try {
    data = await postLicense("/licenses/validate", {
      license_key: state.licenseKey,
      instance_id: state.instanceId,
    });
  } catch {
    // Network/rate-limit failure — do not yank Pro on a transient error.
    return true;
  }
  const valid = data.valid === true;
  const licenseKeyObject = data.license_key as { status?: unknown } | null | undefined;
  const status = typeof licenseKeyObject?.status === "string" ? licenseKeyObject.status : "";
  const active = valid && (status === "" || status === "active");
  if (!active) {
    clearProState();
  }
  return active;
}

/** Deactivates the current license on this device and clears local Pro state. */
export async function deactivateLicense(): Promise<void> {
  const state = getProState();
  if (!state) return;
  try {
    await postLicense("/licenses/deactivate", {
      license_key: state.licenseKey,
      instance_id: state.instanceId,
    });
  } catch {
    // Even if the remote call fails, remove local Pro state as requested.
  } finally {
    clearProState();
  }
}

// ---------------------------------------------------------------------------
// Free-tier estimate quota (3 per day)
// ---------------------------------------------------------------------------

export function getEstimateQuota(): EstimateQuota {
  const today = todayKey();
  if (typeof window === "undefined") return { date: today, count: 0 };
  try {
    const raw = window.localStorage.getItem(PRO_QUOTA_STORAGE_KEY);
    if (!raw) return { date: today, count: 0 };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return { date: today, count: 0 };
    const record = parsed as Record<string, unknown>;
    if (typeof record.count !== "number") return { date: today, count: 0 };
    const count = Math.max(0, Math.floor(record.count));
    return record.date === today ? { date: today, count } : { date: today, count: 0 };
  } catch {
    return { date: today, count: 0 };
  }
}

/** How many more diagnosis results may show cost estimates today (0 when locked). */
export function getRemainingEstimateCount(): number {
  return Math.max(0, FREE_ESTIMATES_PER_DAY - getEstimateQuota().count);
}

/** Records one cost-estimate view for a free user today. Returns remaining. */
export function consumeEstimate(): { remaining: number } {
  if (typeof window === "undefined") return { remaining: 0 };
  const quota = getEstimateQuota();
  const count = quota.count + 1;
  try {
    window.localStorage.setItem(
      PRO_QUOTA_STORAGE_KEY,
      JSON.stringify({ date: quota.date, count })
    );
  } catch {
    // Quota tracking is best-effort; never break the app over storage.
  }
  return { remaining: Math.max(0, FREE_ESTIMATES_PER_DAY - count) };
}

export function isEstimateLocked(): boolean {
  return getRemainingEstimateCount() <= 0;
}
