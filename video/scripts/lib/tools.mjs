// Locates ffmpeg / ffprobe: $FFMPEG_DIR, then the PATH, then the winget install (Gyan.FFmpeg.Essentials).
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

const cache = {};

export function findTool(name) {
  if (cache[name]) return cache[name];
  const exe = process.platform === "win32" ? `${name}.exe` : name;
  const candidates = [];
  if (process.env.FFMPEG_DIR) candidates.push(path.join(process.env.FFMPEG_DIR, exe));
  candidates.push(name);
  const base = path.join(process.env.LOCALAPPDATA || "", "Microsoft", "WinGet", "Packages");
  if (existsSync(base)) {
    for (const d of readdirSync(base)) {
      if (!d.startsWith("Gyan.FFmpeg")) continue;
      for (const s of readdirSync(path.join(base, d))) candidates.push(path.join(base, d, s, "bin", exe));
    }
  }
  for (const c of candidates) {
    try {
      execFileSync(c, ["-version"], { stdio: "ignore" });
      return (cache[name] = c);
    } catch {
      /* try the next one */
    }
  }
  throw new Error(`${name} not found. Install it (winget install Gyan.FFmpeg.Essentials) or set FFMPEG_DIR.`);
}
