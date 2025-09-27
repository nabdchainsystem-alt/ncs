import { getIPCoords } from "../../services/geo";
import { getCurrentWeather } from "../../services/weather";

export async function printGeoWeatherDiagnostics() {
  console.group("GeoWeather Diagnostics");
  try {
    console.log("Origin:", typeof location !== "undefined" ? location.origin : "n/a");
  } catch {
    console.log("Origin: unavailable");
  }
  console.log("isSecureContext:", typeof isSecureContext !== "undefined" ? isSecureContext : "unknown");
  console.log("navigator.geolocation:", typeof navigator !== "undefined" ? !!navigator.geolocation : "n/a");
  try {
    const descriptor = { name: "geolocation" as PermissionName } as PermissionDescriptor;
    const permission = await navigator.permissions?.query?.(descriptor);
    console.log("geolocation permission:", permission?.state ?? "unsupported");
  } catch (error) {
    console.log("Permissions API not available:", error);
  }

  const ipStart = typeof performance !== "undefined" ? performance.now() : Date.now();
  const ip = await getIPCoords();
  const ipEnd = typeof performance !== "undefined" ? performance.now() : Date.now();
  console.log("IP Fallback result:", ip);
  console.log("IP lookup ms:", Math.round(ipEnd - ipStart));

  if (ip) {
    const weatherStart = typeof performance !== "undefined" ? performance.now() : Date.now();
    try {
      const weather = await getCurrentWeather(ip.coords, ip.place?.timezone);
      const weatherEnd = typeof performance !== "undefined" ? performance.now() : Date.now();
      console.log("Weather result:", weather);
      console.log("Weather fetch ms:", Math.round(weatherEnd - weatherStart));
    } catch (error) {
      console.log("Weather fetch failed:", error);
    }
  }

  console.groupEnd();
}
