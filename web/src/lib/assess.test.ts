// Run: npm test (node --test, Node 24 type stripping; no test framework).
import { test } from "node:test";
import assert from "node:assert/strict";
import { activeAlerts, assessDay, assessEntry, assessmentOf, baselineBand, formatValue, zoneStatus } from "./assess.ts";
import { ROUTINE, isDue, nextDue } from "./routine.ts";
import { INDICATORS, INDICATOR_BY_ID, primaryChannel } from "./model.ts";
import type { IndicatorId, Status } from "./model.ts";
import { CO2_PEAK_DAYS, simulate } from "./simulate.ts";

const SCENARIO_IDS: IndicatorId[] = ["hr", "bp", "sleep", "mood"];
const statusMap = (day: number): Record<string, Status> =>
  Object.fromEntries(assessDay(day).map((a) => [a.id, a.status]));

test("simulate() is deterministic and covers 180 days", () => {
  assert.deepEqual(simulate(57), simulate(57));
  assert.ok(simulate(180).radiation.msv > simulate(1).radiation.msv);
  assert.deepEqual(simulate(999), simulate(180));
});

test("baseline (days 1–30) is close to the brief's suggested values", () => {
  const near = (id: IndicatorId, target: number, tol: number) => {
    const b = baselineBand(id, primaryChannel(INDICATOR_BY_ID[id]));
    assert.ok(b, `${id} has a band`);
    assert.ok(Math.abs(b.mean - target) <= tol, `${id} mean ${b.mean} ≈ ${target}`);
  };
  near("hr", 62, 1);
  near("bp", 112, 1.5);
  near("temp", 36.6, 0.1);
  near("sleep", 7, 0.15);
  near("mood", 4, 0.15);
  near("glucose", 88, 1.5);
  near("nutrition", 2960, 40);
});

test("day 112: everything normal", () => {
  for (const [id, s] of Object.entries(statusMap(112))) assert.equal(s, "normal", `${id} on day 112`);
});

test("day 113: drift starts but nothing is flagged yet (needs 2 days)", () => {
  for (const [id, s] of Object.entries(statusMap(113))) assert.equal(s, "normal", `${id} on day 113`);
});

test("day 115: heart rate, blood pressure, sleep and mood are yellow; the rest green", () => {
  const m = statusMap(115);
  for (const id of SCENARIO_IDS) assert.equal(m[id], "drift", `${id} drifting on day 115`);
  for (const def of INDICATORS) if (!SCENARIO_IDS.includes(def.id)) assert.equal(m[def.id], "normal", `${def.id} normal on day 115`);
  const alerts = activeAlerts(115);
  assert.equal(alerts[0].id, "hr");
  assert.equal(alerts[0].headline, "Resting heart rate above your baseline · 3 days");
  assert.equal(assessmentOf("sleep", 115).headline, "Sleep below your baseline · 3 days");
  assert.equal(assessmentOf("mood", 115).headline, "Mood below your baseline · 3 days");
  // Inside the general 60–100 bpm range, yet yellow against the personal baseline.
  const hr = simulate(115).hr.bpm;
  assert.ok(hr >= 60 && hr <= 100, `HR ${hr} inside the general range`);
  assert.equal(zoneStatus(115).heart, "drift");
  assert.equal(zoneStatus(115).brain, "drift");
});

test("day 118 (video collapse day): still drifting, 6 days", () => {
  assert.equal(assessmentOf("hr", 118).daysOutOfBand, 6);
  for (const id of SCENARIO_IDS) assert.equal(statusMap(118)[id], "drift");
});

test("no false alarms: only the scenario days and the CO₂ night pockets", () => {
  for (let day = 1; day <= 180; day++) {
    if (day >= 113 && day <= 119) continue;
    for (const a of assessDay(day)) {
      const expected = a.id === "co2" && CO2_PEAK_DAYS[day] ? "drift" : "normal";
      assert.equal(a.status, expected, `day ${day} ${a.id}: ${a.reasons.map((r) => r.text).join("; ")}`);
    }
  }
});

test("published references used by the brief", () => {
  const r180 = simulate(180).radiation.msv;
  assert.ok(r180 > 255 && r180 < 285, `≈1.5 mSv/day → ${r180} mSv at day 180`);
  const s118 = simulate(118).strength.pct;
  assert.ok(Math.abs(s118 - 92) <= 1, `strength ≈ 92% at day 118 (${s118})`);
  assert.deepEqual(formatValue(INDICATOR_BY_ID.bp, 115), { value: "122/77", unit: "mmHg" });
});

test("logged measurements use the same rule (no change to the simulated history)", () => {
  // Day 115: a logged 76 bpm continues the 3-day drift of the scenario.
  assert.equal(assessEntry("hr", 115, { bpm: 76 }).headline, "Resting heart rate above your baseline · 3 days");
  // Back inside the personal band → normal, even in the middle of the scenario.
  assert.equal(assessEntry("hr", 115, { bpm: 62 }).status, "normal");
  // Beyond the published limit → act now.
  assert.equal(assessEntry("hr", 115, { bpm: 105 }).status, "alert");
  // A single day outside the band is not enough to flag drift.
  assert.equal(assessEntry("hr", 113, { bpm: 75 }).status, "normal");
  assert.equal(assessEntry("sleep", 60, { h: 7 }).status, "normal");
  assert.equal(assessEntry("mood", 115, { score: 3 }).status, "drift");
  // The cached simulated assessment is untouched.
  assert.equal(assessmentOf("hr", 115).channels[0].value, simulate(115).hr.bpm);
  assert.equal(assessmentOf("hr", 115).status, "drift");
});

test("measurement routine covers the 10 indicators once", () => {
  assert.deepEqual(ROUTINE.map((r) => r.id).sort(), INDICATORS.map((d) => d.id).sort());
  const glucose = ROUTINE.find((r) => r.id === "glucose")!;
  assert.equal(isDue(glucose, 115), false);
  assert.equal(nextDue(glucose, 115), 119);
  assert.equal(isDue(glucose, 119), true);
  assert.equal(isDue(ROUTINE.find((r) => r.id === "co2")!, 115), false);
  assert.deepEqual(ROUTINE.filter((r) => r.loggable).map((r) => r.id), ["hr", "sleep", "mood"]);
});
