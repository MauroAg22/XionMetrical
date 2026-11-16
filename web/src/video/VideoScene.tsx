"use client";
// Video mode of the demo (used only by the video renderer, session B): the real demo components,
// driven by a single clock. window.__seek(t) renders the exact frame for t seconds since the scene
// start; no timers, no randomness, no transitions. Code written with AI assistance (Claude Code).
// Timing shared with video/scripts/timeline.mjs (alert choreography and montage shots).
import { Fragment, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AlertCard } from "@/components/demo/AlertCard";
import { BodyFigure } from "@/components/demo/BodyFigure";
import { EmergencyFlow } from "@/components/demo/EmergencyFlow";
import { IndicatorList } from "@/components/demo/IndicatorList";
import { GuideLayers, IndicatorPanel } from "@/components/demo/IndicatorPanel";
import { SimulatedBadge } from "@/components/demo/ui";
import { MISSION_DAYS, PHASES, phaseOf } from "@/lib/model";

declare global {
  interface Window {
    __seek?: (t: number) => boolean;
    __sceneReady?: boolean;
  }
}

type Scene = "alert" | "montage";
const ALERT = { dayFrom: 113, dayTo: 115, dayStart: 1.6, dayEnd: 3.4, flagAt: 3.8, panelAt: 5.0 };
const SHOTS = [0, 2.5, 3.9, 5.4]; // montage shot starts (s)
const ZOOM = 1.25; // components are laid out at 1536×864 and scaled to fill 1920×1080

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const ramp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const ease = (u: number) => u * u * (3 - 2 * u);
const appear = (t: number, a: number, d = 0.35) => {
  const u = ease(ramp(t, a, a + d));
  return { opacity: u, transform: `translateY(${((1 - u) * 24).toFixed(1)}px)` };
};

// A clipped viewport whose content scrolls by progress (0..1) of its overflow, like a user scrolling.
function ScrollView({ progress, limit = Infinity, className = "", children }: { progress: number; limit?: number; className?: string; children: ReactNode }) {
  const view = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [max, setMax] = useState(0);
  useLayoutEffect(() => {
    if (!view.current || !content.current) return;
    const m = Math.max(0, content.current.offsetHeight - view.current.clientHeight);
    if (m !== max) setMax(m);
  });
  return (
    <div ref={view} className={`min-h-0 overflow-hidden ${className}`}>
      <div ref={content} style={{ transform: `translateY(${(-Math.min(max, limit) * progress).toFixed(1)}px)` }}>
        {children}
      </div>
    </div>
  );
}

function Header({ day, label }: { day: number; label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-hairline pb-4">
      <div className="flex items-baseline gap-4">
        <span className="font-display text-3xl font-semibold tracking-tight text-ink">
          XionMetrical
        </span>
        <span className="text-lg text-muted">{label}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="rounded-[3px] border border-hairline bg-space-900 px-4 py-1.5 font-display text-xl font-semibold tabular-nums text-ink">Mission day {day}</span>
        <SimulatedBadge />
      </div>
    </div>
  );
}

// Mission bar from the shared model (PHASES): ticks at Mars arrival and departure, phase names below.
function DayTrack({ day }: { day: number }) {
  const pos = (d: number) => `${(((d - 1) / (MISSION_DAYS - 1)) * 100).toFixed(3)}%`;
  const now = phaseOf(day).id;
  return (
    <div className="mt-4 flex items-center gap-4 pb-5 text-sm text-muted">
      <span>Day 1</span>
      <div className="relative h-2 flex-1 rounded-full bg-space-800">
        <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: pos(day) }} />
        {PHASES.map((p, i) => (
          <Fragment key={p.id}>
            {i > 0 && <div className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 bg-faint" style={{ left: pos(p.start - 1) }} />}
            <div
              className={`absolute top-4 -translate-x-1/2 whitespace-nowrap text-sm ${p.id === now ? "font-semibold text-accent-soft" : "text-faint"}`}
              style={{ left: pos((p.start + p.end) / 2) }}
            >
              {p.short}
            </div>
          </Fragment>
        ))}
        <div className="absolute -top-1.5 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-ink bg-accent" style={{ left: pos(day) }} />
      </div>
      <span>Day {MISSION_DAYS} · Earth</span>
    </div>
  );
}

function AlertScene({ t }: { t: number }) {
  const day = Math.round(ALERT.dayFrom + (ALERT.dayTo - ALERT.dayFrom) * ease(ramp(t, ALERT.dayStart, ALERT.dayEnd)));
  const flagged = t >= ALERT.flagAt;
  const pop = flagged ? Math.exp(-(t - ALERT.flagAt) / 0.35) : 0;
  const shown = flagged ? ALERT.dayTo : ALERT.dayFrom; // body and card change together, when the app flags it
  return (
    <>
      <Header day={day} label={`${phaseOf(day).name} · crew member 1`} />
      <DayTrack day={day} />
      <div className="mt-6 grid min-h-0 flex-1 grid-cols-[400px_1fr] grid-rows-[minmax(0,1fr)] gap-8">
        <BodyFigure day={shown} selectedZone={t >= ALERT.panelAt ? "heart" : null} className="max-h-full" />
        <ScrollView progress={ease(ramp(t, ALERT.panelAt + 0.7, ALERT.panelAt + 1.7))} className="h-full min-w-0">
        <div className="flex flex-col gap-6 p-2">
          <div style={{ transform: `scale(${(1 + 0.03 * pop).toFixed(4)})`, transformOrigin: "50% 50%", boxShadow: `0 0 0 ${(4 * pop).toFixed(1)}px rgba(245,184,46,${(0.8 * pop).toFixed(3)})`, borderRadius: 16 }}>
            <AlertCard day={shown} />
          </div>
          <div style={appear(t, ALERT.panelAt, 0.45)}>
            <IndicatorPanel id="hr" day={ALERT.dayTo} showGuide={false} chartWindow={30} className="[&_figure]:mx-auto [&_figure]:max-w-[820px]" />
          </div>
        </div>
        </ScrollView>
      </div>
    </>
  );
}

function MontageScene({ t }: { t: number }) {
  const shot = SHOTS.filter((s) => t >= s).length - 1;
  const day = ALERT.dayTo;
  const local = t - SHOTS[Math.max(0, shot)];
  return (
    <>
      <Header day={day} label={`${phaseOf(day).name} · crew member 1`} />
      {shot <= 0 && (
        <div className="mt-6 grid grid-cols-[440px_1fr] gap-10">
          <BodyFigure day={day} className="max-h-[700px]" />
          <IndicatorList day={day} />
        </div>
      )}
      {shot === 1 && (
        <div className="mx-auto mt-6 max-w-[1150px]">
          <IndicatorPanel id="hr" day={day} showGuide={false} chartWindow={60} />
        </div>
      )}
      {shot === 2 && (
        <div className="mx-auto mt-6 max-w-[1250px]">
          <GuideLayers id="hr" day={day} />
        </div>
      )}
      {shot === 3 && (
        <ScrollView progress={ease(ramp(local, 0.3, 1.9))} limit={240} className="mx-auto mt-6 w-full max-w-[900px] flex-1">
          <EmergencyFlow open variant="inline" activeStep={1 + Math.min(2, Math.floor(local / 0.6))} />
        </ScrollView>
      )}
    </>
  );
}

export default function VideoScene() {
  const [scene, setScene] = useState<Scene | null>(null);
  const [t, setT] = useState(0);

  useEffect(() => {
    setScene(new URLSearchParams(window.location.search).get("scene") === "montage" ? "montage" : "alert");
    window.__seek = (x: number) => {
      flushSync(() => setT(x));
      return true;
    };
  }, []);
  useEffect(() => {
    if (scene) window.__sceneReady = true;
  }, [scene]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-space-950" style={{ width: 1920, height: 1080 }}>
      <style>{`*{transition:none!important;animation:none!important;caret-color:transparent}html,body{overflow:hidden}`}</style>
      <div className="flex flex-col p-10" style={{ zoom: ZOOM, width: 1920 / ZOOM, height: 1080 / ZOOM, boxSizing: "border-box" }}>
        {scene === "alert" && <AlertScene t={t} />}
        {scene === "montage" && <MontageScene t={t} />}
      </div>
    </div>
  );
}
