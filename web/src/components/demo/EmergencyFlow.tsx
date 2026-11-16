"use client";
// Emergency guide: chest pain and collapse (the challenge video's scenario).
// 8 steps with sources; no medication. `variant="inline"` renders it without
// the modal overlay (used by the video scenes).
import { useEffect, useRef } from "react";
import { EMERGENCY_STEPS } from "@/lib/guide";
import type { EmergencyStep } from "@/lib/guide";
import { SourceChips } from "./ui";

interface Props {
  open: boolean;
  onClose?: () => void;
  activeStep?: number;
  onStep?: (n: number) => void;
  variant?: "modal" | "inline";
}

function Step({ s, active, onStep }: { s: EmergencyStep; active: boolean; onStep?: (n: number) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onStep?.(s.n)}
        aria-current={active ? "step" : undefined}
        className={`w-full rounded-[3px] border p-3 text-left transition-colors ${
          active ? "border-alert bg-[#2a0d14]" : "border-hairline bg-space-850 hover:border-space-600"
        }`}
      >
        <span className="flex items-center gap-2">
          <span
            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              active ? "bg-alert text-[#2a0303]" : "bg-space-700 text-ink"
            }`}
          >
            {s.n}
          </span>
          <span className="font-semibold text-ink">{s.title}</span>
        </span>
        <span className="mt-1.5 block text-sm leading-relaxed text-ink/90">{s.text}</span>
        <SourceChips ids={s.sources} className="mt-2" />
      </button>
    </li>
  );
}

export function EmergencyFlow({ open, onClose, activeStep = 1, onStep, variant = "modal" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // Give focus back to whatever opened the dialog (runs before the effect below moves focus into it).
  useEffect(() => {
    if (!open || variant !== "modal") return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => opener?.focus();
  }, [open, variant]);
  useEffect(() => {
    if (!open || variant !== "modal") return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, variant, onClose]);
  if (!open) return null;

  const by = (b: EmergencyStep["branch"]) => EMERGENCY_STEPS.filter((s) => s.branch === b);
  const panel = (
    <div
      ref={ref}
      tabIndex={-1}
      role={variant === "modal" ? "dialog" : "region"}
      aria-modal={variant === "modal" ? true : undefined}
      aria-labelledby="emergency-title"
      className="w-full max-w-4xl rounded-[3px] border-2 border-alert bg-space-900 p-4 shadow-2xl outline-none sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold font-display tracking-[0.04em] text-alert">Emergency guide</p>
          <h2 id="emergency-title" className="font-display text-2xl font-bold text-ink">
            Chest pain or collapse
          </h2>
          <p className="mt-1 text-sm text-muted">
            Act on board now — a message to Earth can take up to 20 minutes to arrive. This guide does not replace crew medical training. No medication
            advice: the Crew Medical Officer (CMO) and the flight surgeon decide.
          </p>
        </div>
        {variant === "modal" && (
          <button type="button" onClick={onClose} className="rounded-[3px] border border-space-600 px-3 py-1.5 text-sm text-ink hover:bg-space-800">
            Close
          </button>
        )}
      </div>

      <ol className="mt-4 grid gap-2.5">
        {by("check").map((s) => (
          <Step key={s.n} s={s} active={activeStep === s.n} onStep={onStep} />
        ))}
      </ol>
      <div className="mt-2.5 grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-semibold font-display tracking-[0.04em] text-drift">If they respond</p>
          <ol className="grid gap-2.5">
            {by("responds").map((s) => (
              <Step key={s.n} s={s} active={activeStep === s.n} onStep={onStep} />
            ))}
          </ol>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold font-display tracking-[0.04em] text-alert">If they do not respond</p>
          <ol className="grid gap-2.5">
            {by("unresponsive").map((s) => (
              <Step key={s.n} s={s} active={activeStep === s.n} onStep={onStep} />
            ))}
          </ol>
        </div>
      </div>
      <ol className="mt-2.5 grid gap-2.5">
        {by("report").map((s) => (
          <Step key={s.n} s={s} active={activeStep === s.n} onStep={onStep} />
        ))}
      </ol>

      {variant === "modal" && (
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={activeStep <= 1}
            onClick={() => onStep?.(Math.max(1, activeStep - 1))}
            className="rounded-[3px] border border-space-600 px-4 py-2 text-sm text-ink enabled:hover:bg-space-800 disabled:opacity-40"
          >
            Previous step
          </button>
          <span className="text-xs text-muted">Step {activeStep} of 8 · adapted from MedlinePlus, ESC and NASA-STD-3001</span>
          <button
            type="button"
            disabled={activeStep >= 8}
            onClick={() => onStep?.(Math.min(8, activeStep + 1))}
            className="rounded-[3px] bg-alert px-4 py-2 text-sm font-semibold text-[#2a0303] enabled:hover:brightness-110 disabled:opacity-40"
          >
            Next step
          </button>
        </div>
      )}
    </div>
  );

  if (variant === "inline") return panel;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#02050c]/80 p-3-sm sm:p-8" onClick={onClose}>
      <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        {panel}
      </div>
    </div>
  );
}
