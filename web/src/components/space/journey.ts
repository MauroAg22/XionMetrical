// Scroll-driven mission clock for the landing page ("the page is the mission").
// Each section anchor is a waypoint with a mission day: the top of the page is
// launch (day 1), the demo section is day 115 (the same day the demo preview
// shows), the "Future plan" section is arrival at Mars (day 180) and the end of
// the page is later in the surface stay. Shared by the 3D scene (camera) and
// the header HUD (day + one-way signal delay). Everything here is simulated.
import { PHASES } from "@/lib/model";

export interface Waypoint {
  /** Section id; null = top of the page, "" = end of the page. */
  anchor: string | null;
  day: number;
}

export const ARRIVAL_DAY = PHASES[0].end; // 180
export const FINAL_DAY = 409; // one-way signal delay ≈ 20 min (see signalDelayMinutes)

export const WAYPOINTS: Waypoint[] = [
  { anchor: null, day: 1 },
  { anchor: "problem", day: 20 },
  { anchor: "how", day: 45 },
  { anchor: "inside", day: 75 },
  { anchor: "demo", day: 115 },
  { anchor: "references", day: 140 },
  { anchor: "ai", day: 160 },
  { anchor: "future", day: ARRIVAL_DAY },
  { anchor: "team", day: 300 },
  { anchor: "", day: FINAL_DAY },
];

// ---- One-way signal delay (simulated) -------------------------------------------------------------
// Circular, coplanar orbits: Earth 1 AU / 365.25 d, Mars 1.524 AU / 687 d. On the way out the ship
// sweeps 140° around the Sun while its distance grows smoothly from 1 to 1.524 AU; after arrival it
// moves with Mars. Result: ≈ 5 min on day 115, ≈ 8 min on arrival and ≈ 20 min on day 409, when
// Mars nears conjunction — consistent with "up to 20 minutes" in the page copy.
const LIGHT_MIN_PER_AU = 8.317;
const R_MARS = 1.524;
const TRANSFER = (140 * Math.PI) / 180;
const W_EARTH = (2 * Math.PI) / 365.25;
const W_MARS = (2 * Math.PI) / 687;
const MARS_AT_0 = TRANSFER - W_MARS * ARRIVAL_DAY;

function shipXY(day: number): [number, number] {
  if (day <= ARRIVAL_DAY) {
    const t = Math.max(0, day) / ARRIVAL_DAY;
    const r = 1 + ((R_MARS - 1) * (1 - Math.cos(Math.PI * t))) / 2;
    const a = TRANSFER * t;
    return [r * Math.cos(a), r * Math.sin(a)];
  }
  const a = MARS_AT_0 + W_MARS * day;
  return [R_MARS * Math.cos(a), R_MARS * Math.sin(a)];
}

export function signalDelayMinutes(day: number): number {
  const [sx, sy] = shipXY(day);
  const e = W_EARTH * day;
  return Math.hypot(sx - Math.cos(e), sy - Math.sin(e)) * LIGHT_MIN_PER_AU;
}

export function formatDelay(minutes: number): string {
  const s = Math.round(minutes * 60);
  if (s < 60) return `${s} s`;
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`;
}

export function phaseName(day: number): string {
  return (PHASES.find((p) => day <= p.end) ?? PHASES[PHASES.length - 1]).name;
}

/** 0 at launch, 1 on arrival at Mars. */
export function transitProgress(day: number): number {
  return Math.min(1, Math.max(0, (day - 1) / (ARRIVAL_DAY - 1)));
}

// ---- Scroll → day store -------------------------------------------------------------------------
type Listener = () => void;
const listeners = new Set<Listener>();
let marks: { y: number; day: number }[] = [];
let day = 1;
let forced: number | null = null;
let raf = 0;
let ro: ResizeObserver | null = null;

function measure() {
  const vh = window.innerHeight;
  const max = Math.max(0, document.documentElement.scrollHeight - vh);
  const out: { y: number; day: number }[] = [];
  for (const w of WAYPOINTS) {
    let y: number;
    if (w.anchor === null) y = 0;
    else if (w.anchor === "") y = max;
    else {
      const el = document.getElementById(w.anchor);
      if (!el) continue;
      y = Math.min(max, Math.max(0, el.getBoundingClientRect().top + window.scrollY - vh * 0.35));
    }
    // Keep marks strictly increasing; at the very end the last (largest) day wins.
    while (out.length && out[out.length - 1].y >= y) {
      if (out.length === 1) break;
      out.pop();
    }
    if (!out.length || y > out[out.length - 1].y) out.push({ y, day: w.day });
  }
  marks = out;
}

function dayAt(y: number): number {
  if (!marks.length) return 1;
  if (y <= marks[0].y) return marks[0].day;
  for (let i = 1; i < marks.length; i++) {
    const a = marks[i - 1];
    const b = marks[i];
    if (y <= b.y) return a.day + ((y - a.y) / (b.y - a.y)) * (b.day - a.day);
  }
  return marks[marks.length - 1].day;
}

function update() {
  raf = 0;
  const next = forced ?? dayAt(window.scrollY);
  if (next !== day) {
    day = next;
    listeners.forEach((l) => l());
  }
}

function schedule() {
  if (!raf) raf = requestAnimationFrame(update);
}

function remeasure() {
  measure();
  schedule();
}

function start() {
  const q = new URLSearchParams(window.location.search).get("day");
  const n = q ? Number(q) : NaN;
  forced = Number.isFinite(n) ? Math.min(FINAL_DAY, Math.max(1, n)) : null;
  measure();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", remeasure);
  ro = new ResizeObserver(remeasure);
  ro.observe(document.body);
  day = forced ?? dayAt(window.scrollY);
}

function stop() {
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", remeasure);
  ro?.disconnect();
  ro = null;
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

export const journey = {
  /** Mission day for the current scroll position (not smoothed). */
  get day(): number {
    return day;
  },
  subscribe(fn: Listener): () => void {
    if (!listeners.size) start();
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
      if (!listeners.size) stop();
    };
  },
};
