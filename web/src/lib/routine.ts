// Measurement routine of the prototype: WHEN each indicator is measured, so the
// app can remind the astronaut (the challenge suggests prompting measurements
// "from time to time as a part of the mission routine"). The schedule is an
// example for this prototype (proposed with AI assistance, pending team review),
// not a clinical protocol. HOW to measure comes from guide.ts, with its sources.
import type { IndicatorId } from "./model.ts";

export type Slot = "morning" | "day" | "evening" | "weekly" | "auto";

export interface RoutineItem {
  id: IndicatorId;
  slot: Slot;
  /** Short English "when" shown in the reminder list. */
  when: string;
  /** Can be logged in the demo's "Log today's measurements" form. */
  loggable?: boolean;
}

export const SLOT_LABEL: Record<Slot, string> = {
  morning: "On waking",
  day: "Through the day",
  evening: "Before sleep",
  weekly: "Weekly",
  auto: "Automatic",
};

/** Weekly items are due on mission days that are multiples of 7. */
export const WEEKLY_EVERY = 7;

export const ROUTINE: RoutineItem[] = [
  { id: "hr", slot: "morning", when: "At rest, before getting up", loggable: true },
  { id: "bp", slot: "morning", when: "At rest, same time as your baseline" },
  { id: "temp", slot: "morning", when: "Same time as your baseline" },
  { id: "sleep", slot: "morning", when: "Wrist actigraphy + short questionnaire", loggable: true },
  { id: "nutrition", slot: "day", when: "Food log after each meal; body mass weekly" },
  { id: "mood", slot: "evening", when: "Rate 1 to 5", loggable: true },
  { id: "glucose", slot: "weekly", when: "Fasting, before breakfast" },
  { id: "strength", slot: "weekly", when: "Strength and fitness self-check" },
  { id: "radiation", slot: "auto", when: "Personal dosimeter" },
  { id: "co2", slot: "auto", when: "Personal CO₂ monitor" },
];

/** Does the astronaut have to take this measurement on `day`? (sensors: no) */
export function isDue(item: RoutineItem, day: number): boolean {
  if (item.slot === "auto") return false;
  if (item.slot === "weekly") return day % WEEKLY_EVERY === 0;
  return true;
}

/** Next mission day (≥ `day`) on which the item is due. */
export function nextDue(item: RoutineItem, day: number): number {
  if (item.slot !== "weekly") return day;
  const r = day % WEEKLY_EVERY;
  return r === 0 ? day : day + (WEEKLY_EVERY - r);
}
