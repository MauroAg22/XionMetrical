// Sound design + final mix for the XionMetrical video.
// Every effect and the music bed are SYNTHESIZED BY CODE in this file (no samples, no external or
// copyrighted music). The narration (Piper TTS, AI-generated voice) is mixed on top.
// Mix rules (brief §6.3): clear voice; music bed ≈ 20 dB below the voice (measured under the voice,
// after ducking); no clipping (look-ahead limiter at −1 dBFS).
// Output (not in git): video/tmp/audio/mix.wav (48 kHz stereo float) + stems + one WAV per effect.
//   node scripts/audio.mjs
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeWav } from "./lib/wav.mjs";
import { findTool } from "./lib/tools.mjs";
import { buildTimeline } from "./timeline.mjs";

const VIDEO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const AUDIO_DIR = path.join(VIDEO, "tmp", "audio");
const SR = 48000;
const TAU = Math.PI * 2;
const VOICE_RMS_DB = -18; // narration level (RMS over the spoken spans, after compression) ≈ −15 LUFS mix
const BED_BELOW_VOICE_DB = 20; // music bed under the voice
const CEILING_DB = -1;

const db = (x) => Math.pow(10, x / 20);
const toDb = (x) => 20 * Math.log10(Math.max(x, 1e-9));
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const smooth = (u) => {
  u = clamp(u);
  return u * u * (3 - 2 * u);
};
const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const pan = (p) => {
  const a = ((clamp(p, -1, 1) + 1) * Math.PI) / 4;
  return [Math.cos(a) * Math.SQRT2, Math.sin(a) * Math.SQRT2];
};
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// RBJ biquad (lp / hp / bp with 0 dB peak).
class Biquad {
  constructor(type, f, q = 0.707) {
    this.type = type;
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
    this.set(f, q);
  }
  set(f, q = 0.707) {
    const w = (TAU * Math.min(Math.max(f, 10), SR * 0.45)) / SR;
    const cs = Math.cos(w);
    const al = Math.sin(w) / (2 * q);
    let b0, b1, b2;
    if (this.type === "lp") [b0, b1, b2] = [(1 - cs) / 2, 1 - cs, (1 - cs) / 2];
    else if (this.type === "hp") [b0, b1, b2] = [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2];
    else [b0, b1, b2] = [al, 0, -al];
    const a0 = 1 + al;
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * cs) / a0;
    this.a2 = (1 - al) / a0;
  }
  p(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

function blepSaw(ph, dt) {
  let v = 2 * ph - 1;
  if (ph < dt) {
    const x = ph / dt;
    v -= x + x - x * x - 1;
  } else if (ph > 1 - dt) {
    const x = (ph - 1) / dt;
    v -= x * x + x + x + 1;
  }
  return v;
}

// ---------- buffers ----------
const buf = (sec) => {
  const n = Math.max(1, Math.ceil(sec * SR));
  return [new Float32Array(n), new Float32Array(n)];
};
const add = (b, i, l, r) => {
  if (i >= 0 && i < b[0].length) {
    b[0][i] += l;
    b[1][i] += r;
  }
};
function mixInto(dst, src, t0, gain = 1, p = 0) {
  const [gl, gr] = pan(p);
  const o = Math.round(t0 * SR);
  for (let i = 0; i < src[0].length; i++) {
    const j = o + i;
    if (j < 0 || j >= dst[0].length) continue;
    dst[0][j] += src[0][i] * gain * gl;
    dst[1][j] += src[1][i] * gain * gr;
  }
}
function peakOf(b) {
  let p = 0;
  for (const c of b) for (let i = 0; i < c.length; i++) p = Math.max(p, Math.abs(c[i]));
  return p;
}
function scale(b, g) {
  for (const c of b) for (let i = 0; i < c.length; i++) c[i] *= g;
  return b;
}
const normalize = (b, peakDb) => scale(b, db(peakDb) / (peakOf(b) || 1));
function rmsSpans(b, spans) {
  let s = 0;
  let n = 0;
  for (const { start, end } of spans) {
    for (let i = Math.round(start * SR); i < Math.min(b[0].length, Math.round(end * SR)); i++) {
      const m = (b[0][i] + b[1][i]) / 2;
      s += m * m;
      n++;
    }
  }
  return Math.sqrt(s / Math.max(1, n)) || 1e-9;
}

// ---------- effects (each returns its own buffer; levels are set when placed) ----------
function fxAlarm(a) {
  const b = buf(a.stopAt - a.start + 0.4);
  const lp = new Biquad("lp", 3400, 0.7);
  const half = a.period / 2;
  let ph = 0;
  for (let i = 0; i < b[0].length; i++) {
    const t = i / SR;
    const ts = a.start + t;
    const k = Math.floor(t / half);
    const w = t - k * half;
    let pm = 1;
    let g = Math.min(1, t / 0.015) * (0.3 + 0.7 * Math.min(1, w / 0.012, (half - w) / 0.012));
    if (ts > a.stopAt) {
      // tape stop: the alarm pitch dives as the rewind grabs the tape
      const u = (ts - a.stopAt) / 0.35;
      pm = Math.max(0.03, 1 - u);
      g *= Math.max(0, 1 - u * u);
    }
    ph += (TAU * (k % 2 === 0 ? a.hi : a.lo) * pm) / SR;
    if (ph > TAU) ph -= TAU;
    const v = lp.p(Math.sin(ph) + 0.32 * Math.sin(3 * ph) + 0.16 * Math.sin(5 * ph) + 0.07 * Math.sin(7 * ph)) * g;
    b[0][i] = v;
    b[1][i] = v;
  }
  return b;
}

// Low thump with a fast pitch drop (heartbeat, kick, clunk). Harmonics keep it audible on laptops.
function fxThump(f0, f1, tau, harm = 0.45) {
  const b = buf(tau * 8);
  let ph = 0;
  for (let i = 0; i < b[0].length; i++) {
    const t = i / SR;
    ph += (TAU * (f1 + (f0 - f1) * Math.exp(-t / 0.035))) / SR;
    const env = Math.min(1, t / 0.003) * Math.exp(-t / tau);
    const v = (Math.sin(ph) + harm * Math.sin(2 * ph) + harm * 0.4 * Math.sin(3 * ph)) * env;
    b[0][i] = v;
    b[1][i] = v;
  }
  return b;
}

function fxHeartbeat(h) {
  const b = buf(h.end - h.start + 0.6);
  const lub = fxThump(68, 44, 0.07);
  const dub = fxThump(80, 52, 0.055);
  for (let t = 0; t < h.end - h.start; t += h.period) {
    mixInto(b, lub, t, 1);
    mixInto(b, dub, t + 0.16, 0.7);
  }
  return b;
}

function fxHum(dur, rng) {
  const b = buf(dur);
  const lp = new Biquad("lp", 170, 0.7);
  const bp = new Biquad("bp", 950, 2.5);
  let br = 0;
  let p1 = 0;
  let p2 = 0;
  for (let i = 0; i < b[0].length; i++) {
    const t = i / SR;
    const w = rng() * 2 - 1;
    br = 0.985 * br + 0.06 * w;
    p1 += (TAU * 118) / SR;
    p2 += (TAU * 236.4) / SR;
    const env = Math.min(1, t / 0.05) * Math.min(1, (dur - t) / 0.8);
    const v = (lp.p(br) + bp.p(w) * 0.25 + 0.05 * Math.sin(p1) + 0.025 * Math.sin(p2)) * env;
    b[0][i] = v;
    b[1][i] = v * 0.96;
  }
  return b;
}

// Tape rewind: chattering reversed "grains" + upward band-passed whoosh + warbling squeal.
function fxRewind(dur, rng) {
  const b = buf(dur);
  for (let t = 0.02; t < dur - 0.08; t += 0.028 + rng() * 0.042) {
    const prog = t / dur;
    const len = 0.025 + rng() * 0.05;
    const f0 = (380 + rng() * 1700) * (0.75 + 0.7 * prog);
    const f1 = f0 * (1.35 + rng() * 0.9);
    const [gl, gr] = pan(rng() * 1.2 - 0.6);
    const amp = 0.45 + rng() * 0.55;
    const o = Math.round(t * SR);
    const n = Math.round(len * SR);
    let ph = 0;
    for (let j = 0; j < n; j++) {
      const u = j / n;
      ph += (TAU * f0 * Math.pow(f1 / f0, u)) / SR;
      const env = Math.pow(u, 1.5) * Math.min(1, (1 - u) / 0.1);
      const v = (Math.sin(ph) + 0.45 * Math.sin(2 * ph + 0.4) + 0.2 * (rng() * 2 - 1)) * env * amp;
      add(b, o + j, v * gl, v * gr);
    }
  }
  const bl = new Biquad("bp", 400, 1.1);
  const brq = new Biquad("bp", 400, 1.1);
  const lp = new Biquad("lp", 2200, 0.7);
  let ph = 0;
  for (let i = 0; i < b[0].length; i++) {
    const t = i / SR;
    const u = t / dur;
    if (i % 32 === 0) {
      const f = 350 * Math.pow(9, u);
      bl.set(f, 1.1);
      brq.set(f, 1.1);
    }
    const env = Math.min(1, t / 0.07) * Math.min(1, (dur - t) / 0.06);
    ph += (240 * Math.pow(3.4, u) * (1 + 0.03 * Math.sin(TAU * 13 * t))) / SR;
    ph -= Math.floor(ph);
    const sq = lp.p(2 * ph - 1) * 0.16;
    add(b, i, (bl.p(rng() * 2 - 1) * 2.2 + sq) * env, (brq.p(rng() * 2 - 1) * 2.2 + sq) * env);
  }
  return b;
}

function fxClunk(rng) {
  const b = fxThump(95, 52, 0.05, 0.6);
  const hp = new Biquad("hp", 1800, 0.7);
  const n = Math.round(0.006 * SR);
  for (let i = 0; i < n; i++) {
    const v = hp.p(rng() * 2 - 1) * (1 - i / n) * 0.6;
    b[0][i] += v;
    b[1][i] += v;
  }
  return b;
}

function fxBell(f, tau = 0.6) {
  const b = buf(tau * 6);
  const parts = [[1, 1, tau], [2.0, 0.28, tau * 0.6], [2.76, 0.16, tau * 0.4], [5.4, 0.05, tau * 0.2]];
  const ph = parts.map(() => 0);
  for (let i = 0; i < b[0].length; i++) {
    const t = i / SR;
    let v = 0;
    parts.forEach(([m, a, d], k) => {
      ph[k] += (TAU * f * m) / SR;
      v += Math.sin(ph[k]) * a * Math.exp(-t / d);
    });
    v *= Math.min(1, t / 0.002);
    b[0][i] = v;
    b[1][i] = v;
  }
  return b;
}

function fxPing() {
  const b = buf(4.4);
  mixInto(b, fxBell(1318.5), 0, 1, -0.25); // E6
  mixInto(b, fxBell(1975.5, 0.7), 0.09, 0.85, 0.25); // B6
  return b;
}

function fxRiser(dur, rng) {
  const b = buf(dur + 0.02);
  const bl = new Biquad("bp", 300, 1.3);
  const br = new Biquad("bp", 300, 1.3);
  for (let i = 0; i < b[0].length; i++) {
    const t = i / SR;
    const u = Math.min(1, t / dur);
    if (i % 32 === 0) {
      const f = 250 * Math.pow(22, u);
      bl.set(f, 1.3);
      br.set(f, 1.3);
    }
    const env = Math.pow(u, 2.2) * Math.min(1, (dur + 0.02 - t) / 0.02);
    b[0][i] = bl.p(rng() * 2 - 1) * env;
    b[1][i] = br.p(rng() * 2 - 1) * env;
  }
  return b;
}

// Brand hit: sub boom + airy shimmer + soft F-major chord stab.
function fxHit(rng) {
  const b = buf(3.2);
  let ph = 0;
  for (let i = 0; i < b[0].length; i++) {
    const t = i / SR;
    ph += (TAU * (36 + 59 * Math.exp(-t / 0.12))) / SR;
    const env = Math.min(1, t / 0.004) * Math.exp(-t / 0.55);
    const v = (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph)) * env;
    b[0][i] += v;
    b[1][i] += v;
  }
  const hl = new Biquad("hp", 5000, 0.7);
  const hr = new Biquad("hp", 5000, 0.7);
  for (let i = 0; i < 1.6 * SR; i++) {
    const env = Math.exp(-i / SR / 0.32) * 0.5;
    b[0][i] += hl.p(rng() * 2 - 1) * env;
    b[1][i] += hr.p(rng() * 2 - 1) * env;
  }
  [41, 48, 57, 60, 67].forEach((m, k) => {
    const f = midiHz(m + 12);
    const [gl, gr] = pan((k - 2) * 0.3);
    let p = 0;
    for (let i = 0; i < b[0].length; i++) {
      const t = i / SR;
      p += (TAU * f) / SR;
      const v = (Math.sin(p) + 0.12 * Math.sin(3 * p)) * Math.min(1, t / 0.006) * Math.exp(-t / 1.3) * 0.09;
      b[0][i] += v * gl;
      b[1][i] += v * gr;
    }
  });
  return b;
}

function fxWhoosh(rng, dur = 0.55) {
  const b = buf(dur);
  const bl = new Biquad("bp", 2000, 1.2);
  const br = new Biquad("bp", 2000, 1.2);
  for (let i = 0; i < b[0].length; i++) {
    const u = i / b[0].length;
    if (i % 32 === 0) {
      const f = 2600 * Math.pow(0.22, u);
      bl.set(f, 1.2);
      br.set(f, 1.2);
    }
    const env = Math.sin(Math.PI * u) ** 2;
    const [gl, gr] = pan(-0.7 + 1.4 * u);
    b[0][i] = bl.p(rng() * 2 - 1) * env * gl;
    b[1][i] = br.p(rng() * 2 - 1) * env * gr;
  }
  return b;
}

function fxTick(rng) {
  const b = buf(0.06);
  const h = new Biquad("hp", 7000, 0.7);
  for (let i = 0; i < b[0].length; i++) {
    const v = h.p(rng() * 2 - 1) * Math.exp(-i / SR / 0.012);
    b[0][i] = v;
    b[1][i] = v;
  }
  return b;
}

// ---------- music bed ----------
function pad(dst, t0, t1, notes, rng, { attack = 0.6, release = 0.9, cutoff = 1050 } = {}) {
  const i0 = Math.round(t0 * SR);
  const i1 = Math.min(dst[0].length, Math.round((t1 + release) * SR));
  const lpL = new Biquad("lp", cutoff, 0.65);
  const lpR = new Biquad("lp", cutoff, 0.65);
  const osc = [];
  for (const m of notes) {
    for (const d of [-6, 6]) {
      const [gl, gr] = pan(d < 0 ? -0.45 : 0.45);
      osc.push({ ph: rng(), dt: (midiHz(m) * Math.pow(2, d / 1200)) / SR, gl, gr, w: m < 45 ? 0.6 : 1 });
    }
  }
  const sub = midiHz(notes[0]);
  let sp = 0;
  for (let i = i0; i < i1; i++) {
    const t = i / SR;
    const env = Math.min(1, (t - t0) / attack) * (t > t1 ? Math.max(0, 1 - (t - t1) / release) : 1);
    if ((i - i0) % 64 === 0) {
      const c = cutoff * (1 + 0.22 * Math.sin(TAU * 0.11 * t));
      lpL.set(c, 0.65);
      lpR.set(c, 0.65);
    }
    let l = 0;
    let r = 0;
    for (const o of osc) {
      o.ph += o.dt;
      if (o.ph >= 1) o.ph -= 1;
      const v = blepSaw(o.ph, o.dt) * o.w;
      l += v * o.gl;
      r += v * o.gr;
    }
    sp += (TAU * sub) / SR;
    const s = Math.sin(sp) * 0.9;
    const e = env * env * 0.05;
    add(dst, i, (lpL.p(l) + s) * e, (lpR.p(r) + s) * e);
  }
}

function pluck(dst, t, m, amp, p) {
  const f = midiHz(m);
  const n = Math.round(0.9 * SR);
  const o = Math.round(t * SR);
  const [gl, gr] = pan(p);
  const lp = new Biquad("lp", 2600, 0.7);
  let ph = 0;
  for (let j = 0; j < n; j++) {
    const tt = j / SR;
    ph += (TAU * f) / SR;
    const env = Math.min(1, tt / 0.003) * Math.exp(-tt / 0.2);
    const v = lp.p(Math.sin(ph) + 0.25 * Math.sin(2 * ph) + 0.1 * Math.sin(3 * ph)) * env * amp;
    add(dst, o + j, v * gl, v * gr);
  }
}

function musicBed(tl, rng, N) {
  const m = [new Float32Array(N), new Float32Array(N)];
  const M = tl.music;
  M.chords.forEach(([a, b, notes], k) => pad(m, a, b, notes, rng, { cutoff: k >= 3 && k <= 6 ? 1500 : 1050 }));
  // "pulso grave": calm double pulse under the alert scene, steady beat under the montage
  const lub = fxThump(62, 42, 0.08, 0.5);
  const dub = fxThump(70, 48, 0.06, 0.5);
  for (let t = M.pulseCalm.start; t < M.pulseCalm.end; t += M.pulseCalm.period) {
    mixInto(m, lub, t, 0.5);
    mixInto(m, dub, t + 0.17, 0.35);
  }
  const kick = fxThump(115, 46, 0.09, 0.55);
  const tick = fxTick(rng);
  for (let t = M.pulseMontage.start, k = 0; t < M.pulseMontage.end - 0.05; t += M.pulseMontage.period, k++) {
    mixInto(m, kick, t, 0.45);
    mixInto(m, tick, t + M.pulseMontage.period / 2, 0.2, k % 2 ? 0.3 : -0.3);
  }
  const chordAt = (t) => M.chords.find(([a, b]) => t >= a && t < b)?.[2];
  const pattern = [1, 2, 3, 4, 3, 2];
  for (const A of [M.arp, M.arpSlow]) {
    for (let t = A.start, k = 0; t < A.end - 0.02; t += A.step, k++) {
      const ch = chordAt(t + 0.01);
      if (ch) pluck(m, t, ch[pattern[k % pattern.length] % ch.length] + 12, k % 4 === 0 ? 0.16 : 0.11, k % 2 ? 0.35 : -0.35);
    }
  }
  return m;
}

// ---------- dynamics ----------
function duckEnv(N, cues, depthDb, pre = 0.12, post = 0.28) {
  const g = new Float32Array(N).fill(1);
  const d = db(depthDb);
  for (const c of cues) {
    const a = c.start - pre;
    const b = c.end + post;
    for (let i = Math.max(0, Math.floor(a * SR)); i < Math.min(N, Math.ceil(b * SR)); i++) {
      const t = i / SR;
      const k = t < c.start ? (t - a) / pre : t > c.end ? 1 - (t - c.end) / post : 1;
      g[i] = Math.min(g[i], 1 - (1 - d) * smooth(k));
    }
  }
  return g;
}

// Gentle voice compressor (peak detector with 3 ms look-ahead, 1 ms attack / 90 ms release): lowers the
// narration's crest factor so it sits at a clear level without driving the master limiter.
function compress(b, thrDb, ratio, attack = 0.001, release = 0.09, look = 0.003) {
  const thr = db(thrDb);
  const aA = Math.exp(-1 / (attack * SR));
  const aR = Math.exp(-1 / (release * SR));
  const la = Math.round(look * SR);
  const n = b[0].length;
  const g = new Float32Array(n);
  let env = 0;
  for (let i = 0; i < n; i++) {
    const j = Math.min(n - 1, i + la);
    const x = Math.max(Math.abs(b[0][j]), Math.abs(b[1][j]));
    env = x > env ? x + (env - x) * aA : x + (env - x) * aR;
    g[i] = env > thr ? Math.pow(env / thr, 1 / ratio - 1) : 1;
  }
  for (let i = 0; i < n; i++) {
    b[0][i] *= g[i];
    b[1][i] *= g[i];
  }
}

// Look-ahead peak limiter (5 ms) so nothing clips; stays idle when levels are already below the ceiling.
function limiter(L, R, ceiling) {
  const n = L.length;
  const look = Math.round(0.005 * SR);
  const need = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    need[i] = p > ceiling ? ceiling / p : 1;
  }
  const tgt = new Float32Array(n);
  const dq = new Int32Array(n);
  let h = 0;
  let e = 0;
  for (let i = n - 1; i >= 0; i--) {
    while (e > h && need[dq[e - 1]] >= need[i]) e--;
    dq[e++] = i;
    while (dq[h] > i + look) h++;
    tgt[i] = need[dq[h]];
  }
  const att = Math.exp(-1 / (0.0015 * SR));
  const rel = Math.exp(-1 / (0.08 * SR));
  let g = 1;
  let reduced = 0;
  for (let i = 0; i < n; i++) {
    g = tgt[i] < g ? tgt[i] + (g - tgt[i]) * att : tgt[i] + (g - tgt[i]) * rel;
    if (g < 0.999) reduced++;
    L[i] = clamp(L[i] * g, -ceiling, ceiling);
    R[i] = clamp(R[i] * g, -ceiling, ceiling);
  }
  return reduced / SR;
}

export function renderAudio(tl = buildTimeline()) {
  mkdirSync(path.join(AUDIO_DIR, "sfx"), { recursive: true });
  const N = Math.ceil(tl.total * SR);
  const mk = () => [new Float32Array(N), new Float32Array(N)];
  const voice = mk();
  const sfx = mk();
  const rng = mulberry32(20261115);
  const ffmpeg = findTool("ffmpeg");

  // 1) narration: resample each take to 48 kHz, high-pass, place at its cue
  for (const l of tl.voice) {
    const raw = execFileSync(ffmpeg, ["-v", "error", "-i", path.join(VIDEO, "audio", "voice", l.file), "-ar", String(SR), "-ac", "1", "-f", "f32le", "-"], { maxBuffer: 64 << 20 });
    const x = new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
    const hp = new Biquad("hp", 75, 0.7);
    const o = Math.round(l.start * SR);
    for (let i = 0; i < x.length; i++) {
      const v = hp.p(x[i]);
      add(voice, o + i, v, v);
    }
  }
  normalize(voice, -1);
  compress(voice, -22, 3);
  scale(voice, db(VOICE_RMS_DB) / rmsSpans(voice, tl.voice));

  // 2) effects: each normalized to a peak level, saved for listening, then placed on the timeline
  const S = tl.sfx;
  const place = (name, b, t0, peakDb) => {
    normalize(b, peakDb);
    writeWav(path.join(AUDIO_DIR, "sfx", `${name}.wav`), b, SR, 16);
    mixInto(sfx, b, t0);
  };
  place("alarm", fxAlarm(S.alarm), S.alarm.start, -13);
  place("heartbeat", fxHeartbeat(S.heartFast), S.heartFast.start, -11);
  place("cabin-hum", fxHum(S.hum[1] - S.hum[0], rng), S.hum[0], -27);
  place("rewind", fxRewind(S.rewind[1] - S.rewind[0], rng), S.rewind[0], -14);
  place("tape-clunk", fxClunk(rng), S.clunk, -14);
  place("ping", fxPing(), S.ping, -14);
  place("riser", fxRiser(S.riser[1] - S.riser[0], rng), S.riser[0], -17);
  place("brand-hit", fxHit(rng), S.hit, -7);
  S.whoosh.forEach((tc, k) => place(`whoosh-${k + 1}`, fxWhoosh(rng), tc - 0.3, -19));

  // 3) music bed, ducked under the voice, then set 20 dB below the voice (RMS under the spoken spans)
  const music = musicBed(tl, rng, N);
  const dM = duckEnv(N, tl.voice, -7);
  const dS = duckEnv(N, tl.voice, -5);
  for (let i = 0; i < N; i++) {
    music[0][i] *= dM[i];
    music[1][i] *= dM[i];
    sfx[0][i] *= dS[i];
    sfx[1][i] *= dS[i];
  }
  const voiceRms = rmsSpans(voice, tl.voice);
  scale(music, (voiceRms * db(-BED_BELOW_VOICE_DB)) / rmsSpans(music, tl.voice));

  // 4) master: end fade on music + effects, sum, limiter, tiny final fade
  const [fo0, fo1] = tl.music.fadeOut;
  const mix = mk();
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const end = 1 - smooth((t - fo0) / (fo1 - fo0));
    music[0][i] *= end;
    music[1][i] *= end;
    sfx[0][i] *= end;
    sfx[1][i] *= end;
    mix[0][i] = voice[0][i] + sfx[0][i] + music[0][i];
    mix[1][i] = voice[1][i] + sfx[1][i] + music[1][i];
  }
  const prePeak = peakOf(mix);
  const limited = limiter(mix[0], mix[1], db(CEILING_DB));
  const tailN = Math.round(0.015 * SR);
  for (let i = 0; i < tailN; i++) {
    mix[0][N - 1 - i] *= i / tailN;
    mix[1][N - 1 - i] *= i / tailN;
  }

  const mixPath = path.join(AUDIO_DIR, "mix.wav");
  writeWav(mixPath, mix, SR, 32);
  writeWav(path.join(AUDIO_DIR, "stem-voice.wav"), voice, SR, 16);
  writeWav(path.join(AUDIO_DIR, "stem-music.wav"), music, SR, 16);
  writeWav(path.join(AUDIO_DIR, "stem-sfx.wav"), sfx, SR, 16);

  const stats = {
    voiceRmsDb: +toDb(voiceRms).toFixed(1),
    musicUnderVoiceDb: +toDb(rmsSpans(music, tl.voice) / voiceRms).toFixed(1),
    peaksDb: { voice: +toDb(peakOf(voice)).toFixed(1), music: +toDb(peakOf(music)).toFixed(1), sfx: +toDb(peakOf(sfx)).toFixed(1) },
    peakBeforeLimiterDb: +toDb(prePeak).toFixed(1),
    limitedSeconds: +limited.toFixed(3),
  };
  const r = spawnSync(ffmpeg, ["-hide_banner", "-nostats", "-i", mixPath, "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"], { encoding: "utf8" });
  const summary = (r.stderr ?? "").split("Summary:").pop();
  const I = /I:\s+(-?[\d.]+) LUFS/.exec(summary);
  const P = /Peak:\s+(-?[\d.]+) dBFS/.exec(summary);
  if (I) stats.integratedLufs = +I[1];
  if (P) stats.truePeakDbfs = +P[1];
  return { mixPath, stats };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { mixPath, stats } = renderAudio();
  console.log("mix:", mixPath, stats);
}
