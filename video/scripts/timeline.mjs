// Single source of truth for timing ("audio first"): scene boundaries, narration cues placed from the
// measured takes (video/audio/voice/voice.json), sound cues, music and burned-in captions.
// Used by audio.mjs (mix), render.mjs and the stage (writes video/stage/timeline.js → window.TIMELINE).
//   node scripts/timeline.mjs   -> writes stage/timeline.js and prints the cue sheet
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VIDEO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const FPS = 30;
export const TOTAL = 29.5;

// Approved script (docs/BRIEF-CONSTRUCCION.md §6.1), boundaries adjusted to the measured narration.
const SCENES = {
  alarm: [0, 4.0], // red cabin, alarm, hand to chest, tablet drifts away (effects only)
  rewind: [4.0, 6.0], // tape rewind, Day 118 → Day 115
  alert: [6.0, 13.8], // calm cabin → app scene "alert" (local 0 … 7.8 s)
  brand: [13.8, 18.2], // name card
  montage: [18.2, 25.55], // app scene "montage" (local 0 … 7.35 s)
  credits: [25.55, TOTAL], // next steps, team, official logo strip
};
// Montage shots (global starts): figure + 10 indicators · panel with limit and source ·
// guidance in 4 layers with source · Emergency and first steps.
const SHOTS = [18.2, 20.7, 22.1, 23.6];
// Narration cue starts (s); { after, gap } = right after another line.
const CUES = { v1: 4.3, v2a: 6.55, v2b: 10.0, v3: 14.0, v4a: 18.3, v4b: 20.8, v4c: 22.2, v4d: 23.7, v5a: 25.65, v5b: { after: "v5a", gap: 0.14 } };
// Burned-in captions: none (team decision 2026-11-15: the English narration is enough; the SRT stays as a
// separate optional file). To bring them back, list the line ids, e.g. ["v2a", "v2b", "v4a", "v4b", "v4c", "v4d"].
const CAPTIONED = new Set([]);
// Choreography inside /video-scene/?scene=alert (local seconds; shared with page.tsx in B2).
const ALERT = { dayFrom: 113, dayTo: 115, dayStart: 1.6, dayEnd: 3.4, flagAt: 3.8, panelAt: 5.0 };

const r3 = (x) => Math.round(x * 1000) / 1000;

export function buildTimeline() {
  const voice = JSON.parse(readFileSync(path.join(VIDEO, "audio", "voice", "voice.json"), "utf8"));
  const by = {};
  for (const l of voice.lines) {
    const c = CUES[l.id];
    if (c === undefined) throw new Error(`no cue for ${l.id}`);
    const start = typeof c === "number" ? c : by[c.after].end + c.gap;
    by[l.id] = { id: l.id, text: l.text, file: l.file, start: r3(start), dur: l.dur, end: r3(start + l.dur) };
  }
  const lines = Object.values(by).sort((a, b) => a.start - b.start);
  const problems = [];
  lines.forEach((l, i) => {
    if (i && l.start < lines[i - 1].end + 0.05) problems.push(`${l.id} overlaps ${lines[i - 1].id}`);
  });
  const last = lines[lines.length - 1];
  if (last.end > TOTAL - 0.12) problems.push(`${last.id} ends at ${last.end} s (limit ${r3(TOTAL - 0.12)} s)`);
  const sceneAt = (t) => Object.entries(SCENES).find(([, [a, b]]) => t >= a && t < b)?.[0];
  for (const l of lines) if (sceneAt(l.start) !== sceneAt(Math.min(l.end, TOTAL - 0.001)) && !["v4a", "v5a"].includes(l.id)) problems.push(`${l.id} crosses a scene cut (${l.start}–${l.end})`);

  const A0 = SCENES.alert[0];
  return {
    fps: FPS,
    total: TOTAL,
    frames: Math.round(TOTAL * FPS),
    scenes: SCENES,
    shots: SHOTS,
    voice: lines,
    captions: lines.filter((l) => CAPTIONED.has(l.id)).map((l) => ({ id: l.id, text: l.text, start: l.start, end: r3(l.end + 0.2) })),
    app: {
      alert: { start: A0, end: SCENES.alert[1], ...ALERT },
      montage: { start: SCENES.montage[0], end: SCENES.montage[1], shots: SHOTS.map((s) => r3(s - SCENES.montage[0])) },
    },
    sfx: {
      alarm: { start: 0, stopAt: 3.95, period: 0.5, hi: 960, lo: 720 },
      heartFast: { start: 0.3, end: 3.9, period: 0.62 },
      hum: [0, A0 + 1.8],
      rewind: [SCENES.rewind[0], SCENES.rewind[1] - 0.08],
      clunk: SCENES.rewind[1] - 0.08,
      ping: r3(A0 + ALERT.flagAt),
      riser: [r3(SCENES.brand[0] - 0.65), SCENES.brand[0]],
      hit: SCENES.brand[0],
      whoosh: [SCENES.montage[0], SCENES.credits[0]],
    },
    music: {
      // MIDI notes; D minor → F major. Chord changes land on the cuts and on the montage shots.
      chords: [
        [A0, r3(A0 + ALERT.flagAt), [38, 45, 53, 60, 64]], // Dm9
        [r3(A0 + ALERT.flagAt), SCENES.alert[1], [34, 41, 50, 57, 60]], // Bbmaj7(add9)
        [SCENES.brand[0], SCENES.brand[1], [41, 48, 57, 60, 67]], // Fadd9
        [SHOTS[0], SHOTS[1], [38, 50, 53, 57, 62]], // Dm
        [SHOTS[1], SHOTS[2], [34, 46, 50, 53, 58]], // Bb
        [SHOTS[2], SHOTS[3], [41, 48, 53, 57, 60]], // F
        [SHOTS[3], SCENES.montage[1], [36, 48, 52, 55, 60]], // C
        [SCENES.credits[0], r3(SCENES.credits[0] + 1.2), [41, 48, 55, 60, 65]], // Fsus2
        [r3(SCENES.credits[0] + 1.2), TOTAL, [41, 48, 57, 60, 65]], // F
      ],
      pulseCalm: { start: 6.5, end: r3(SCENES.alert[1] - 0.2), period: 1.0 },
      pulseMontage: { start: SCENES.montage[0], end: SCENES.montage[1], period: 0.5 },
      arp: { start: SCENES.montage[0], end: SCENES.montage[1], step: 0.25 },
      arpSlow: { start: SCENES.credits[0], end: 28.4, step: 0.5 },
      fadeOut: [r3(TOTAL - 0.45), TOTAL],
    },
    problems,
  };
}

export function writeTimeline() {
  const tl = buildTimeline();
  writeFileSync(path.join(VIDEO, "stage", "timeline.js"), `// GENERATED by video/scripts/timeline.mjs — do not edit by hand.\nwindow.TIMELINE = ${JSON.stringify(tl)};\n`);
  return tl;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const tl = writeTimeline();
  for (const l of tl.voice) console.log(`${l.id.padEnd(4)} ${l.start.toFixed(2).padStart(6)} → ${l.end.toFixed(2).padStart(6)}  ${l.text}`);
  console.log(tl.problems.length ? "PROBLEMS:\n- " + tl.problems.join("\n- ") : "timeline OK");
}
