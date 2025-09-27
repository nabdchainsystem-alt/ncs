export type Coords = { lat: number; lon: number };
export type Place = { city?: string; region?: string; country?: string; timezone?: string };

const CACHE_KEY = "geo:last";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const DEFAULT_FETCH_TIMEOUT = 8000;

let browserGeoState: "unknown" | "denied" | "failed" | "success" = "unknown";

export type GeoFetchErrorCode = "timeout" | "network" | "http" | "invalid";

export class GeoFetchError extends Error {
  readonly code: GeoFetchErrorCode;

  constructor(message: string, code: GeoFetchErrorCode) {
    super(message);
    this.name = "GeoFetchError";
    this.code = code;
  }
}

type Cached = { t: number; coords: Coords; place?: Place };

type CachedPayload = { coords: Coords; place?: Place };

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== "undefined" && (globalThis as { localStorage?: Storage }).localStorage) {
      return (globalThis as { localStorage?: Storage }).localStorage ?? null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function isCoordsValid(coords: Coords | undefined): coords is Coords {
  return (
    !!coords &&
    typeof coords.lat === "number" &&
    typeof coords.lon === "number" &&
    Number.isFinite(coords.lat) &&
    Number.isFinite(coords.lon)
  );
}

function readCache(): CachedPayload | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Cached;
    if (!data || typeof data !== "object" || typeof data.t !== "number") return null;
    if (Date.now() - data.t > CACHE_TTL_MS) return null;
    if (!isCoordsValid(data.coords)) return null;
    const place = data.place && typeof data.place === "object" ? data.place : undefined;
    return { coords: data.coords, place };
  } catch {
    return null;
  }
}

function writeCache(payload: CachedPayload) {
  const storage = getLocalStorage();
  if (!storage) return;
  if (!isCoordsValid(payload.coords)) return;
  try {
    const data: Cached = { t: Date.now(), coords: payload.coords, place: payload.place };
    storage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export async function safeFetch(url: string, ms = DEFAULT_FETCH_TIMEOUT, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  try {
    const incomingHeaders = init.headers as HeadersInit | undefined;
    let headers: HeadersInit;
    if (typeof Headers !== "undefined") {
      const composed = new Headers(incomingHeaders);
      if (!composed.has("Accept")) {
        composed.set("Accept", "application/json");
      }
      headers = composed;
    } else {
      const base: Record<string, string> = { Accept: "application/json" };
      if (Array.isArray(incomingHeaders)) {
        for (const [key, value] of incomingHeaders) {
          base[key] = value;
        }
      } else if (incomingHeaders && typeof incomingHeaders === "object") {
        Object.assign(base, incomingHeaders as Record<string, string>);
      }
      headers = base;
    }
    const response = await fetch(url, { ...init, headers, signal: controller.signal });
    return response;
  } catch (error) {
    if ((error as { name?: string } | undefined)?.name === "AbortError") {
      throw new GeoFetchError(`Request to ${url} timed out in ${ms}ms`, "timeout");
    }
    throw new GeoFetchError(`Network request to ${url} failed`, "network");
  } finally {
    clearTimeout(timeoutId);
  }
}

const PERMISSION_DENIED_CODE = typeof GeolocationPositionError !== "undefined"
  ? GeolocationPositionError.PERMISSION_DENIED
  : 1;

export async function getBrowserCoords(
  opts: PositionOptions = { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
): Promise<{ coords: Coords } | null> {
  if (browserGeoState === "denied" || browserGeoState === "failed") {
    return null;
  }
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    browserGeoState = "failed";
    return null;
  }

  if (typeof isSecureContext !== "undefined" && typeof location !== "undefined") {
    if (!isSecureContext && location.hostname !== "localhost") {
      browserGeoState = "failed";
      return null;
    }
  }

  try {
    const descriptor = { name: "geolocation" as PermissionName } as PermissionDescriptor;
    const permissionResult = await navigator.permissions?.query?.(descriptor);
    if (permissionResult && permissionResult.state === "denied") {
      browserGeoState = "denied";
      return null;
    }
  } catch {
    // Silently ignore permission API issues.
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        } satisfies Coords;
        if (!isCoordsValid(coords)) {
          browserGeoState = "failed";
          resolve(null);
          return;
        }
        browserGeoState = "success";
        resolve({ coords });
      },
      (error) => {
        browserGeoState = error?.code === PERMISSION_DENIED_CODE ? "denied" : "failed";
        resolve(null);
      },
      opts
    );
  });
}

export async function getIPCoords(): Promise<{ coords: Coords; place: Place } | null> {
  try {
    const response = await safeFetch("https://ipapi.co/json/", DEFAULT_FETCH_TIMEOUT);
    if (!response.ok) {
      throw new GeoFetchError(`IP lookup failed with status ${response.status}`, "http");
    }
    const json = (await response.json()) as Record<string, unknown>;
    const lat = Number(json.latitude);
    const lon = Number(json.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new GeoFetchError("IP lookup returned invalid coordinates", "invalid");
    }
    const place: Place = {
      city: typeof json.city === "string" ? json.city : undefined,
      region: typeof json.region === "string" ? json.region : undefined,
      country: typeof json.country_name === "string" ? json.country_name : undefined,
      timezone: typeof json.timezone === "string" ? json.timezone : undefined,
    };
    return { coords: { lat, lon }, place };
  } catch (error) {
    const err = error instanceof GeoFetchError ? error : null;
    const details = err ? `${err.message} (${err.code})` : (error as Error | undefined)?.message;
    console.warn("Geo: IP fallback failed", details ?? error);
    return null;
  }
}

export async function resolveCoords(): Promise<{ coords: Coords; place?: Place }> {
  const cached = readCache();
  if (cached && isCoordsValid(cached.coords)) {
    return cached;
  }

  const browserResult = await getBrowserCoords();
  if (browserResult && isCoordsValid(browserResult.coords)) {
    const output = { coords: browserResult.coords };
    writeCache(output);
    return output;
  }

  const ipResult = await getIPCoords();
  if (ipResult && isCoordsValid(ipResult.coords)) {
    writeCache(ipResult);
    return ipResult;
  }

  const fallback = {
    coords: { lat: 24.7136, lon: 46.6753 },
    place: { city: "Riyadh", country: "Saudi Arabia" },
  } as const;
  writeCache(fallback);
  return fallback;
}
