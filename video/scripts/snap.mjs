// Quick check: renders a few timestamps of the stage into one contact sheet (half resolution).
//   node scripts/snap.mjs 9.9 12 19 21.5 [--app live] [--proxy http://localhost:3100] [--out tmp/snap.png]
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "./server.mjs";
import { writeTimeline } from "./timeline.mjs";
import { findTool } from "./lib/tools.mjs";

const VIDEO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const val = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const times = args.filter((a, i) => /^\d/.test(a) && !["--app", "--proxy", "--out"].includes(args[i - 1])).map(Number);
const out = path.resolve(VIDEO, val("--out") ?? "tmp/snap.png");
writeTimeline();
const dir = path.join(VIDEO, "tmp", "snap");
mkdirSync(dir, { recursive: true });
const srv = await startServer({ proxy: val("--proxy") });
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--force-color-profile=srgb", "--hide-scrollbars", "--mute-audio"] });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("[page error]", e.message));
  await page.goto(`http://127.0.0.1:${srv.port}/__stage/index.html${val("--app") ? `?app=${val("--app")}` : ""}`);
  await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 180000 });
  for (const [i, t] of times.entries()) {
    await page.evaluate((x) => window.seek(x), t);
    await page.screenshot({ path: path.join(dir, `s${i}.png`) });
  }
} finally {
  await browser.close();
  await srv.close();
}
const cols = times.length > 2 ? 2 : times.length;
const rows = Math.ceil(times.length / cols);
execFileSync(findTool("ffmpeg"), ["-v", "error", "-y", "-i", path.join(dir, "s%d.png"), "-vf", `scale=960:540,tile=${cols}x${rows}`, "-frames:v", "1", out]);
console.log("sheet:", out);
