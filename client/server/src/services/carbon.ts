

/**
 * Carbon & Logistics Intelligence helpers
 * - Estimate CO2 for a shipment based on mode, distance (km) and weight (kg)
 * - Suggest greener/cheaper alternatives with time & cost trade‑offs
 */

export type TransportMode = 'Local' | 'Ground' | 'Sea' | 'Air';

export interface CarbonInput {
  mode: TransportMode;
  distanceKm: number; // great‑circle or route distance in KM
  weightKg: number;   // shipment weight in KG
}

export interface CarbonEstimate extends CarbonInput {
  co2Kg: number;          // estimated CO2 in kilograms
  costIndex: number;      // relative cost index (100 = baseline for Ground)
  timeIndex: number;      // relative time index (lower = faster; 100 = Ground)
  notes?: string;
}

export interface AlternativeSuggestion {
  mode: TransportMode;
  co2Kg: number;
  deltaCo2Kg: number;     // negative = less CO2 than original
  costIndex: number;
  deltaCost: number;      // positive = more expensive
  timeIndex: number;
  deltaTime: number;      // positive = slower
  rationale: string;
}

// --- Emission factors (very conservative generic figures) ---
// Source blending (industry typical ranges). Units: kg CO2 per tonne‑km.
const EMISSION_FACTORS_T_PER_KM: Record<TransportMode, number> = {
  Local: 0.06,   // local courier/van (short‑haul urban average)
  Ground: 0.08,  // truck (regional)
  Sea: 0.02,     // container ship (deep‑sea, averaged)
  Air: 0.6,      // air freight (belly/cargo mix)
};

// Relative cost/time indices (baseline Ground = 100)
const COST_INDEX: Record<TransportMode, number> = {
  Local: 120,
  Ground: 100,
  Sea: 70,
  Air: 250,
};

const TIME_INDEX: Record<TransportMode, number> = {
  Local: 80,   // faster than regional ground
  Ground: 100,
  Sea: 300,   // slower
  Air: 50,    // fastest
};

export function estimateCO2({ mode, distanceKm, weightKg }: CarbonInput): CarbonEstimate {
  const dist = Math.max(0, distanceKm || 0);
  const w = Math.max(0, weightKg || 0);
  const tkm = (w / 1000) * dist; // tonne‑km
  const factor = EMISSION_FACTORS_T_PER_KM[mode] ?? EMISSION_FACTORS_T_PER_KM.Ground;
  const co2Kg = round2(tkm * factor * 1000); // convert t‑km * (kg CO2 / t‑km) → kg CO2
  return {
    mode,
    distanceKm: dist,
    weightKg: w,
    co2Kg,
    costIndex: COST_INDEX[mode],
    timeIndex: TIME_INDEX[mode],
  };
}

/**
 * Suggest greener/cheaper alternatives with trade‑offs against the original.
 * Returns up to 3 alternatives sorted by CO2 ascending.
 */
export function suggestAlternatives(input: CarbonInput): AlternativeSuggestion[] {
  const base = estimateCO2(input);
  const modes: TransportMode[] = ['Local', 'Ground', 'Sea', 'Air'];
  const alts = modes
    .filter((m) => m !== base.mode)
    .map((m) => estimateCO2({ ...input, mode: m }))
    .map((est) => ({
      mode: est.mode,
      co2Kg: est.co2Kg,
      deltaCo2Kg: round2(est.co2Kg - base.co2Kg),
      costIndex: est.costIndex,
      deltaCost: round2(est.costIndex - base.costIndex),
      timeIndex: est.timeIndex,
      deltaTime: round2(est.timeIndex - base.timeIndex),
      rationale: rationaleFor(est.mode),
    }))
    .sort((a, b) => a.co2Kg - b.co2Kg)
    .slice(0, 3);

  return alts;
}

function rationaleFor(mode: TransportMode): string {
  switch (mode) {
    case 'Sea':
      return 'Lowest CO₂ per tonne‑km; economical for non‑urgent bulk.';
    case 'Ground':
      return 'Balanced cost/speed; good regional option with moderate CO₂.';
    case 'Local':
      return 'Short‑haul/urban; use for intra‑city last‑mile with low distance.';
    case 'Air':
      return 'Fastest but highest CO₂; reserve for urgent or high‑value items.';
    default:
      return '';
  }
}

export function estimateWithAlternatives(input: CarbonInput) {
  const current = estimateCO2(input);
  const alternatives = suggestAlternatives(input);
  return { current, alternatives };
}

// utility
function round2(n: number) { return Math.round(n * 100) / 100; }