"use client";
// Interactive demo shell: holds state (day, selection, play, emergency) and
// composes the pure components. The video scenes compose the same pure
// components with a time-driven `day` instead of this shell.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { assessDay } from "@/lib/assess";
import { INDICATOR_BY_ID, MISSION_DAYS, PHASES, phaseOf } from "@/lib/model";
import type { IndicatorId, Status } from "@/lib/model";
import { simulate } from "@/lib/simulate";
import { AlertCard } from "./AlertCard";
import { BodyFigure } from "./BodyFigure";
import { CheckIn } from "./CheckIn";
import { EmergencyFlow } from "./EmergencyFlow";
import { IndicatorList } from "./IndicatorList";
import { IndicatorPanel } from "./IndicatorPanel";
import { SimulatedBadge, STATUS_COLOR, StatusIcon } from "./ui";

// First day at or above NASA's 600 mSv career limit (red), taken from the data.
const DOSE_LIMIT = INDICATOR_BY_ID.radiation.channels[0].alertAbove?.value ?? 600;
const DOSE_LIMIT_DAY =
  Array.from({ length: MISSION_DAYS }, (_, i) => i + 1).find((d) => simulate(d).radiation.msv >= DOSE_LIMIT) ?? MISSION_DAYS;

const JUMPS: { day: number; label: string }[] = [
  { day: 1, label: "Day 1" },
  { day: 112, label: "Day 112" },
  { day: 115, label: "Day 115 · early warning" },
  { day: PHASES[0].end, label: `Day ${PHASES[0].end} · arrival at Mars` },
  { day: DOSE_LIMIT_DAY, label: `Day ${DOSE_LIMIT_DAY} · dose limit` },
  { day: PHASES[1].end, label: `Day ${PHASES[1].end} · leaving Mars` },
  { day: MISSION_DAYS, label: `Day ${MISSION_DAYS} · Earth arrival` },
];

export default function DemoApp() {
  const [day, setDay] = useState(115);
  const [selected, setSelected] = useState<IndicatorId>("hr");
  const [playing, setPlaying] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [step, setStep] = useState(1);

  // Optional deep link: /demo/?day=115&i=hr
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const d = Number(q.get("day"));
    if (d >= 1 && d <= MISSION_DAYS) setDay(Math.round(d));
    const i = q.get("i") as IndicatorId | null;
    if (i && i in INDICATOR_BY_ID) setSelected(i);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => setDay((d) => Math.min(MISSION_DAYS, d + 1)), 80);
    return () => window.clearInterval(t);
  }, [playing]);
  useEffect(() => {
    if (day >= MISSION_DAYS) setPlaying(false);
  }, [day]);

  const select = useCallback((id: IndicatorId) => {
    setSelected(id);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      document.getElementById("indicator-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // From the check-in (below the panel): always bring the panel into view.
  const openPanel = useCallback((id: IndicatorId) => {
    setSelected(id);
    document.getElementById("indicator-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const phase = phaseOf(day);
  const counts = assessDay(day).reduce<Record<Status, number>>(
    (acc, a) => ({ ...acc, [a.status]: acc[a.status] + 1 }),
    { normal: 0, drift: 0, alert: 0 },
  );

  return (
    <div className="starfield min-h-screen pb-20">
      <header className="sticky top-0 z-40 border-b border-space-700 bg-space-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold tracking-tight text-ink hover:text-accent-soft">
              XionMetrical
            </Link>
            <span className="hidden text-sm text-muted sm:inline">Interactive demo</span>
            <span className="hidden md:block">
              <SimulatedBadge />
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setEmergency(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-alert px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#2a0303] shadow-[0_0_0_3px_rgba(255,92,92,0.25)] hover:brightness-110"
            aria-haspopup="dialog"
          >
            <StatusIcon status="alert" size={16} />
            Emergency
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-4">
        <h1 className="sr-only">XionMetrical interactive demo (simulated data)</h1>
        <section aria-label="Mission timeline" className="rounded-2xl border border-space-700 bg-space-900/85 p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-accent-soft">{phase.name} · example astronaut · simulated</p>
              <p className="mt-0.5 text-2xl font-bold text-ink">
                Mission day <span className="font-mono">{day}</span>
                <span className="text-base font-normal text-muted"> / {MISSION_DAYS}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {(["normal", "drift", "alert"] as Status[]).map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5" style={{ color: STATUS_COLOR[s] }}>
                  <StatusIcon status={s} size={13} />
                  {counts[s]} {s === "normal" ? "normal" : s === "drift" ? "drifting" : "act now"}
                </span>
              ))}
              <span className="rounded-full border border-space-600 px-2 py-0.5 text-muted">Earth link: up to 20 min one way</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (day >= MISSION_DAYS) setDay(1);
                setPlaying((p) => !p);
              }}
              aria-label={playing ? "Pause" : "Play the mission"}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-space-950 hover:brightness-110"
            >
              {playing ? (
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                  <rect x="3" y="2" width="3.5" height="12" rx="1" fill="currentColor" />
                  <rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="currentColor" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                  <path d="M4 2.5v11l9.5-5.5z" fill="currentColor" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={1}
              max={MISSION_DAYS}
              value={day}
              onChange={(e) => {
                setPlaying(false);
                setDay(Number(e.target.value));
              }}
              aria-label="Mission day"
              aria-valuetext={`Day ${day} of ${MISSION_DAYS} · ${phase.name}`}
              className="h-2 w-full cursor-pointer accent-[#4c8dff]"
            />
          </div>
          <div className="mt-1.5 flex pl-[52px]" role="group" aria-label="Mission phases">
            {PHASES.map((p) => {
              const active = phase.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPlaying(false);
                    setDay(p.start);
                  }}
                  style={{ width: `${((p.end - p.start + 1) / MISSION_DAYS) * 100}%` }}
                  aria-label={`${p.name}: days ${p.start} to ${p.end}`}
                  aria-current={active ? "step" : undefined}
                  className={`min-w-0 border-t-2 px-0.5 pt-1 text-left text-[11px] leading-tight sm:px-1 ${
                    active ? "border-accent-soft text-ink" : "border-space-600 text-faint hover:text-muted"
                  }`}
                >
                  {p.short}
                  <span className="hidden md:inline">
                    {" "}
                    · days {p.start}–{p.end}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {JUMPS.map((j) => (
              <button
                key={j.day}
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setDay(j.day);
                }}
                className={`rounded-full border px-3 py-1 text-xs ${
                  day === j.day ? "border-accent-soft bg-space-800 text-ink" : "border-space-600 text-muted hover:text-ink"
                }`}
              >
                {j.label}
              </button>
            ))}
            <a
              href="#check-in"
              className="rounded-full border border-accent/60 px-3 py-1 text-xs text-accent-soft hover:border-accent-soft hover:text-ink"
            >
              Log today&apos;s measurements ↓
            </a>
          </div>
        </section>

        <AlertCard day={day} onSelect={select} className="mt-4" />

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <section aria-label="Body map" className="rounded-2xl border border-space-700 bg-space-900/85 p-3">
              <p className="px-1 text-xs text-muted">Tap a body zone or an indicator</p>
              <BodyFigure day={day} selectedZone={INDICATOR_BY_ID[selected].zone} onSelect={(id) => select(id)} className="mx-auto max-w-[420px]" />
            </section>
            <IndicatorList day={day} selected={selected} onSelect={select} />
          </div>
          <div className="lg:col-span-7">
            <IndicatorPanel id={selected} day={day} />
          </div>
        </div>

        <CheckIn key={day} day={day} onSelect={openPanel} className="mt-4" />
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-space-700 bg-space-950/95 px-4 py-2 text-center text-xs text-muted backdrop-blur">
        Prototype · simulated data · not a medical device
      </footer>

      <EmergencyFlow open={emergency} onClose={() => setEmergency(false)} activeStep={step} onStep={setStep} />
    </div>
  );
}
