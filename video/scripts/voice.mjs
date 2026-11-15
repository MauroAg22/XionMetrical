// Narration with Piper TTS (local, offline; voice en_US-joe-medium, CC0 dataset).
// AI-GENERATED AUDIO: declared in docs/registro-video.md, the README and the MP4 metadata.
//
//   node scripts/voice.mjs            -> synthesize every candidate into video/tmp/voice/ and select
//   node scripts/voice.mjs --select   -> only re-select (trim + copy) the chosen takes, no new synthesis
//
// Piper adds random noise at inference, so takes differ slightly between runs: the chosen, trimmed
// takes are kept in video/audio/voice/ (in git) and the timeline is built from their measured
// durations ("audio first").
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readWav, writeWav, speechBounds } from "./lib/wav.mjs";

const VIDEO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PY = path.join(VIDEO, "tools", "piper-venv", "Scripts", "python.exe");
const MODEL = path.join(VIDEO, "tools", "voices", "en_US-joe-medium.onnx");
const CAND = path.join(VIDEO, "tmp", "voice");
const SAMPLES = path.join(VIDEO, "tmp", "voice-samples");
const OUT = path.join(VIDEO, "audio", "voice");

// `text` = on-screen / SRT text. `tts` = text sent to the engine (phonetic respelling of the name
// only: "XionMetrical" is said "ZY-on Metrical"). Approved script: docs/BRIEF-CONSTRUCCION.md §6.1.
export const LINES = [
  { id: "v1", text: "What if he'd seen it coming?" },
  { id: "v2a", text: "Days earlier, his data was drifting from his baseline." },
  { id: "v2b", text: "The app flagged it, without waiting for Earth." },
  { id: "v3", text: "XionMetrical. Precision bio-telemetry for deep space missions.", tts: "{NAME} Metrical. Precision bio-telemetry for deep space missions." },
  { id: "v4a", text: "Ten indicators. Five hazards." },
  { id: "v4b", text: "Your baseline." },
  { id: "v4c", text: "Sourced guidance." },
  { id: "v4d", text: "And an emergency guide." },
  { id: "v5a", text: "Next: wearables and an Earth link." },
  { id: "v5b", text: "Team Space Mercedes." },
];
export const NAME_VARIANTS = { A: "Zy-on", B: "Zion", C: "Zai-on" };
const SCALES = [1.0, 0.92]; // Piper length_scale (1.0 = model pace; 0.92 = 8 % faster)

// ---- Choice (edit, then run with --select). The team picks the name pronunciation (A/B/C). ----
// 0.92 makes the approved script fit in 29.5 s with breathing room.
const SELECT = { name: "A", scale: 0.92, perLine: {} }; // perLine: { v5a: 1.0, ... }

const PAD_BEFORE = 0.04; // s kept before the first voiced window
const PAD_AFTER = 0.12; // s kept after the last voiced window (natural decay)

const candName = (id, variant, scale) => `${id}${variant ? "-" + variant : ""}-s${scale.toFixed(2)}.wav`;
const ttsOf = (line, v) => (line.tts ? line.tts.replace("{NAME}", NAME_VARIANTS[v]) : line.text);

function generate() {
  mkdirSync(CAND, { recursive: true });
  const manifest = [];
  for (const line of LINES) {
    for (const v of line.tts ? Object.keys(NAME_VARIANTS) : [null]) {
      for (const scale of SCALES) {
        const file = path.join(CAND, candName(line.id, v, scale));
        try {
          execFileSync(PY, ["-I", "-m", "piper", "-m", MODEL, "-f", file, "--length-scale", String(scale)], { input: ttsOf(line, v) + "\n", stdio: ["pipe", "ignore", "pipe"] });
        } catch (e) {
          throw new Error(`piper failed for ${line.id}: ${e.stderr?.toString() ?? e}`);
        }
        const w = readWav(file);
        const b = speechBounds(w.channels[0], w.sampleRate);
        manifest.push({ id: line.id, variant: v, scale, tts: ttsOf(line, v), file: path.basename(file), total: +b.total.toFixed(3), speech: +(b.end - b.start).toFixed(3) });
      }
    }
  }
  writeFileSync(path.join(CAND, "candidates.json"), JSON.stringify(manifest, null, 2));
  return manifest;
}

function select() {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(SAMPLES, { recursive: true });
  const chosen = [];
  const preview = [];
  let rate = 22050;
  for (const line of LINES) {
    const v = line.tts ? SELECT.name : null;
    const scale = SELECT.perLine[line.id] ?? SELECT.scale;
    const src = path.join(CAND, candName(line.id, v, scale));
    if (!existsSync(src)) throw new Error(`missing candidate ${src}: run without --select first`);
    const w = readWav(src);
    rate = w.sampleRate;
    const x = w.channels[0];
    const b = speechBounds(x, w.sampleRate);
    const s = Math.max(0, Math.floor((b.start - PAD_BEFORE) * w.sampleRate));
    const e = Math.min(x.length, Math.ceil((b.end + PAD_AFTER) * w.sampleRate));
    const y = x.slice(s, e);
    const fadeN = Math.round(0.01 * w.sampleRate);
    for (let i = 0; i < fadeN; i++) {
      y[i] *= i / fadeN;
      y[y.length - 1 - i] *= i / fadeN;
    }
    writeWav(path.join(OUT, `${line.id}.wav`), [y], w.sampleRate, 16);
    chosen.push({ id: line.id, text: line.text, tts: ttsOf(line, v), variant: v, lengthScale: scale, file: `${line.id}.wav`, dur: +(y.length / w.sampleRate).toFixed(3) });
    preview.push(y, new Float32Array(Math.round(0.45 * w.sampleRate)));
  }
  writeFileSync(path.join(OUT, "voice.json"), JSON.stringify({ engine: "Piper TTS (piper-tts 1.8.0), voice en_US-joe-medium", aiGenerated: true, lines: chosen }, null, 2) + "\n");
  // Listening aids for the team (not in git): whole narration + the three name pronunciations.
  const all = new Float32Array(preview.reduce((n, a) => n + a.length, 0));
  let o = 0;
  for (const a of preview) {
    all.set(a, o);
    o += a.length;
  }
  writeWav(path.join(SAMPLES, "narration-preview.wav"), [all], rate, 16);
  for (const k of Object.keys(NAME_VARIANTS)) {
    const src = path.join(CAND, candName("v3", k, SELECT.scale));
    if (existsSync(src)) writeFileSync(path.join(SAMPLES, `name-${k}-${NAME_VARIANTS[k].replace(/\W+/g, "")}.wav`), readFileSync(src));
  }
  return chosen;
}

if (!process.argv.includes("--select")) {
  const m = generate();
  console.log(m.map((c) => `${c.file.padEnd(22)} total ${c.total.toFixed(2)} s  speech ${c.speech.toFixed(2)} s`).join("\n"));
}
const sel = select();
console.log("selected:", sel.map((l) => `${l.id}=${l.dur}s`).join("  "), " sum", sel.reduce((n, l) => n + l.dur, 0).toFixed(2), "s");
