/**
 * Nearby-workshop helpers — all free, no API keys, no backend.
 *
 * - Browser Geolocation (works on http://localhost and any HTTPS origin)
 * - Nominatim (OpenStreetMap) for place-name → coordinates fallback
 * - Overpass API (OpenStreetMap) for shops tagged amenity/shop=car_repair
 *
 * Data is community-edited OpenStreetMap: shops can be missing, duplicated,
 * renamed or out of date. Always presented as a starting point, never as a
 * verified directory.
 */

export interface LatLon {
  lat: number;
  lon: number;
}

export interface Workshop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** Straight-line distance from the search point, in meters. */
  distanceMeters: number;
  phone?: string;
  website?: string;
  openingHours?: string;
  address?: string;
  brand?: string;
  operator?: string;
}

export type LocationErrorKind =
  | "denied"
  | "unavailable"
  | "timeout"
  | "unsupported"
  | "unknown";

export interface LocationError {
  kind: LocationErrorKind;
  message: string;
}

/**
 * Overpass mirrors, tried in order until one answers. The main public
 * instance is frequently rate-limited or slow, so falling back keeps
 * searches working. (osm.ch is a regional mirror — skipped on purpose.)
 */
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
];
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";

/** Ask the browser for the current position (with a 12s guard). */
export function getCurrentPosition(): Promise<LatLon> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject({
        kind: "unsupported",
        message: "This browser does not support location services.",
      } satisfies LocationError);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lon: position.coords.longitude });
      },
      (error) => {
        const map: Record<number, LocationError> = {
          1: {
            kind: "denied",
            message:
              "Location permission was denied. Allow location in your browser, or search by a place name below.",
          },
          2: {
            kind: "unavailable",
            message: "Your location could not be determined. Try again or search by place name.",
          },
          3: {
            kind: "timeout",
            message: "Locating timed out. Try again or search by place name.",
          },
        };
        reject(
          map[error.code] ?? {
            kind: "unknown",
            message: "An unknown location error occurred.",
          }
        );
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  });
}

/** Geocode a free-text place name via Nominatim (e.g. "Munich, Germany"). */
export async function geocodePlace(query: string): Promise<LatLon> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    "accept-language": "en",
  });
  const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Geocoding failed (${response.status}).`);
  const data = (await response.json()) as { lat?: string; lon?: string }[];
  const first = data[0];
  if (!first?.lat || !first?.lon) {
    throw new Error(`No place found for “${query}”. Try a city, town or area.`);
  }
  return { lat: Number(first.lat), lon: Number(first.lon) };
}

/** Great-circle distance between two coordinates, in meters. */
export function haversineMeters(a: LatLon, b: LatLon): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

interface OverpassElement {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string | undefined>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

/**
 * Turn a user-typed brand (e.g. "land rover", "Mercedes-Benz", "Škoda")
 * into a case-insensitive POSIX-ERE regex that also matches the compact
 * spelling ("Landrover"), hyphen or space separators ("Mercedes-Benz"), and
 * the accented form ("Škoda" vs "Skoda"). Word boundaries are NOT used —
 * Overpass uses the OS POSIX regex engine, which rejects \b.
 */
function brandPattern(brand: string): string {
  const raw = brand.trim().toLowerCase();
  const stripped = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return [...new Set([raw, stripped])]
    .map((variant) => variant.split(/[^a-z0-9]+/).filter((word) => word.length > 0))
    .filter((words) => words.length > 0)
    .map((words) => words.join("[- ]?"))
    .join("|");
}

/**
 * Build the Overpass query. Without a brand this matches every car-repair
 * shop in range; with a brand it matches repair shops AND dealerships
 * (`shop=car` — authorised service centres) whose name, brand or operator
 * tag contains the brand, case-insensitively.
 */
function buildWorkshopQuery(origin: LatLon, radiusMeters: number, brand?: string): string {
  const radius = Math.round(radiusMeters);
  const { lat, lon } = origin;
  const types = ["node", "way", "relation"] as const;
  const repairTags = ["amenity=car_repair", "shop=car_repair"];
  // If a brand is given but produces no searchable letters (e.g. "!!!"), fall
  // back to the plain query rather than emitting an empty regex, which can
  // make Overpass reject the request outright.
  const pattern = brand ? brandPattern(brand) : "";
  const categories = pattern ? [...repairTags, "shop=car"] : repairTags;
  const blocks: string[] = [];

  for (const type of types) {
    for (const category of categories) {
      if (pattern) {
        for (const key of ["name", "brand", "operator"]) {
          blocks.push(`${type}(around:${radius},${lat},${lon})[${category}]["${key}"~"${pattern}",i];`);
        }
      } else {
        blocks.push(`${type}(around:${radius},${lat},${lon})[${category}];`);
      }
    }
  }

  return `[out:json][timeout:25];\n(\n${blocks.join("\n")}\n);\nout center;`;
}

/** Try each Overpass mirror in turn and return the first success. */
async function fetchOverpass(query: string): Promise<OverpassResponse> {
  const failures: string[] = [];
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: query }).toString(),
        signal: AbortSignal.timeout(20000),
      });
      if (response.ok) {
        return (await response.json()) as OverpassResponse;
      }
      failures.push(`${endpoint} (${response.status})`);
    } catch {
      failures.push(endpoint);
    }
  }
  const allBusy = failures.every((failure) =>
    /\((429|503|504)\)/.test(failure)
  );
  throw new Error(
    allBusy
      ? "The workshop directory is busy right now. Please wait a moment and try again."
      : "The workshop directory could not be reached. Please try again in a moment."
  );
}

/**
 * Query Overpass for car-repair shops within `radiusMeters` of a point,
 * optionally filtered to a car brand. Uses `out center` so ways/relations
 * resolve to a usable coordinate.
 */
export async function fetchNearbyWorkshops(
  origin: LatLon,
  radiusMeters: number,
  brand?: string
): Promise<Workshop[]> {
  const data = await fetchOverpass(buildWorkshopQuery(origin, radiusMeters, brand));
  const elements = data.elements ?? [];

  return elements
    .map((element): Workshop | null => {
      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;
      const tags = element.tags ?? {};
      const name = tags.name?.trim();
      if (!name || lat === undefined || lon === undefined) return null;

      const parts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]]
        .filter((part): part is string => Boolean(part));

      return {
        id: `${element.type}-${element.id}`,
        name,
        lat,
        lon,
        distanceMeters: haversineMeters(origin, { lat, lon }),
        phone: tags.phone || tags["contact:phone"],
        website: tags.website || tags["contact:website"],
        openingHours: tags.opening_hours,
        address: parts.join(", ") || undefined,
        brand: tags.brand,
        operator: tags.operator,
      };
    })
    .filter((workshop): workshop is Workshop => workshop !== null)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/** Google Maps directions URL to a workshop coordinate. */
export function directionsUrl(workshop: LatLon): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${workshop.lat.toFixed(6)},${workshop.lon.toFixed(6)}`;
}

/** Human-friendly distance label ("1.2 km", "450 m"). */
export function formatDistance(meters: number): string {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}
