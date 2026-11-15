// Traffic-light rule (docs/BRIEF-CONSTRUCCION.md §5.5, adjustable):
//  • Green  "Normal"   — inside the personal baseline band (mean ± 1.5 SD of
//                         days 1–30) and inside published reference limits.
//  • Yellow "Drifting" — outside the band for 2+ days in a row, OR within 10%
//                         of a limit / in a published "above normal" category,
//                         OR a sustained trend that would cross the limit.
//  • Red    "Act now"  — beyond a published limit (NASA or general health).
// A value can be inside the general range and still be yellow because it
// drifted from YOUR baseline: that is the core idea of XionMetrical.
// Educational prototype: this is not a diagnosis.
import { BAND_K, BASELINE_DAYS, INDICATORS, INDICATOR_BY_ID, MISSION_DAYS, primaryChannel } from "./model.ts";
import type { ChannelDef, IndicatorDef, IndicatorId, Status, Threshold, ZoneId } from "./model.ts";
import { series, simulate } from "./simulate.ts";
import type { SourceId } from "./sources.ts";

export interface Band {
  mean: number;
  sd: number;
  low: number;
  high: number;
}

export type ReasonKind = "baseline" | "threshold" | "trend" | "building";

export interface Reason {
  kind: ReasonKind;
  status: Status;
  text: string;
  sources: SourceId[];
}

export interface ChannelAssessment {
  key: string;
  label: string;
  value: number;
  band: Band | null;
  status: Status;
  reasons: Reason[];
  /** Consecutive days (ending today) outside the band on the flagged side. */
  daysOutOfBand: number;
  side: "above" | "below" | null;
}

export interface IndicatorAssessment {
  id: IndicatorId;
  day: number;
  status: Status;
  channels: ChannelAssessment[];
  reasons: Reason[];
  daysOutOfBand: number;
  side: "above" | "below" | null;
  /** One-line summary for the early-warning card. */
  headline: string;
}

const RANK: Record<Status, number> = { normal: 0, drift: 1, alert: 2 };
export const worst = (a: Status, b: Status): Status => (RANK[a] >= RANK[b] ? a : b);

function round(v: number, d: number): number {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

// ---- personal baseline (days 1–30) ---------------------------------------
const bandCache = new Map<string, Band>();

export function baselineBand(id: IndicatorId, ch: ChannelDef): Band | null {
  if (!ch.baselineBand) return null;
  const key = `${id}.${ch.key}`;
  const hit = bandCache.get(key);
  if (hit) return hit;
  const vals = series(id, ch.key).slice(0, BASELINE_DAYS);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / (vals.length - 1));
  const half = Math.max(BAND_K * sd, ch.minHalfWidth);
  const band: Band = {
    mean: round(mean, ch.decimals + 1),
    sd: round(sd, ch.decimals + 2),
    low: round(mean - half, ch.decimals + 1),
    high: round(mean + half, ch.decimals + 1),
  };
  bandCache.set(key, band);
  return band;
}

function sideOf(v: number, band: Band, ch: ChannelDef): "above" | "below" | null {
  if (v > band.high && ch.driftDirection !== "down") return "above";
  if (v < band.low && ch.driftDirection !== "up") return "below";
  return null;
}

function slope(ys: number[]): number {
  const n = ys.length;
  const mx = (n - 1) / 2;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  ys.forEach((y, i) => {
    num += (i - mx) * (y - my);
    den += (i - mx) ** 2;
  });
  return den === 0 ? 0 : num / den;
}

function thresholdReason(t: Threshold, status: Status): Reason {
  return { kind: "threshold", status, text: t.label, sources: t.sources };
}

/**
 * `override` replaces the value of `day` (a measurement logged by the user);
 * the previous days keep the simulated history.
 */
export function assessChannel(def: IndicatorDef, ch: ChannelDef, day: number, override?: number): ChannelAssessment {
  const base = series(def.id, ch.key);
  const all = override === undefined ? base : base.map((x, i) => (i === day - 1 ? override : x));
  const v = all[day - 1];
  const reasons: Reason[] = [];
  let status: Status = "normal";

  // 1) Published limits and categories.
  if (ch.alertAbove && v >= ch.alertAbove.value) {
    status = "alert";
    reasons.push(thresholdReason(ch.alertAbove, "alert"));
  } else if (ch.warnAbove && v >= ch.warnAbove.value) {
    status = "drift";
    reasons.push(thresholdReason(ch.warnAbove, "drift"));
  }
  if (ch.alertBelow && v < ch.alertBelow.value) {
    status = "alert";
    reasons.push(thresholdReason(ch.alertBelow, "alert"));
  } else if (ch.warnBelow && v < ch.warnBelow.value) {
    status = worst(status, "drift");
    reasons.push(thresholdReason(ch.warnBelow, "drift"));
  }

  // 2) Personal baseline band.
  const band = baselineBand(def.id, ch);
  let daysOut = 0;
  let side: "above" | "below" | null = null;
  if (band) {
    if (day <= BASELINE_DAYS) {
      reasons.push({ kind: "building", status: "normal", text: `Building your baseline (day ${day} of ${BASELINE_DAYS})`, sources: [] });
    } else {
      side = sideOf(v, band, ch);
      if (side) {
        for (let d = day; d > BASELINE_DAYS; d--) {
          if (sideOf(all[d - 1], band, ch) === side) daysOut++;
          else break;
        }
        if (daysOut >= 2) {
          status = worst(status, "drift");
          reasons.unshift({
            kind: "baseline",
            status: "drift",
            text: `${side === "above" ? "Above" : "Below"} your baseline · ${daysOut} days`,
            sources: [],
          });
        }
      }
    }
  }

  // 3) Sustained trend toward a red limit (opt-in, 14-day window, 30-day horizon).
  if (ch.trendTowardLimit && day >= 14 && status === "normal") {
    const s = slope(all.slice(day - 14, day));
    const projected = v + s * 30;
    const hitsAbove = ch.alertAbove && s > 0 && projected >= ch.alertAbove.value;
    const hitsBelow = ch.alertBelow && s < 0 && projected < ch.alertBelow.value;
    if (hitsAbove || hitsBelow) {
      status = "drift";
      const t = (hitsAbove ? ch.alertAbove : ch.alertBelow) as Threshold;
      reasons.push({ kind: "trend", status: "drift", text: "Trending toward the limit within 30 days", sources: t.sources });
    }
  }

  return { key: ch.key, label: ch.label, value: v, band, status, reasons, daysOutOfBand: daysOut, side };
}

const dayCache = new Map<number, IndicatorAssessment[]>();

export function assessIndicator(def: IndicatorDef, day: number, overrides?: Partial<Record<string, number>>): IndicatorAssessment {
  const d = Math.min(MISSION_DAYS, Math.max(1, Math.round(day)));
  const channels = def.channels.map((ch) => assessChannel(def, ch, d, overrides?.[ch.key]));
  const status = channels.reduce<Status>((s, c) => worst(s, c.status), "normal");
  const reasons = channels.flatMap((c) => c.reasons);
  const outs = channels.filter((c) => c.daysOutOfBand >= 2);
  const lead = outs.sort((a, b) => b.daysOutOfBand - a.daysOutOfBand)[0];
  const daysOutOfBand = lead ? lead.daysOutOfBand : 0;
  const side = lead ? lead.side : null;
  let headline = `${def.name}: within your baseline`;
  const alertReason = reasons.find((r) => r.status === "alert");
  if (alertReason) headline = `${def.name}: ${lowerFirst(alertReason.text)}`;
  else if (lead) headline = `${def.name} ${lead.side} your baseline · ${daysOutOfBand} days`;
  else {
    const r = reasons.find((x) => x.status === "drift");
    if (r) headline = `${def.name}: ${lowerFirst(r.text)}`;
  }
  return { id: def.id, day: d, status, channels, reasons, daysOutOfBand, side, headline };
}

function lowerFirst(s: string): string {
  return /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
}

/** All 10 indicators for one mission day (memoized; pure). */
export function assessDay(day: number): IndicatorAssessment[] {
  const d = Math.min(MISSION_DAYS, Math.max(1, Math.round(day)));
  const hit = dayCache.get(d);
  if (hit) return hit;
  const res = INDICATORS.map((def) => assessIndicator(def, d));
  dayCache.set(d, res);
  return res;
}

/** Assess values logged by the user for `day` against the same rule (not cached). */
export function assessEntry(id: IndicatorId, day: number, values: Partial<Record<string, number>>): IndicatorAssessment {
  return assessIndicator(INDICATOR_BY_ID[id], day, values);
}

export function assessmentOf(id: IndicatorId, day: number): IndicatorAssessment {
  return assessDay(day).find((a) => a.id === id) as IndicatorAssessment;
}

/** Yellow/red indicators of the day, most severe first (early-warning card). */
export function activeAlerts(day: number): IndicatorAssessment[] {
  const order = INDICATORS.map((d) => d.id);
  return assessDay(day)
    .filter((a) => a.status !== "normal")
    .sort(
      (a, b) =>
        RANK[b.status] - RANK[a.status] ||
        b.daysOutOfBand - a.daysOutOfBand ||
        order.indexOf(a.id) - order.indexOf(b.id),
    );
}

export function zoneStatus(day: number): Record<ZoneId, Status> {
  const out: Record<ZoneId, Status> = { heart: "normal", brain: "normal", airway: "normal", body: "normal", muscle: "normal", abdomen: "normal", blood: "normal" };
  for (const a of assessDay(day)) {
    const z = INDICATOR_BY_ID[a.id].zone;
    out[z] = worst(out[z], a.status);
  }
  return out;
}

// ---- formatting --------------------------------------------------------------
export function fmt(v: number, decimals: number): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatValue(def: IndicatorDef, day: number): { value: string; unit: string } {
  const vals = simulate(day)[def.id];
  if (def.format === "pair") {
    const [a, b] = def.channels;
    return { value: `${fmt(vals[a.key], a.decimals)}/${fmt(vals[b.key], b.decimals)}`, unit: a.unit };
  }
  const ch = primaryChannel(def);
  return { value: fmt(vals[ch.key], ch.decimals), unit: ch.unit };
}
