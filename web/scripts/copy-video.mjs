// Copies the published video (repository file out/xionmetrical-demo.mp4) into public/video/ before `dev` and
// `build`, so the static site serves it from its own origin with the right MIME type. The copy is ignored by
// git: the repository keeps a single file. Without it, the page falls back to the GitHub link.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";

const src = new URL("../../out/xionmetrical-demo.mp4", import.meta.url);
const dir = new URL("../public/video/", import.meta.url);

if (existsSync(src)) {
  mkdirSync(dir, { recursive: true });
  copyFileSync(src, new URL("xionmetrical-demo.mp4", dir));
  console.log("copy-video: out/xionmetrical-demo.mp4 -> web/public/video/");
} else {
  console.warn("copy-video: out/xionmetrical-demo.mp4 not found; the page will use the GitHub link");
}
