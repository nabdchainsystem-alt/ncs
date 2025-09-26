import type { QueryFunctionContext } from '@tanstack/react-query';

export type WeatherIconKey =
  | 'clear'
  | 'partly'
  | 'cloud'
  | 'rain'
  | 'storm'
  | 'snow'
  | 'fog';

export type MoonPhaseKey =
  | 'new'
  | 'waxing_crescent'
  | 'first_quarter'
  | 'waxing_gibbous'
  | 'full'
  | 'waning_gibbous'
  | 'last_quarter'
  | 'waning_crescent';

export type LiveWeatherSnapshot = {
  city: string;
  temperatureC: number;
  condition: string;
  isNight: boolean;
  iconKey: WeatherIconKey;
  highC?: number;
  lowC?: number;
  sunriseIso?: string;
  sunsetIso?: string;
  humidity?: number;
  precipitationMm?: number;
  precipDescription?: string;
  moonPhase: {
    value: number;
    key: MoonPhaseKey;
    label: string;
  };
  moonriseIso?: string;
  moonsetIso?: string;
  fetchedAtIso: string;
};

export type WeatherLocation = {
  latitude: number;
  longitude: number;
};

const WEATHER_DESCRIPTORS: Array<{
  codes: number[];
  label: string;
  iconKey: WeatherIconKey;
}> = [
  { codes: [0], label: 'Clear sky', iconKey: 'clear' },
  { codes: [1], label: 'Mostly clear', iconKey: 'partly' },
  { codes: [2], label: 'Partly cloudy', iconKey: 'partly' },
  { codes: [3], label: 'Overcast', iconKey: 'cloud' },
  { codes: [45, 48], label: 'Foggy', iconKey: 'fog' },
  { codes: [51, 53, 55], label: 'Light drizzle', iconKey: 'rain' },
  { codes: [56, 57], label: 'Freezing drizzle', iconKey: 'snow' },
  { codes: [61, 63, 65], label: 'Rain showers', iconKey: 'rain' },
  { codes: [66, 67], label: 'Freezing rain', iconKey: 'snow' },
  { codes: [71, 73, 75, 77], label: 'Snowfall', iconKey: 'snow' },
  { codes: [80, 81, 82], label: 'Rain showers', iconKey: 'rain' },
  { codes: [85, 86], label: 'Snow showers', iconKey: 'snow' },
  { codes: [95], label: 'Thunderstorm', iconKey: 'storm' },
  { codes: [96, 99], label: 'Storm with hail', iconKey: 'storm' },
];

function describeWeather(code: number): { label: string; iconKey: WeatherIconKey } {
  const match = WEATHER_DESCRIPTORS.find((entry) => entry.codes.includes(code));
  if (match) return { label: match.label, iconKey: match.iconKey };
  return { label: 'Weather update available', iconKey: 'cloud' };
}

type RawWeatherResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    is_day?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    sunrise?: string[];
    sunset?: string[];
    precipitation_sum?: number[];
  };
  timezone?: string;
  utc_offset_seconds?: number;
};

type AstronomyResponse = {
  daily?: {
    sunrise?: string[];
    sunset?: string[];
    moonrise?: string[];
    moonset?: string[];
    moon_phase?: number[];
  };
};

type ReverseGeocodeResponse = {
  results?: Array<{
    name?: string;
    city?: string;
    locality?: string;
    admin1?: string;
    country?: string;
  }>;
};

function resolveCityName(payload: ReverseGeocodeResponse | null, fallback: string): string {
  const entry = payload?.results?.[0];
  if (!entry) return fallback;
  const { name, city, locality, admin1, country } = entry;
  const primary = name ?? city ?? locality;
  if (primary) return primary;
  if (admin1 && country) return `${admin1}, ${country}`;
  return fallback;
}

function labelFromTimezone(timezone?: string | null): string | null {
  if (!timezone) return null;
  const parts = timezone.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  const region = parts[0]?.replace(/_/g, ' ');
  const city = parts[parts.length - 1]?.replace(/_/g, ' ');
  if (city && region && city !== region) return `${city}, ${region}`;
  return city || region || null;
}

function describeMoonPhase(value: number): { key: MoonPhaseKey; label: string; value: number } {
  const normalized = ((value % 1) + 1) % 1; // keep between 0-1
  if (normalized < 0.06 || normalized >= 0.94) return { key: 'new', label: 'New Moon', value: normalized };
  if (normalized < 0.19) return { key: 'waxing_crescent', label: 'Waxing Crescent', value: normalized };
  if (normalized < 0.31) return { key: 'first_quarter', label: 'First Quarter', value: normalized };
  if (normalized < 0.44) return { key: 'waxing_gibbous', label: 'Waxing Gibbous', value: normalized };
  if (normalized < 0.56) return { key: 'full', label: 'Full Moon', value: normalized };
  if (normalized < 0.69) return { key: 'waning_gibbous', label: 'Waning Gibbous', value: normalized };
  if (normalized < 0.81) return { key: 'last_quarter', label: 'Last Quarter', value: normalized };
  return { key: 'waning_crescent', label: 'Waning Crescent', value: normalized };
}

export type FetchWeatherContext = QueryFunctionContext<ReturnType<typeof weatherKey>>;

export function weatherKey(latitude: number, longitude: number) {
  return ['overview', 'daily-brief', 'weather', Number(latitude.toFixed(3)), Number(longitude.toFixed(3))] as const;
}

export async function fetchLiveWeather({
  queryKey,
}: FetchWeatherContext): Promise<LiveWeatherSnapshot> {
  const [, , , latitude, longitude] = queryKey;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new Error('Coordinates missing for weather lookup');
  }

  const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
  weatherUrl.searchParams.set('latitude', latitude.toString());
  weatherUrl.searchParams.set('longitude', longitude.toString());
  weatherUrl.searchParams.set(
    'current',
    'temperature_2m,weather_code,is_day,relative_humidity_2m,precipitation'
  );
  weatherUrl.searchParams.set(
    'daily',
    'temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,moon_phase,moonrise,moonset'
  );
  weatherUrl.searchParams.set('timezone', 'auto');

  const weatherResponse = await fetch(weatherUrl);
  if (!weatherResponse.ok) {
    throw new Error('Unable to retrieve live weather data');
  }
  const weatherData: RawWeatherResponse = await weatherResponse.json();

  let astronomyData: AstronomyResponse | null = null;
  try {
    const astronomyUrl = new URL('https://api.open-meteo.com/v1/astronomy');
    astronomyUrl.searchParams.set('latitude', latitude.toString());
    astronomyUrl.searchParams.set('longitude', longitude.toString());
    astronomyUrl.searchParams.set('daily', 'sunrise,sunset,moonrise,moonset,moon_phase');
    astronomyUrl.searchParams.set('timezone', 'auto');

    const astronomyResponse = await fetch(astronomyUrl);
    if (astronomyResponse.ok) {
      astronomyData = (await astronomyResponse.json()) as AstronomyResponse;
    }
  } catch (error) {
    console.warn('Astronomy lookup failed', error);
  }
  const current = weatherData.current ?? {};

  if (typeof current.temperature_2m !== 'number' || typeof current.weather_code !== 'number') {
    throw new Error('Live weather data incomplete');
  }

  let cityFallback = labelFromTimezone(weatherData.timezone) ?? 'Current Location';
  try {
    const geocodeUrl = new URL('https://geocoding-api.open-meteo.com/v1/reverse');
    geocodeUrl.searchParams.set('latitude', latitude.toString());
    geocodeUrl.searchParams.set('longitude', longitude.toString());
    geocodeUrl.searchParams.set('language', 'en');
    geocodeUrl.searchParams.set('count', '1');

    const geocodeResponse = await fetch(geocodeUrl);
    if (geocodeResponse.ok) {
      const geocodeData: ReverseGeocodeResponse = await geocodeResponse.json();
      cityFallback = resolveCityName(geocodeData, cityFallback);
    }
  } catch (error) {
    console.warn('Reverse geocoding failed', error);
  }

  const descriptor = describeWeather(current.weather_code);
  const highC = weatherData.daily?.temperature_2m_max?.[0];
  const lowC = weatherData.daily?.temperature_2m_min?.[0];
  const sunriseIso = weatherData.daily?.sunrise?.[0] ?? astronomyData?.daily?.sunrise?.[0];
  const sunsetIso = weatherData.daily?.sunset?.[0] ?? astronomyData?.daily?.sunset?.[0];
  const isNight = (() => {
    if (typeof current.is_day === 'number') return current.is_day === 0;
    if (sunriseIso && sunsetIso) {
      const now = new Date();
      const sunriseDate = new Date(sunriseIso);
      const sunsetDate = new Date(sunsetIso);
      if (!Number.isNaN(sunriseDate.getTime()) && !Number.isNaN(sunsetDate.getTime())) {
        return now < sunriseDate || now >= sunsetDate;
      }
    }
    return false;
  })();
  const precipitationNow = weatherData.current?.precipitation;
  const precipitationSum = weatherData.daily?.precipitation_sum?.[0];
  const moonPhaseRaw = astronomyData?.daily?.moon_phase?.[0];
  const moonPhaseValue = typeof moonPhaseRaw === 'number' ? moonPhaseRaw : 0;
  const moonPhaseInfo = describeMoonPhase(moonPhaseValue);
  const precipDescription = (() => {
    if (typeof precipitationNow === 'number' && precipitationNow > 0) {
      return precipitationNow >= 5
        ? 'Heavy rain showers'
        : precipitationNow >= 2
        ? 'Moderate rain'
        : 'Light rain';
    }
    if (typeof precipitationSum === 'number' && precipitationSum > 0.1) {
      return 'Rain expected later today';
    }
    return undefined;
  })();

  return {
    city: cityFallback,
    temperatureC: current.temperature_2m,
    condition: descriptor.label,
    isNight,
    iconKey: descriptor.iconKey,
    highC: typeof highC === 'number' ? highC : undefined,
    lowC: typeof lowC === 'number' ? lowC : undefined,
    sunriseIso,
    sunsetIso,
    humidity: typeof current.relative_humidity_2m === 'number' ? current.relative_humidity_2m : undefined,
    precipitationMm: typeof precipitationNow === 'number' ? precipitationNow : undefined,
    precipDescription,
    moonPhase: {
      value: moonPhaseValue,
      key: moonPhaseInfo.key,
      label: moonPhaseInfo.label,
    },
    moonriseIso: astronomyData?.daily?.moonrise?.[0],
    moonsetIso: astronomyData?.daily?.moonset?.[0],
    fetchedAtIso: new Date().toISOString(),
  };
}
