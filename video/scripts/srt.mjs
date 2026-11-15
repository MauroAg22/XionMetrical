// English subtitles (SRT) for the demo video, from the measured voice timeline (same clock as the render).
//   node scripts/srt.mjs [--out ../out/xionmetrical-demo.srt]
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildTimeline } from "./timeline.mjs";

const VIDEO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const i = process.argv.indexOf("--out");
const out = path.resolve(VIDEO, i > 0 ? process.argv[i + 1] : "../out/xionmetrical-demo.srt");

const stamp = (s) => {
  const ms = Math.round(s * 1000);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

const tl = buildTimeline();
const cues = tl.voice.map((v, k) => {
  const next = tl.voice[k + 1];
  // keep each line on screen a little after the voice ends, never overlapping the next one
  const end = Math.min(v.end + 0.35, next ? next.start - 0.05 : tl.total);
  return `${k + 1}\n${stamp(v.start)} --> ${stamp(end)}\n${v.text}\n`;
});
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, cues.join("\n"), "utf8");
console.log(`srt: ${out} (${cues.length} cues)`);
