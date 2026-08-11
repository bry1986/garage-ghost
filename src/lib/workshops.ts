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

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
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

/**
 * Query Overpass for car-repair shops within `radiusMeters` of a point.
 * Uses `out center` so ways/relations resolve to a usable coordinate.
 */
export async function fetchNearbyWorkshops(
  origin: LatLon,
  radiusMeters: number
): Promise<Workshop[]> {
  const query = `
    [out:json][timeout:25];
    (
      node(around:${Math.round(radiusMeters)},${origin.lat},${origin.lon})[amenity=car_repair];
      way(around:${Math.round(radiusMeters)},${origin.lat},${origin.lon})[amenity=car_repair];
      relation(around:${Math.round(radiusMeters)},${origin.lat},${origin.lon})[amenity=car_repair];
      node(around:${Math.round(radiusMeters)},${origin.lat},${origin.lon})[shop=car_repair];
      way(around:${Math.round(radiusMeters)},${origin.lat},${origin.lon})[shop=car_repair];
      relation(around:${Math.round(radiusMeters)},${origin.lat},${origin.lon})[shop=car_repair];
    );
    out center;
  `;

  const response = await fetch(OVERPASS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ data: query }).toString(),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    // 429 = the shared instance is busy — surface a helpful message.
    throw new Error(
      response.status === 429
        ? "The workshop directory is busy right now. Please wait a moment and try again."
        : `The workshop directory request failed (${response.status}). Try again in a moment.`
    );
  }

  const data = (await response.json()) as { elements?: OverpassElement[] };
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
