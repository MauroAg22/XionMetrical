// XionMetrical — indicator catalogue (10 indicators, 5 hazards).
// Reference values come from docs/PROYECTO-BASE.md §4.2 (decision D14) and
// docs/base-conocimiento/11-12. Nothing here is a diagnosis: it is an
// educational prototype that compares each value with the astronaut's own
// baseline, then with a published limit (NASA or general health) and cites it.
import type { SourceId } from "./sources.ts";

export type IndicatorId =
  | "hr" | "bp" | "temp" | "sleep" | "mood"
  | "glucose" | "radiation" | "co2" | "strength" | "nutrition";

export type HazardId = "radiation" | "isolation" | "distance" | "gravity" | "environment";
export type ZoneId = "heart" | "brain" | "airway" | "body" | "muscle" | "abdomen" | "blood";
export type Status = "normal" | "drift" | "alert";
export type Direction = "up" | "down" | "both";

export interface Threshold {
  value: number;
  label: string; // short English explanation shown in the panel
  sources: SourceId[];
}

export interface ChannelDef {
  key: string;
  label: string;
  unit: string;
  decimals: number;
  /** Compare with the personal baseline band (days 1–30). */
  baselineBand: boolean;
  /** Floor for the band half-width (measurement resolution), so a very
   *  steady baseline does not produce a band narrower than the instrument. */
  minHalfWidth: number;
  driftDirection: Direction;
  warnAbove?: Threshold;
  alertAbove?: Threshold;
  warnBelow?: Threshold;
  alertBelow?: Threshold;
  /** Opt-in: yellow when the 14-day trend would cross the red limit within 30 days. */
  trendTowardLimit?: boolean;
  /** Show this channel in the trend chart / main value. */
  primary?: boolean;
}

export interface IndicatorDef {
  id: IndicatorId;
  name: string;
  short: string;
  hazard: HazardId;
  zone: ZoneId;
  channels: ChannelDef[];
  /** How the value is written in one line, e.g. "122/77 mmHg". */
  format: "single" | "pair";
  reference: { text: string; sources: SourceId[] };
  /** NASA has a numeric value for it, or only general-health ranges. */
  referenceKind: "nasa" | "general" | "baseline-only";
}

export const HAZARDS: Record<HazardId, { name: string; short: string; color: string }> = {
  radiation: { name: "Space radiation", short: "Radiation", color: "#b48cff" },
  isolation: { name: "Isolation and confinement", short: "Isolation", color: "#5fb3ff" },
  distance: { name: "Distance from Earth", short: "Distance", color: "#7dd3c0" },
  gravity: { name: "Gravity fields", short: "Gravity", color: "#8db8ff" },
  environment: { name: "Hostile and closed environments", short: "Closed environment", color: "#c9a7ff" },
};

export const ZONES: Record<ZoneId, { name: string }> = {
  heart: { name: "Heart" },
  brain: { name: "Brain" },
  airway: { name: "Lungs and airway" },
  body: { name: "Whole body" },
  muscle: { name: "Muscles" },
  abdomen: { name: "Digestion and body mass" },
  blood: { name: "Blood" },
};

export const INDICATORS: IndicatorDef[] = [
  {
    id: "hr",
    name: "Resting heart rate",
    short: "Heart rate",
    hazard: "gravity",
    zone: "heart",
    format: "single",
    referenceKind: "general",
    reference: { text: "At rest: 60–100 beats/min in healthy adults on Earth (well-trained athletes: 40–60). In flight, your own baseline comes first.", sources: ["F-G01"] },
    channels: [
      {
        key: "bpm", label: "Resting heart rate", unit: "bpm", decimals: 0, primary: true,
        baselineBand: true, minHalfWidth: 3, driftDirection: "both",
        warnAbove: { value: 90, label: "Within 10% of the upper end of the resting range (100 bpm)", sources: ["F-G01"] },
        alertAbove: { value: 101, label: "Above the 60–100 bpm resting range for adults", sources: ["F-G01"] },
        warnBelow: { value: 44, label: "Within 10% of the lower end of the trained-athlete range (40 bpm)", sources: ["F-G01"] },
        alertBelow: { value: 39.5, label: "Below the 40–60 bpm range of well-trained athletes", sources: ["F-G01"] },
      },
    ],
  },
  {
    id: "bp",
    name: "Blood pressure",
    short: "Blood pressure",
    hazard: "gravity",
    zone: "heart",
    format: "pair",
    referenceKind: "general",
    reference: { text: "Normal below 120/80 mmHg · elevated 120–129 and below 80 · stage 1: 130–139 or 80–89 · stage 2: 140+ or 90+ · above 180/120 is severe, and an emergency with symptoms.", sources: ["F-G02"] },
    channels: [
      {
        key: "sys", label: "Systolic", unit: "mmHg", decimals: 0, primary: true,
        baselineBand: true, minHalfWidth: 4, driftDirection: "up",
        warnAbove: { value: 120, label: "Systolic 120+ mmHg: above the normal category (CDC)", sources: ["F-G02"] },
        alertAbove: { value: 140, label: "Systolic 140+ mmHg: stage 2 category (CDC)", sources: ["F-G02"] },
      },
      {
        key: "dia", label: "Diastolic", unit: "mmHg", decimals: 0,
        baselineBand: true, minHalfWidth: 3, driftDirection: "up",
        warnAbove: { value: 80, label: "Diastolic 80+ mmHg: above the normal category (CDC)", sources: ["F-G02"] },
        alertAbove: { value: 90, label: "Diastolic 90+ mmHg: stage 2 category (CDC)", sources: ["F-G02"] },
      },
    ],
  },
  {
    id: "temp",
    name: "Body temperature",
    short: "Temperature",
    hazard: "environment",
    zone: "body",
    format: "single",
    referenceKind: "general",
    reference: { text: "Normal 36.1–37.2 °C (average 37 °C); fever above 38 °C; below 35 °C is hypothermia. It changes during the day and is lowest before dawn.", sources: ["F-G03", "F-N15"] },
    channels: [
      {
        key: "c", label: "Body temperature", unit: "°C", decimals: 1, primary: true,
        baselineBand: true, minHalfWidth: 0.2, driftDirection: "both",
        warnAbove: { value: 37.3, label: "Above the 36.1–37.2 °C normal range", sources: ["F-G03"] },
        alertAbove: { value: 38.05, label: "Fever: above 38 °C", sources: ["F-G03"] },
        warnBelow: { value: 36.05, label: "Below the 36.1–37.2 °C normal range", sources: ["F-G03"] },
        alertBelow: { value: 35.0, label: "Hypothermia: below 35 °C", sources: ["F-G03", "F-N15"] },
      },
    ],
  },
  {
    id: "sleep",
    name: "Sleep",
    short: "Sleep",
    hazard: "isolation",
    zone: "brain",
    format: "single",
    referenceKind: "nasa",
    reference: { text: "NASA plans an 8.5-hour sleep period per day, plus 2 h before and 1.5 h after it. NASA gives no minimum for measured sleep, so your own baseline sets the alert.", sources: ["F-N15"] },
    channels: [
      {
        key: "h", label: "Sleep", unit: "h", decimals: 1, primary: true,
        baselineBand: true, minHalfWidth: 0.4, driftDirection: "down",
      },
    ],
  },
  {
    id: "mood",
    name: "Mood",
    short: "Mood",
    hazard: "isolation",
    zone: "brain",
    format: "single",
    referenceKind: "baseline-only",
    reference: { text: "Self-rated 1–5 scale (team-defined, not a validated clinical instrument). NASA asks that behavioral health stays within clinically accepted values but gives no number, so only your baseline is used.", sources: ["F-N15"] },
    channels: [
      {
        key: "score", label: "Mood", unit: "/ 5", decimals: 1, primary: true,
        baselineBand: true, minHalfWidth: 0.3, driftDirection: "down",
      },
    ],
  },
  {
    id: "glucose",
    name: "Fasting blood glucose",
    short: "Glucose",
    hazard: "gravity",
    zone: "blood",
    format: "single",
    referenceKind: "general",
    reference: { text: "Fasting (8 h or more): below 100 mg/dL is normal · 100–125 is the prediabetes range · 126 or more is the diabetes range. Not a NASA value: general health, declared as such.", sources: ["F-G04"] },
    channels: [
      {
        key: "mgdl", label: "Fasting glucose", unit: "mg/dL", decimals: 0, primary: true,
        baselineBand: true, minHalfWidth: 5, driftDirection: "both",
        warnAbove: { value: 100, label: "100–125 mg/dL: prediabetes range (ADA)", sources: ["F-G04"] },
        alertAbove: { value: 126, label: "126+ mg/dL: diabetes range (ADA)", sources: ["F-G04"] },
      },
    ],
  },
  {
    id: "radiation",
    name: "Cumulative radiation dose",
    short: "Radiation",
    hazard: "radiation",
    zone: "body",
    format: "single",
    referenceKind: "nasa",
    reference: { text: "Career limit: below 600 mSv effective dose [V1 4030]; below 250 mSv per solar particle event [V1 4031]. NASA's own Mars-transit example uses about 1.5 mSv per day; on the surface of Mars, Curiosity measured about 0.67 mSv per day.", sources: ["F-N15", "F-N16", "F-N18"] },
    channels: [
      {
        key: "msv", label: "Cumulative dose", unit: "mSv", decimals: 1, primary: true,
        baselineBand: false, minHalfWidth: 0, driftDirection: "up", trendTowardLimit: true,
        warnAbove: { value: 540, label: "Within 10% of the 600 mSv career limit", sources: ["F-N15"] },
        alertAbove: { value: 600, label: "At or above the 600 mSv career limit [V1 4030]", sources: ["F-N15"] },
      },
    ],
  },
  {
    id: "co2",
    name: "CO₂ near you",
    short: "CO₂",
    hazard: "environment",
    zone: "airway",
    format: "single",
    referenceKind: "nasa",
    reference: { text: "1-hour average: 3 mmHg or less; 7-day average below 2.5 mmHg (to keep the risk of CO₂ headache under 1%). Fixed sensors miss local pockets, so a personal monitor is used.", sources: ["F-N14"] },
    channels: [
      {
        key: "peak", label: "Highest 1-h average today", unit: "mmHg", decimals: 1, primary: true,
        baselineBand: false, minHalfWidth: 0, driftDirection: "up",
        warnAbove: { value: 2.7, label: "Within 10% of the 3 mmHg 1-hour limit", sources: ["F-N14"] },
        alertAbove: { value: 3.05, label: "Above the 3 mmHg 1-hour limit", sources: ["F-N14"] },
      },
      {
        key: "avg7", label: "7-day average", unit: "mmHg", decimals: 1,
        baselineBand: false, minHalfWidth: 0, driftDirection: "up",
        warnAbove: { value: 2.5, label: "7-day average at or above 2.5 mmHg", sources: ["F-N14"] },
      },
    ],
  },
  {
    id: "strength",
    name: "Strength and fitness",
    short: "Strength",
    hazard: "gravity",
    zone: "muscle",
    format: "single",
    referenceKind: "nasa",
    reference: { text: "In flight, muscle strength and aerobic capacity must stay at 80% or more of your pre-flight baseline [V1 4024], [V1 4003].", sources: ["F-N15"] },
    channels: [
      {
        key: "pct", label: "Strength vs. pre-flight", unit: "%", decimals: 1, primary: true,
        baselineBand: false, minHalfWidth: 0, driftDirection: "down", trendTowardLimit: true,
        warnBelow: { value: 88, label: "Within 10% of the 80% limit", sources: ["F-N15"] },
        alertBelow: { value: 80, label: "Below 80% of your pre-flight baseline [V1 4024]", sources: ["F-N15"] },
      },
    ],
  },
  {
    id: "nutrition",
    name: "Food intake and body mass",
    short: "Nutrition",
    hazard: "distance",
    zone: "abdomen",
    format: "single",
    referenceKind: "nasa",
    reference: { text: "NASA plans an average of 3,035 kcal per crew member per day (+200 kcal per hour of spacewalk) and 100% of each person's calculated needs. No numeric weight-loss limit was found.", sources: ["F-N15", "F-N17"] },
    channels: [
      {
        key: "kcal", label: "Food intake", unit: "kcal", decimals: 0, primary: true,
        baselineBand: true, minHalfWidth: 150, driftDirection: "down",
        warnBelow: { value: 2732, label: "Below 90% of the 3,035 kcal/day reference", sources: ["F-N15", "F-N17"] },
      },
      {
        key: "kg", label: "Body mass", unit: "kg", decimals: 1,
        baselineBand: true, minHalfWidth: 1.0, driftDirection: "down",
      },
    ],
  },
];

export const INDICATOR_BY_ID: Record<IndicatorId, IndicatorDef> = Object.fromEntries(
  INDICATORS.map((d) => [d.id, d]),
) as Record<IndicatorId, IndicatorDef>;

/** Full simulated Mars mission (decision D24): 180 days out, 720 on the surface, 180 back. */
export const MISSION_DAYS = 1080;

export type PhaseId = "outbound" | "surface" | "return";
export interface Phase {
  id: PhaseId;
  name: string;
  short: string;
  start: number;
  end: number;
}
export const PHASES: Phase[] = [
  { id: "outbound", name: "Transit to Mars", short: "To Mars", start: 1, end: 180 },
  { id: "surface", name: "Mars surface stay", short: "On Mars", start: 181, end: 900 },
  { id: "return", name: "Return to Earth", short: "To Earth", start: 901, end: 1080 },
];
export function phaseOf(day: number): Phase {
  return PHASES.find((p) => day <= p.end) ?? PHASES[PHASES.length - 1];
}
export const BASELINE_DAYS = 30;
export const BAND_K = 1.5;

export const STATUS_LABEL: Record<Status, string> = {
  normal: "Normal",
  drift: "Drifting",
  alert: "Act now",
};

export function primaryChannel(def: IndicatorDef): ChannelDef {
  return def.channels.find((c) => c.primary) ?? def.channels[0];
}
