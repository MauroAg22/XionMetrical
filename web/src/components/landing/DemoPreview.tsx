"use client";
// Live, non-interactive preview of the real demo components (day 115).
import Link from "next/link";
import { AlertCard } from "@/components/demo/AlertCard";
import { BodyFigure } from "@/components/demo/BodyFigure";
import { TrendChart } from "@/components/demo/TrendChart";

export function HeroPreview() {
  return (
    <div className="panel ticks p-3">
      <div className="flex items-center justify-between gap-3 px-2 pb-2 pt-1 font-display text-xs text-muted">
        <span>Mission day 115 · Mars transit</span>
        <span>Prototype · simulated data</span>
      </div>
      <BodyFigure day={115} selectedZone="heart" className="mx-auto max-w-[360px]" />
    </div>
  );
}

export function DemoPreview() {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <AlertCard day={115} />
        <div className="rounded-2xl border border-space-700 bg-space-900/85 p-4">
          <p className="mb-2 text-sm font-semibold text-ink">Resting heart rate · last 30 days</p>
          <TrendChart id="hr" day={115} windowDays={30} />
          <p className="mt-1 text-[11px] text-faint">
            Inside the 60–100 bpm range for adults on Earth, yet above this astronaut&apos;s own baseline for 3 days → yellow. Simulated data.
          </p>
        </div>
      </div>
      <div className="flex flex-col justify-between rounded-2xl border border-space-700 bg-space-900/85 p-4 lg:col-span-2">
        <BodyFigure day={115} selectedZone="heart" className="mx-auto max-w-[300px]" />
        <Link
          href="/demo/"
          className="mt-3 inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 font-semibold text-space-950 hover:brightness-110"
        >
          Open the interactive demo →
        </Link>
      </div>
    </div>
  );
}
