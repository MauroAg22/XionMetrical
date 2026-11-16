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
        <div className="panel ticks p-4">
          <p className="mb-2 font-display text-base font-semibold text-ink">Resting heart rate · last 30 days</p>
          <TrendChart id="hr" day={115} windowDays={30} />
          <p className="mt-1 text-[11px] text-faint">
            Inside the 60–100 bpm range for adults on Earth, yet above this astronaut&apos;s own baseline for 3 days → yellow. Simulated data.
          </p>
        </div>
      </div>
      <div className="panel ticks flex flex-col justify-between p-4 [&>*+*]:border-t-0 lg:col-span-2">
        <BodyFigure day={115} selectedZone="heart" className="mx-auto max-w-[300px]" />
        <Link
          href="/demo/"
          className="btn-primary mt-3 px-5 py-3"
        >
          Open the interactive demo →
        </Link>
      </div>
    </div>
  );
}
