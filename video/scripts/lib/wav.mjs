// Minimal WAV reader/writer (PCM 8/16/24/32-bit and IEEE float), no dependencies.
// Part of the XionMetrical video pipeline (AI-assisted code, see docs/registro-video.md).
import { readFileSync, writeFileSync } from "node:fs";

/** @returns {{ sampleRate: number, channels: Float32Array[] }} */
export function readWav(file) {
  const b = readFileSync(file);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error(`not a WAV file: ${file}`);
  }
  let off = 12;
  let fmt = null;
  let data = null;
  while (off + 8 <= b.length) {
    const id = b.toString("ascii", off, off + 4);
    const size = b.readUInt32LE(off + 4);
    const body = off + 8;
    if (id === "fmt ") {
      let format = b.readUInt16LE(body);
      if (format === 0xfffe) format = b.readUInt16LE(body + 24); // WAVE_FORMAT_EXTENSIBLE
      fmt = { format, channels: b.readUInt16LE(body + 2), sampleRate: b.readUInt32LE(body + 4), bits: b.readUInt16LE(body + 14) };
    } else if (id === "data") {
      data = b.subarray(body, Math.min(body + size, b.length));
    }
    off = body + size + (size & 1);
  }
  if (!fmt || !data) throw new Error(`malformed WAV file: ${file}`);
  const { format, channels, sampleRate, bits } = fmt;
  const bytes = bits / 8;
  const frames = Math.floor(data.length / (bytes * channels));
  const out = Array.from({ length: channels }, () => new Float32Array(frames));
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels; c++) {
      const p = (i * channels + c) * bytes;
      let v;
      if (format === 3) v = bits === 32 ? data.readFloatLE(p) : data.readDoubleLE(p);
      else if (bits === 16) v = data.readInt16LE(p) / 32768;
      else if (bits === 24) v = data.readIntLE(p, 3) / 8388608;
      else if (bits === 32) v = data.readInt32LE(p) / 2147483648;
      else v = (data[p] - 128) / 128;
      out[c][i] = v;
    }
  }
  return { sampleRate, channels: out };
}

/** Writes PCM 16-bit (bits = 16) or IEEE float 32-bit (bits = 32). */
export function writeWav(file, chans, sampleRate, bits = 16) {
  const n = chans[0].length;
  const nc = chans.length;
  const bytes = bits / 8;
  const float = bits === 32;
  const b = Buffer.alloc(44 + n * nc * bytes);
  b.write("RIFF", 0, "ascii");
  b.writeUInt32LE(36 + n * nc * bytes, 4);
  b.write("WAVE", 8, "ascii");
  b.write("fmt ", 12, "ascii");
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(float ? 3 : 1, 20);
  b.writeUInt16LE(nc, 22);
  b.writeUInt32LE(sampleRate, 24);
  b.writeUInt32LE(sampleRate * nc * bytes, 28);
  b.writeUInt16LE(nc * bytes, 32);
  b.writeUInt16LE(bits, 34);
  b.write("data", 36, "ascii");
  b.writeUInt32LE(n * nc * bytes, 40);
  let p = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nc; c++) {
      const v = chans[c][i];
      if (float) b.writeFloatLE(v, p);
      else b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), p);
      p += bytes;
    }
  }
  writeFileSync(file, b);
}

/** Speech bounds (seconds) from 10 ms RMS windows above `floorDb` relative to the peak window. */
export function speechBounds(x, sampleRate, floorDb = -38) {
  const win = Math.round(sampleRate * 0.01);
  const rms = [];
  for (let i = 0; i + win <= x.length; i += win) {
    let s = 0;
    for (let j = i; j < i + win; j++) s += x[j] * x[j];
    rms.push(Math.sqrt(s / win));
  }
  const peak = Math.max(...rms, 1e-9);
  const thr = peak * Math.pow(10, floorDb / 20);
  const first = rms.findIndex((v) => v > thr);
  let last = rms.length - 1;
  while (last > 0 && rms[last] <= thr) last--;
  return { start: (first * win) / sampleRate, end: ((last + 1) * win) / sampleRate, total: x.length / sampleRate };
}
