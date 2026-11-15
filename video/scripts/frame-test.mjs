// E0 smoke test: render ONE 1920x1080 frame with the installed Chrome
// (playwright-core, channel "chrome") from a page that exposes window.seek(t).
// No screen capture: the page draws the exact frame for time t.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const html = `<!doctype html><html><head><style>
  html,body{margin:0;width:1920px;height:1080px;background:#050b18;color:#e6edf7;font-family:system-ui,sans-serif;overflow:hidden}
  #t{position:absolute;left:120px;top:440px;font-size:96px;font-weight:700}
  #c{position:absolute;width:80px;height:80px;border-radius:50%;background:#3b82f6;top:700px}
  #wm{position:absolute;right:32px;bottom:24px;font-size:22px;opacity:.75}
</style></head><body>
  <div id="t">XionMetrical · frame test</div><div id="c"></div><div id="wm">AI-assisted animation</div>
  <script>
    window.seek = (t) => {
      document.getElementById('c').style.left = (120 + t * 400) + 'px';
      document.getElementById('t').textContent = 'XionMetrical · t = ' + t.toFixed(2) + ' s';
    };
    window.seek(0);
  </script>
</body></html>`;

mkdirSync("tmp", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.evaluate(() => window.seek(1.5));
await page.screenshot({ path: "tmp/e0-frame.png" });
await browser.close();
console.log("frame written: video/tmp/e0-frame.png");
