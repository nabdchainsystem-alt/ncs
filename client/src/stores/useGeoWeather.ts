import { create } from "zustand";
import { resolveCoords, type Coords, type Place, GeoFetchError } from "../services/geo";
import { getCurrentWeather, WeatherFetchError, type CurrentWeather } from "../services/weather";

type State = {
  status: "idle" | "locating" | "fetching" | "ready" | "error";
  coords?: Coords;
  place?: Place;
  weather?: CurrentWeather;
  error?: string;
  refresh: () => Promise<void>;
};

let inflight: Promise<void> | null = null;

export const useGeoWeather = create<State>((set) => ({
  status: "idle",
  async refresh() {
    if (inflight) return inflight;
    inflight = (async () => {
      try {
        set({ status: "locating", error: undefined });
        const loc = await resolveCoords();
        set({ status: "fetching", coords: loc.coords, place: loc.place, weather: undefined });
        const weather = await getCurrentWeather(loc.coords, loc.place?.timezone);
        set({ status: "ready", coords: loc.coords, place: loc.place, weather, error: undefined });
      } catch (error) {
        let message = "Unknown error";
        if (error instanceof WeatherFetchError || error instanceof GeoFetchError) {
          message = error.message;
        } else if (error instanceof Error) {
          message = error.message;
        }
        set({ status: "error", error: message });
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  },
}));
