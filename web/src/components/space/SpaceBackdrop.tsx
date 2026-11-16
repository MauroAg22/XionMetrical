"use client";
// Fixed space background behind the landing page. The static CSS sky renders first (no JS needed);
// the 3D scene (three.js + React Three Fiber) is imported only after the page has loaded and the
// browser is idle, so it never blocks the first render. It stays static when WebGL 2 is missing, the
// GPU is a software fallback, the device looks low-end (few cores, little memory, data saver) or the
// visitor prefers reduced motion. Testing overrides: ?space=static or ?space=3d.
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { StaticSky } from "./StaticBackdrop";

const SpaceScene = dynamic(() => import("./SpaceScene"), { ssr: false });

function webgl2Ok(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function wants3D(): boolean {
  const q = new URLSearchParams(window.location.search).get("space");
  if (q === "static") return false;
  if (q !== "3d") {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    if ((nav.hardwareConcurrency || 8) < 4 || (nav.deviceMemory || 8) < 4 || nav.connection?.saveData) return false;
  }
  return webgl2Ok();
}

export function SpaceBackdrop() {
  const [scene, setScene] = useState<{ intro: boolean } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idle = 0;
    let timer = 0;
    const begin = () => {
      if (!cancelled && wants3D()) setScene({ intro: window.scrollY < 40 });
    };
    const whenIdle = () => {
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(begin, { timeout: 1500 });
      else timer = window.setTimeout(begin, 600);
    };
    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => {
      if (motion.matches) {
        setScene(null);
        setReady(false);
      }
    };
    motion.addEventListener("change", onMotion);
    return () => {
      cancelled = true;
      window.removeEventListener("load", whenIdle);
      if (idle) window.cancelIdleCallback(idle);
      if (timer) window.clearTimeout(timer);
      motion.removeEventListener("change", onMotion);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (ready) root.dataset.space = "3d";
    else delete root.dataset.space;
    return () => {
      delete root.dataset.space;
    };
  }, [ready]);

  return (
    <div aria-hidden="true" className="space-root">
      <StaticSky />
      {scene && (
        <div className="space-canvas">
          <SpaceScene
            intro={scene.intro}
            onReady={() => setReady(true)}
            onFail={() => {
              setScene(null);
              setReady(false);
            }}
          />
        </div>
      )}
      <div className="space-scrim" />
    </div>
  );
}
