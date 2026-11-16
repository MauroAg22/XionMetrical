"use client";
// Mission HUD in the sticky header: Earth → Mars progress, mission day and the one-way signal delay to
// Earth, driven by the scroll position (see ./journey). Decorative and simulated, so it is hidden from
// assistive technology; the page copy carries the same facts in text.
import { useEffect, useRef } from "react";
import { formatDelay, journey, phaseName, signalDelayMinutes, transitProgress } from "./journey";

export function MissionHud() {
  const root = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const ship = useRef<HTMLSpanElement>(null);
  const day = useRef<HTMLElement>(null);
  const phase = useRef<HTMLSpanElement>(null);
  const delay = useRef<HTMLElement>(null);

  useEffect(() => {
    const paint = () => {
      const d = journey.day;
      const p = transitProgress(d);
      if (root.current) root.current.toggleAttribute("data-arrived", p >= 1);
      if (fill.current) fill.current.style.transform = `scaleX(${p})`;
      if (ship.current) ship.current.style.left = `${p * 100}%`;
      if (day.current) day.current.textContent = String(Math.max(1, Math.round(d)));
      if (phase.current) phase.current.textContent = phaseName(Math.round(d));
      if (delay.current) delay.current.textContent = formatDelay(signalDelayMinutes(d));
    };
    const off = journey.subscribe(paint);
    paint();
    return off;
  }, []);

  return (
    <div ref={root} aria-hidden="true" className="hud">
      <span className="hud-end">Earth</span>
      <span className="hud-track">
        <span ref={fill} className="hud-fill" />
        <span ref={ship} className="hud-ship" />
      </span>
      <span className="hud-end">Mars</span>
      <span className="hud-read">
        <span>
          Day <b ref={day}>1</b>
        </span>
        <span ref={phase} className="hud-phase">
          {phaseName(1)}
        </span>
        <span>
          <span className="hidden sm:inline">Signal to Earth </span>
          <span className="sm:hidden">Signal </span>
          <b ref={delay}>{formatDelay(signalDelayMinutes(1))}</b>
        </span>
        <span className="hud-note">simulated</span>
      </span>
    </div>
  );
}
