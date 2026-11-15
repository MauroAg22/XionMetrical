"use client";
// Today's check-in: measurement reminders (routine.ts) and the
// "Log today's measurements" form (decision D7: manual entry + simulated data).
// Logged values are compared with the same traffic-light rule as the simulated
// data; nothing is stored or sent. Prototype, not a diagnosis.
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { assessDay, assessEntry, fmt } from "@/lib/assess";
import type { IndicatorAssessment } from "@/lib/assess";
import { actionsFor, GUIDE } from "@/lib/guide";
import { BASELINE_DAYS, INDICATOR_BY_ID, primaryChannel } from "@/lib/model";
import type { IndicatorId } from "@/lib/model";
import type { SourceId } from "@/lib/sources";
import { isDue, nextDue, ROUTINE, SLOT_LABEL } from "@/lib/routine";
import type { Slot } from "@/lib/routine";
import { simulate } from "@/lib/simulate";
import { SourceChips, STATUS_COLOR, StatusIcon, StatusPill } from "./ui";

type LogId = "hr" | "sleep" | "mood";

interface FieldDef {
  id: LogId;
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

const FIELDS: FieldDef[] = [
  { id: "hr", key: "bpm", label: "Resting heart rate", unit: "bpm", min: 25, max: 220, step: 1 },
  { id: "sleep", key: "h", label: "Sleep last night", unit: "h", min: 0, max: 16, step: 0.1 },
  { id: "mood", key: "score", label: "Mood", unit: "/ 5", min: 1, max: 5, step: 1 },
];

const SLOTS: Slot[] = ["morning", "day", "evening", "weekly", "auto"];

/** Why the logged value got its color (same reasons as the panel, plus the 1-day case). */
function explain(a: IndicatorAssessment): { text: string; sources: SourceId[] }[] {
  if (a.reasons.length > 0) return a.reasons.map((r) => ({ text: r.text, sources: r.sources }));
  const c = a.channels[0];
  if (c?.side) {
    return [
      {
        text: `${c.side === "above" ? "Above" : "Below"} your baseline today only · drift is flagged from 2 days in a row`,
        sources: ["XM-RULE"],
      },
    ];
  }
  return [{ text: "Within your baseline", sources: [] }];
}

interface Props {
  day: number;
  /** Open an indicator in the main panel. */
  onSelect?: (id: IndicatorId) => void;
  className?: string;
}

export function CheckIn({ day, onSelect, className = "" }: Props) {
  const [done, setDone] = useState<Set<IndicatorId>>(new Set());
  const [values, setValues] = useState<Record<LogId, string>>({ hr: "", sleep: "", mood: "" });
  const [errors, setErrors] = useState<Partial<Record<LogId, string>>>({});
  const [results, setResults] = useState<{ field: FieldDef; value: number; a: IndicatorAssessment }[] | null>(null);
  const uid = useId();

  const today = new Map(assessDay(day).map((a) => [a.id, a]));
  const due = ROUTINE.filter((r) => isDue(r, day));
  const doneCount = due.filter((r) => done.has(r.id)).length;

  const toggle = (id: IndicatorId) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const fillSimulated = () => {
    const s = simulate(day);
    setValues({ hr: String(Math.round(s.hr.bpm)), sleep: s.sleep.h.toFixed(1), mood: String(Math.round(s.mood.score)) });
    setErrors({});
    setResults(null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Partial<Record<LogId, string>> = {};
    const out: { field: FieldDef; value: number; a: IndicatorAssessment }[] = [];
    for (const f of FIELDS) {
      const raw = values[f.id].trim().replace(",", ".");
      if (raw === "") continue;
      const v = Number(raw);
      if (!Number.isFinite(v) || v < f.min || v > f.max) {
        errs[f.id] = `Enter a number from ${f.min} to ${f.max}.`;
        continue;
      }
      out.push({ field: f, value: v, a: assessEntry(f.id, day, { [f.key]: v }) });
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (out.length === 0) {
      setErrors({ hr: "Enter at least one measurement." });
      setResults(null);
      return;
    }
    setResults(out);
    setDone((prev) => new Set([...prev, ...out.map((r) => r.field.id)]));
  };

  return (
    <section id="check-in" aria-labelledby={`${uid}-title`} className={`scroll-mt-20 rounded-2xl border border-space-700 bg-space-900/85 p-4 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`${uid}-title`} className="text-lg font-bold text-ink">
          Today&apos;s check-in · mission day <span className="font-mono">{day}</span>
        </h2>
        <p className="text-xs text-muted">Reminders and manual entry · not a diagnosis</p>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        {/* ---- Reminders ---- */}
        <div className="rounded-xl border border-space-700 bg-space-850/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-ink">Measurement reminders</h3>
            <span className="text-xs text-muted" aria-live="polite">
              {doneCount} of {due.length} done today
            </span>
          </div>
          <ul className="mt-2 space-y-3">
            {SLOTS.map((slot) => {
              const items = ROUTINE.filter((r) => r.slot === slot);
              return (
                <li key={slot}>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-soft">{SLOT_LABEL[slot]}</p>
                  <ul className="mt-1 divide-y divide-space-700/70">
                    {items.map((r) => {
                      const def = INDICATOR_BY_ID[r.id];
                      const a = today.get(r.id);
                      const isToday = isDue(r, day);
                      const flagged = a && a.status !== "normal";
                      return (
                        <li key={r.id} className="flex items-start gap-2 py-1.5">
                          {isToday ? (
                            <input
                              type="checkbox"
                              checked={done.has(r.id)}
                              onChange={() => toggle(r.id)}
                              aria-label={`Mark ${def.name} as measured`}
                              className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#4c8dff]"
                            />
                          ) : (
                            <span className="mt-1 h-4 w-4 shrink-0 rounded-full border border-space-600" aria-hidden />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <button
                                type="button"
                                onClick={() => onSelect?.(r.id)}
                                className={`text-left text-sm font-medium hover:text-accent-soft ${done.has(r.id) && isToday ? "text-muted line-through" : "text-ink"}`}
                              >
                                {def.name}
                              </button>
                              {flagged && a ? (
                                <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: STATUS_COLOR[a.status] }}>
                                  <StatusIcon status={a.status} size={11} />
                                  Flagged today
                                </span>
                              ) : null}
                              {!isToday ? (
                                <span className="text-[11px] text-faint">
                                  {r.slot === "auto" ? "No action needed" : `Next: day ${nextDue(r, day)}`}
                                </span>
                              ) : null}
                            </div>
                            <details className="group">
                              <summary className="cursor-pointer list-none text-xs text-muted hover:text-ink">
                                {r.when} <span className="text-accent-soft group-open:hidden">· how?</span>
                              </summary>
                              <ul className="mt-1 space-y-1">
                                {GUIDE[r.id].measure.map((l, i) => (
                                  <li key={i} className="text-xs leading-relaxed text-muted">
                                    {l.text} <SourceChips ids={l.sources} />
                                  </li>
                                ))}
                              </ul>
                            </details>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[11px] text-faint">
            Example schedule for this prototype, not a clinical protocol.
          </p>
        </div>

        {/* ---- Log today's measurements ---- */}
        <div className="rounded-xl border border-space-700 bg-space-850/60 p-3">
          <h3 className="font-semibold text-ink">Log today&apos;s measurements</h3>
          <p className="mt-0.5 text-xs text-muted">
            Type your own values (leave a field empty to skip it). They are checked with the same rule, against this example astronaut&apos;s baseline and previous days.
          </p>
          <form onSubmit={submit} noValidate className="mt-3 space-y-3">
            {FIELDS.filter((f) => f.id !== "mood").map((f) => (
              <div key={f.id}>
                <label htmlFor={`${uid}-${f.id}`} className="text-sm font-medium text-ink">
                  {f.label}
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    id={`${uid}-${f.id}`}
                    type="number"
                    inputMode="decimal"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={values[f.id]}
                    onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                    aria-invalid={errors[f.id] ? true : undefined}
                    aria-describedby={errors[f.id] ? `${uid}-${f.id}-err` : undefined}
                    className="w-32 rounded-lg border border-space-600 bg-space-950 px-3 py-2 font-mono text-ink placeholder:text-faint focus:border-accent"
                    placeholder={f.id === "hr" ? "62" : "7.0"}
                  />
                  <span className="text-sm text-muted">{f.unit}</span>
                </div>
                {errors[f.id] ? (
                  <p id={`${uid}-${f.id}-err`} className="mt-1 text-xs text-alert">
                    {errors[f.id]}
                  </p>
                ) : null}
              </div>
            ))}
            <fieldset>
              <legend className="text-sm font-medium text-ink">
                Mood <span className="font-normal text-muted">(1 = very low · 5 = very good)</span>
              </legend>
              <div className="mt-1 flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="cursor-pointer">
                    <input
                      type="radio"
                      name={`${uid}-mood`}
                      value={n}
                      checked={values.mood === String(n)}
                      onChange={() => setValues((v) => ({ ...v, mood: String(n) }))}
                      className="peer sr-only"
                    />
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-space-600 font-mono text-muted peer-checked:border-accent peer-checked:bg-accent peer-checked:font-bold peer-checked:text-space-950 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent-soft hover:text-ink">
                      {n}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-space-950 hover:brightness-110">
                Check against my baseline
              </button>
              <button type="button" onClick={fillSimulated} className="rounded-lg border border-space-600 px-3 py-2 text-sm text-muted hover:text-ink">
                Fill with today&apos;s simulated values
              </button>
              <button
                type="button"
                onClick={() => {
                  setValues({ hr: "", sleep: "", mood: "" });
                  setErrors({});
                  setResults(null);
                }}
                className="rounded-lg px-3 py-2 text-sm text-faint hover:text-ink"
              >
                Clear
              </button>
            </div>
          </form>

          <div aria-live="polite">
            {results ? (
              <ul className="mt-4 space-y-3">
                {results.map(({ field, value, a }) => {
                  const def = INDICATOR_BY_ID[field.id];
                  const ch = primaryChannel(def);
                  const band = a.channels[0]?.band;
                  const action = actionsFor(field.id, a.status)[0];
                  return (
                    <li key={field.id} className="rounded-lg border p-3" style={{ borderColor: `${STATUS_COLOR[a.status]}66` }}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">
                          {def.name}: <span className="font-mono">{fmt(value, ch.decimals)}</span> {field.unit}
                        </p>
                        <StatusPill status={a.status} />
                      </div>
                      {band && day > BASELINE_DAYS ? (
                        <p className="mt-1 text-xs text-muted">
                          Your baseline: {fmt(band.low, ch.decimals)}–{fmt(band.high, ch.decimals)} {field.unit}
                        </p>
                      ) : null}
                      <ul className="mt-1 space-y-0.5">
                        {explain(a).map((r, i) => (
                          <li key={i} className="text-xs text-ink">
                            {r.text} {r.sources.length > 0 ? <SourceChips ids={r.sources} /> : null}
                          </li>
                        ))}
                      </ul>
                      {action ? (
                        <p className="mt-2 text-xs leading-relaxed text-muted">
                          <span className="font-semibold text-ink">What to do now: </span>
                          {action.text} <SourceChips ids={action.sources} />
                        </p>
                      ) : null}
                      <button type="button" onClick={() => onSelect?.(field.id)} className="mt-2 text-xs font-semibold text-accent-soft hover:text-ink">
                        Open the full guidance →
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
          <p className="mt-3 text-[11px] text-faint">Nothing you type is stored or sent. Prototype — not a medical device.</p>
        </div>
      </div>
    </section>
  );
}
