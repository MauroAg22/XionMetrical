// Renders the video frame by frame — no screen capture: the installed Chrome draws the exact frame for
// time t through window.seek(t), and ffmpeg joins the frames and the mix into an MP4
// (H.264 yuv420p + AAC 48 kHz, 1920×1080, 30 fps, +faststart) with the AI-use metadata.
//   node scripts/render.mjs                                   -> full video → ../out/xionmetrical-demo.mp4
//   node scripts/render.mjs --from 0 --to 10 --out tmp/xionmetrical-test-0-10s.mp4
// Options: --app live (real app scenes from /video-scene/), --proxy http://localhost:3100 (next dev), --encode-only,
//          --jpeg (faster frames), --skip-audio (reuse tmp/audio/mix.wav)
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "./server.mjs";
import { writeTimeline } from "./timeline.mjs";
import { renderAudio, AUDIO_DIR } from "./audio.mjs";
import { findTool } from "./lib/tools.mjs";

const VIDEO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FRAMES = path.join(VIDEO, "frames");
export const META = "Narration generated with AI (Piper TTS); animation AI-assisted (Claude); sound effects procedurally generated";

const opt = {};
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i];
  if (!k.startsWith("--")) continue;
  const v = process.argv[i + 1];
  if (v === undefined || v.startsWith("--")) opt[k.slice(2)] = true;
  else {
    opt[k.slice(2)] = v;
    i++;
  }
}

const tl = writeTimeline();
if (tl.problems.length) console.warn("timeline problems:\n- " + tl.problems.join("\n- "));
if (!opt["skip-audio"]) {
  const { stats } = renderAudio(tl);
  console.log("audio:", stats);
}

const fps = tl.fps;
const from = Number(opt.from ?? 0);
const to = Math.min(Number(opt.to ?? tl.total), tl.total);
const f0 = Math.round(from * fps);
const f1 = Math.round(to * fps);
const ext = opt.jpeg ? "jpg" : "png";
if (!opt["encode-only"]) await renderFrames();

async function renderFrames() {
rmSync(FRAMES, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });
const srv = await startServer({ proxy: typeof opt.proxy === "string" ? opt.proxy : null });
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--force-color-profile=srgb", "--hide-scrollbars", "--mute-audio"] });
const t0 = Date.now();
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on("console", (m) => m.type() === "error" && console.error("[page]", m.text()));
  page.on("pageerror", (e) => console.error("[page error]", e.message));
  await page.goto(`http://127.0.0.1:${srv.port}/__stage/index.html${opt.app ? `?app=${opt.app}` : ""}`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 120000 });
  for (let f = f0; f < f1; f++) {
    await page.evaluate((t) => window.seek(t), f / fps);
    await page.screenshot({ path: path.join(FRAMES, `f${String(f).padStart(5, "0")}.${ext}`), type: opt.jpeg ? "jpeg" : "png", ...(opt.jpeg ? { quality: 95 } : {}) });
    if ((f - f0 + 1) % 60 === 0) console.log(`  frames ${f - f0 + 1}/${f1 - f0}  (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
} finally {
  await browser.close();
  await srv.close();
}
console.log(`frames done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

const out = path.resolve(VIDEO, typeof opt.out === "string" ? opt.out : path.join("..", "out", "xionmetrical-demo.mp4"));
mkdirSync(path.dirname(out), { recursive: true });
execFileSync(
  findTool("ffmpeg"),
  [
    "-y", "-v", "error",
    "-framerate", String(fps), "-start_number", String(f0), "-i", path.join(FRAMES, `f%05d.${ext}`),
    "-ss", String(from), "-t", String(to - from), "-i", path.join(AUDIO_DIR, "mix.wav"),
    "-map", "0:v:0", "-map", "1:a:0",
    "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv",
    "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-profile:v", "high", "-level:v", "4.1", "-r", String(fps), "-g", String(fps * 2),
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
    "-movflags", "+faststart",
    "-metadata", "title=XionMetrical demo",
    "-metadata", "artist=Team Space Mercedes",
    "-metadata", `comment=${META}`,
    "-metadata", `description=${META}. Educational prototype with simulated data; not a medical device.`,
    "-shortest", out,
  ],
  { stdio: "inherit" },
);
console.log("written:", out);
console.log(execFileSync(findTool("ffprobe"), ["-v", "error", "-show_entries", "format=duration,size:stream=codec_name,width,height,pix_fmt,r_frame_rate,sample_rate,channels", "-of", "compact", out]).toString().trim());
