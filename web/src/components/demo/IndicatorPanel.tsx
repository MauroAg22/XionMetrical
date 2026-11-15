// Indicator panel: value of the day, personal baseline band, published
// reference with its source, trend chart and the 4-layer guide.
import { assessmentOf, baselineBand, fmt, formatValue } from "@/lib/assess";
import { BASELINE_DAYS, INDICATOR_BY_ID, ZONES } from "@/lib/model";
import type { IndicatorId } from "@/lib/model";
import { simulate } from "@/lib/simulate";
import { actionsFor, GUIDE } from "@/lib/guide";
import type { Line } from "@/lib/guide";
import { TrendChart } from "./TrendChart";
import { HazardTag, SourceChips, STATUS_COLOR, StatusIcon, StatusPill } from "./ui";

interface Props {
  id: IndicatorId;
  day: number;
  showChart?: boolean;
  showGuide?: boolean;
  chartWindow?: number;
  className?: string;
}

function baselineText(id: IndicatorId, day: number): string {
  const def = INDICATOR_BY_ID[id];
  if (id === "strength") return "Pre-flight baseline = 100% (measured before launch)";
  if (id === "radiation" || id === "co2") return "No personal band: compared with NASA limits";
  if (day <= BASELINE_DAYS) return `Building your baseline: day ${day} of ${BASELINE_DAYS}`;
  const parts = def.channels
    .filter((c) => c.baselineBand)
    .map((c) => {
      const b = baselineBand(id, c);
      if (!b) return "";
      const label = def.channels.length > 1 ? `${c.label} ` : "";
      return `${label}${fmt(b.low, c.decimals)}–${fmt(b.high, c.decimals)} ${c.unit}`;
    });
  return `${parts.join(" · ")} (mean ± 1.5 SD of days 1–${BASELINE_DAYS})`;
}

function extraText(id: IndicatorId, day: number): string | null {
  const v = simulate(day);
  if (id === "radiation") return `Today ≈ ${fmt(v.radiation.daily, 2)} mSv · ${fmt((v.radiation.msv / 600) * 100, 0)}% of the 600 mSv career limit`;
  if (id === "co2") return `7-day average: ${fmt(v.co2.avg7, 1)} mmHg (NASA: below 2.5)`;
  if (id === "nutrition") return `Body mass: ${fmt(v.nutrition.kg, 1)} kg · reference intake 3,035 kcal/day`;
  if (id === "bp") return "Systolic / diastolic";
  return null;
}

export function IndicatorPanel({ id, day, showChart = true, showGuide = true, chartWindow = 60, className = "" }: Props) {
  const def = INDICATOR_BY_ID[id];
  const a = assessmentOf(id, day);
  const v = formatValue(def, day);
  const extra = extraText(id, day);
  const flagged = a.reasons.filter((r) => r.status !== "normal");

  return (
    <section
      id="indicator-panel"
      aria-labelledby={`panel-${id}`}
      className={`rounded-2xl border border-space-700 bg-space-900/85 p-4 sm:p-5 ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <HazardTag hazard={def.hazard} />
            <span className="text-[11px] uppercase tracking-wide text-faint">{ZONES[def.zone].name}</span>
          </div>
          <h2 id={`panel-${id}`} className="mt-2 text-xl font-semibold text-ink">
            {def.name}
          </h2>
          <p className="text-xs text-faint">Mission day {day} · simulated data</p>
        </div>
        <div className="text-right">
          <div className="whitespace-nowrap font-mono text-3xl font-bold text-ink">
            {v.value}
            <span className="ml-1 font-sans text-base font-normal text-muted">{v.unit}</span>
          </div>
          {extra && id === "bp" ? <div className="text-[11px] text-faint">{extra}</div> : null}
          <StatusPill status={a.status} className="mt-1.5" />
        </div>
      </header>

      {flagged.length > 0 && (
        <ul className="mt-3 space-y-1.5" aria-label="Why this status">
          {flagged.map((r, i) => (
            <li
              key={i}
              className="flex flex-wrap items-center gap-2 rounded-lg border bg-space-850 px-3 py-2 text-sm"
              style={{ borderColor: STATUS_COLOR[r.status] }}
            >
              <StatusIcon status={r.status} size={15} />
              <span className="font-medium text-ink">{r.text}</span>
              {r.sources.length > 0 && <SourceChips ids={r.sources} />}
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-space-850 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-accent-soft">Your baseline</dt>
          <dd className="mt-1 text-ink">{baselineText(id, day)}</dd>
          {extra && id !== "bp" ? <dd className="mt-1 text-xs text-muted">{extra}</dd> : null}
        </div>
        <div className="rounded-lg bg-space-850 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-accent-soft">
            Reference {def.referenceKind === "general" ? "(general health, adults on Earth)" : def.referenceKind === "nasa" ? "(NASA)" : "(baseline only)"}
          </dt>
          <dd className="mt-1 text-ink">{def.reference.text}</dd>
          <dd className="mt-1.5">
            <SourceChips ids={def.reference.sources} />
          </dd>
        </div>
      </dl>

      {showChart && (
        <figure className="mt-4">
          <TrendChart id={id} day={day} windowDays={chartWindow} />
          <figcaption className="mt-1 text-[11px] text-faint">
            Last {chartWindow} days · blue band = your baseline · dashed = published limit · dots = drifting / act-now days · simulated data
          </figcaption>
        </figure>
      )}

      {showGuide && <GuideLayers id={id} day={day} className="mt-5" />}
    </section>
  );
}

function Lines({ lines }: { lines: Line[] }) {
  return (
    <ul className="space-y-2">
      {lines.map((l, i) => (
        <li key={i} className="text-sm leading-relaxed text-ink">
          <span>{l.text}</span> <SourceChips ids={l.sources} className="ml-0.5 align-middle" />
        </li>
      ))}
    </ul>
  );
}

export function GuideLayers({ id, day, className = "" }: { id: IndicatorId; day: number; className?: string }) {
  const g = GUIDE[id];
  const a = assessmentOf(id, day);
  const layers: { k: string; title: string; body: React.ReactNode }[] = [
    {
      k: "a",
      title: "Status and why it matters",
      body: (
        <>
          <p className="mb-2 flex items-start gap-2 text-sm font-medium" style={{ color: STATUS_COLOR[a.status] }}>
            <StatusIcon status={a.status} size={15} />
            <span>{a.headline}.</span>
          </p>
          <Lines lines={g.why} />
        </>
      ),
    },
    { k: "b", title: "What to do now", body: <Lines lines={actionsFor(id, a.status)} /> },
    {
      k: "c",
      title: "When to escalate",
      body: (
        <>
          <Lines lines={g.escalate} />
          <p className="mt-2 text-xs text-muted">Earth is up to 20 minutes away, one way: act on board first, then report.</p>
        </>
      ),
    },
    { k: "d", title: "How to measure", body: <Lines lines={g.measure} /> },
  ];
  return (
    <section aria-label="Guidance in four layers" className={className}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-accent-soft">Guidance · every line cites its source</h3>
      <ol className="mt-2 grid gap-2.5">
        {layers.map((l) => (
          <li key={l.k} className="rounded-xl border border-space-700 bg-space-850/70 p-3">
            <h4 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-space-700 text-[11px] text-accent-soft">{l.k}</span>
              {l.title}
            </h4>
            {l.body}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[11px] text-faint">
        Educational prototype, not a medical device: no diagnosis, no medication. Guidance written by the team from the cited sources; XionMetrical rule = our own traffic-light design.
      </p>
    </section>
  );
}
