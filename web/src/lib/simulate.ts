// Deterministic SIMULATED data for one example astronaut on a 180-day
// Mars transit. Pure: simulate(day) always returns the same values (fixed
// seed, hash-based noise; no Math.random, no clock). Values are calibrated
// with published figures (docs/BRIEF-CONSTRUCCION.md §5.4) and are NOT real
// astronaut data.
//
// Scenario (video): normal until day 112; days 113–118 drift away from the
// personal baseline (resting heart rate +12–15 bpm, systolic +7–12 mmHg,
// sleep ≈ 4.8–5.2 h, mood ≈ −1 point); recovery from day 119.
import { INDICATORS, MISSION_DAYS } from "./model.ts";
import type { IndicatorId } from "./model.ts";

export const SEED = 0x51a80004;

export type DayValues = Record<IndicatorId, Record<string, number>>;

function hash32(a: number, b: number, c: number): number {
  let h = (SEED ^ Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 7, 0x85ebca77) ^ Math.imul(c + 13, 0xc2b2ae3d)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  h ^= h >>> 16;
  return h >>> 0;
}

function uniform(day: number, stream: number, k: number): number {
  return (hash32(day, stream, k) + 0.5) / 4294967296;
}

/** Standard normal noise for (day, stream), clamped to ±2.2 SD. */
export function noise(day: number, stream: number): number {
  const u1 = uniform(day, stream, 1);
  const u2 = uniform(day, stream, 2);
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(-2.2, Math.min(2.2, z));
}

function round(v: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

// Explicit values for the scenario days (drift 113–118, recovery 119–120).
const SCENARIO: Record<number, { hr: number; sys: number; dia: number; sleep: number; mood: number }> = {
  113: { hr: 74, sys: 119, dia: 75, sleep: 5.2, mood: 3.1 },
  114: { hr: 75, sys: 121, dia: 76, sleep: 5.0, mood: 3.0 },
  115: { hr: 76, sys: 122, dia: 77, sleep: 4.9, mood: 2.9 },
  116: { hr: 76, sys: 123, dia: 77, sleep: 5.1, mood: 3.0 },
  117: { hr: 77, sys: 124, dia: 78, sleep: 4.8, mood: 2.9 },
  118: { hr: 77, sys: 124, dia: 78, sleep: 4.8, mood: 2.8 },
  119: { hr: 67, sys: 118, dia: 75, sleep: 6.1, mood: 3.4 },
  120: { hr: 63, sys: 113, dia: 72, sleep: 6.9, mood: 3.9 },
};

/** Nightly CO₂ pockets near the sleep station (highest 1-h average, mmHg). */
export const CO2_PEAK_DAYS: Record<number, number> = { 41: 2.8, 88: 2.7, 152: 2.8 };

function rawDay(day: number) {
  const s = SCENARIO[day];
  const hr = s ? s.hr : 62 + 1.5 * noise(day, 1);
  const sys = s ? s.sys : 112 + 2.2 * noise(day, 2);
  const dia = s ? s.dia : 72 + 1.8 * noise(day, 3);
  const temp = 36.6 + 0.1 * noise(day, 4);
  const sleep = s ? s.sleep : 7.0 + 0.22 * noise(day, 5);
  const mood = s ? s.mood : 4.0 + 0.18 * noise(day, 6);
  const glucose = 88 + 3 * noise(day, 7);
  const doseToday = 1.5 + 0.06 * noise(day, 8);
  const co2Peak = CO2_PEAK_DAYS[day] ?? 2.2 + 0.1 * noise(day, 9);
  const co2Mean = 1.8 + 0.08 * noise(day, 10) + (CO2_PEAK_DAYS[day] ? 0.2 : 0);
  const strength = 100 - 8 * Math.pow(day / 118, 0.85) + 0.35 * noise(day, 11);
  const kcal = 2960 + 55 * noise(day, 12);
  const kg = 78.4 - 0.004 * day + 0.15 * noise(day, 13);
  return { hr, sys, dia, temp, sleep, mood, glucose, doseToday, co2Peak, co2Mean, strength, kcal, kg };
}

function build(): DayValues[] {
  const out: DayValues[] = [];
  let dose = 0;
  const co2Means: number[] = [];
  for (let day = 1; day <= MISSION_DAYS; day++) {
    const r = rawDay(day);
    dose += r.doseToday;
    co2Means.push(r.co2Mean);
    const last7 = co2Means.slice(-7);
    const avg7 = last7.reduce((a, b) => a + b, 0) / last7.length;
    out.push({
      hr: { bpm: round(r.hr, 0) },
      bp: { sys: round(r.sys, 0), dia: round(r.dia, 0) },
      temp: { c: round(r.temp, 1) },
      sleep: { h: round(r.sleep, 1) },
      mood: { score: round(r.mood, 1) },
      glucose: { mgdl: round(r.glucose, 0) },
      radiation: { msv: round(dose, 1), daily: round(r.doseToday, 2) },
      co2: { peak: round(r.co2Peak, 1), avg7: round(avg7, 1) },
      strength: { pct: round(r.strength, 1) },
      nutrition: { kcal: Math.round(r.kcal / 10) * 10, kg: round(r.kg, 1) },
    });
  }
  return out;
}

const SERIES: DayValues[] = build();

/** Simulated values for mission day 1..180 (clamped). */
export function simulate(day: number): DayValues {
  const d = Math.min(MISSION_DAYS, Math.max(1, Math.round(day)));
  return SERIES[d - 1];
}

/** Full series of one channel, index 0 = day 1. */
export function series(id: IndicatorId, key: string): number[] {
  return SERIES.map((v) => v[id][key]);
}

// Sanity: every indicator/channel exists in the generated data.
for (const def of INDICATORS) {
  for (const ch of def.channels) {
    if (typeof SERIES[0][def.id][ch.key] !== "number") throw new Error(`missing ${def.id}.${ch.key}`);
  }
}
