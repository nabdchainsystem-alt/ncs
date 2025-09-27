import { safeFetch, GeoFetchError, type Coords, type Place } from "./geo";

export type CurrentWeather = {
  temperature: number;
  description: string;
  code: number;
  high?: number;
  low?: number;
  isDay?: boolean;
  timezone?: string;
  fetchedAt: string;
};

export class WeatherFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeatherFetchError";
  }
}

const WEATHER_DESCRIPTORS: Array<{ codes: number[]; label: string }> = [
  { codes: [0], label: "Clear sky" },
  { codes: [1], label: "Mostly clear" },
  { codes: [2], label: "Partly cloudy" },
  { codes: [3], label: "Overcast" },
  { codes: [45, 48], label: "Foggy" },
  { codes: [51, 53, 55], label: "Light drizzle" },
  { codes: [56, 57], label: "Freezing drizzle" },
  { codes: [61, 63, 65], label: "Rain showers" },
  { codes: [66, 67], label: "Freezing rain" },
  { codes: [71, 73, 75, 77], label: "Snowfall" },
  { codes: [80, 81, 82], label: "Rain showers" },
  { codes: [85, 86], label: "Snow showers" },
  { codes: [95], label: "Thunderstorm" },
  { codes: [96, 99], label: "Storm with hail" },
];

function describeWeather(code: number): string {
  const match = WEATHER_DESCRIPTORS.find((entry) => entry.codes.includes(code));
  if (match) return match.label;
  return "Conditions unavailable";
}

function ensureCoords(coords: Coords | undefined): asserts coords is Coords {
  if (!coords || !Number.isFinite(coords.lat) || !Number.isFinite(coords.lon)) {
    throw new WeatherFetchError("Valid coordinates required for weather lookup");
  }
}

export async function getCurrentWeather(coords: Coords, timezone?: Place["timezone"]): Promise<CurrentWeather> {
  ensureCoords(coords);
  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
  weatherUrl.searchParams.set("latitude", coords.lat.toString());
  weatherUrl.searchParams.set("longitude", coords.lon.toString());
  weatherUrl.searchParams.set("current", "temperature_2m,weather_code,is_day");
  weatherUrl.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
  weatherUrl.searchParams.set("forecast_days", "1");
  weatherUrl.searchParams.set("timezone", timezone && timezone.trim() ? timezone : "auto");

  let response: Response;
  try {
    response = await safeFetch(weatherUrl.toString(), 8000);
  } catch (error) {
    if (error instanceof GeoFetchError) {
      if (error.code === "timeout") {
        throw new WeatherFetchError("Weather service timed out");
      }
      throw new WeatherFetchError("Unable to reach weather service");
    }
    throw error;
  }

  if (!response.ok) {
    throw new WeatherFetchError(`Weather service responded with status ${response.status}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new WeatherFetchError("Weather service returned invalid JSON");
  }

  const json = payload as {
    current?: { temperature_2m?: number; weather_code?: number; is_day?: number };
    daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
    timezone?: string;
  };
  const current = json.current ?? {};
  const temperature = typeof current.temperature_2m === "number" ? current.temperature_2m : null;
  const code = typeof current.weather_code === "number" ? current.weather_code : null;
  const isDay = typeof current.is_day === "number" ? current.is_day === 1 : undefined;
  const high = json.daily?.temperature_2m_max?.[0];
  const low = json.daily?.temperature_2m_min?.[0];

  if (temperature === null || code === null) {
    throw new WeatherFetchError("Weather data incomplete");
  }

  return {
    temperature,
    description: describeWeather(code),
    code,
    high: typeof high === "number" ? high : undefined,
    low: typeof low === "number" ? low : undefined,
    isDay,
    timezone: typeof json.timezone === "string" ? json.timezone : timezone,
    fetchedAt: new Date().toISOString(),
  };
}
