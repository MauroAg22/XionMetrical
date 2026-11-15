// Pure SVG trend chart (no chart library: deterministic for the video render).
// Shows the personal baseline band, nearby published limits and the
// day-by-day values; non-normal days are marked with their status color.
import { assessmentOf, baselineBand, fmt } from "@/lib/assess";
import { INDICATOR_BY_ID, primaryChannel } from "@/lib/model";
import type { ChannelDef, IndicatorId, Threshold } from "@/lib/model";
import { series } from "@/lib/simulate";
import { STATUS_COLOR } from "./ui";

const W = 600;
const H = 230;
const M = { l: 46, r: 92, t: 14, b: 28 };

interface Props {
  id: IndicatorId;
  day: number;
  windowDays?: number;
  className?: string;
}

interface Line {
  y: number;
  label: string;
  kind: "warn" | "alert";
}

export function TrendChart({ id, day, windowDays = 60, className = "" }: Props) {
  const def = INDICATOR_BY_ID[id];
  const prim = primaryChannel(def);
  const chans: ChannelDef[] = def.channels.filter((c) => c.unit === prim.unit);
  const start = Math.max(1, day - windowDays + 1);
  const end = Math.max(day, windowDays);
  const days: number[] = [];
  for (let d = start; d <= day; d++) days.push(d);

  const data = chans.map((c) => ({ ch: c, vals: series(id, c.key).slice(start - 1, day), band: baselineBand(id, c) }));
  const allVals = data.flatMap((d) => d.vals);
  let lo = Math.min(...allVals);
  let hi = Math.max(...allVals);
  for (const d of data) if (d.band) { lo = Math.min(lo, d.band.low); hi = Math.max(hi, d.band.high); }
  const span = Math.max(hi - lo, 1e-6);

  // Thresholds: always for limit-based channels (no personal band); for band
  // channels only when they are close to the data (keeps the chart readable).
  const lines: Line[] = [];
  // Band channels: only the side the latest value leans to, and only if near.
  const consider = (t: Threshold | undefined, kind: "warn" | "alert", band: boolean, sideOk: boolean) => {
    if (!t) return;
    const near = t.value >= lo - span && t.value <= hi + span;
    if (!band || (near && sideOk)) lines.push({ y: t.value, label: kind === "alert" ? "Limit" : "Caution", kind });
  };
  for (const d of data) {
    const b = !!d.band;
    const up = d.band ? d.vals[d.vals.length - 1] >= d.band.mean : true;
    consider(d.ch.alertAbove, "alert", b, up);
    consider(d.ch.warnAbove, "warn", b, up);
    consider(d.ch.alertBelow, "alert", b, !up);
    consider(d.ch.warnBelow, "warn", b, !up);
  }
  for (const l of lines) { lo = Math.min(lo, l.y); hi = Math.max(hi, l.y); }
  if (id === "radiation") lo = 0;
  const pad = (hi - lo) * 0.08 || 1;
  const y0 = lo - pad;
  const y1 = hi + pad;

  const x = (d: number) => M.l + ((d - start) / Math.max(1, end - start)) * (W - M.l - M.r);
  const y = (v: number) => M.t + (1 - (v - y0) / (y1 - y0)) * (H - M.t - M.b);
  const dec = prim.decimals;

  // y ticks
  const ticks: number[] = [];
  const step = niceStep((y1 - y0) / 4);
  for (let v = Math.ceil(y0 / step) * step; v <= y1; v += step) ticks.push(v);
  const tickDec = step < 1 ? (step < 0.1 ? 2 : 1) : 0;

  // x ticks every 10 days (or 30 for long windows)
  const xStep = end - start > 90 ? 30 : 10;
  const xticks: number[] = [];
  for (let d = Math.ceil(start / xStep) * xStep; d <= end; d += xStep) xticks.push(d);

  const label = `${def.name}: days ${start}–${day}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`h-auto w-full ${className}`} role="img" aria-label={`Trend chart. ${label}`}>
      <title>{`Trend chart. ${label} (simulated data)`}</title>
      <rect x={M.l} y={M.t} width={W - M.l - M.r} height={H - M.t - M.b} fill="#071022" rx="6" />
      {ticks.map((v) => (
        <g key={`t${v}`}>
          <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke="#17284f" strokeWidth="1" />
          <text x={M.l - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#7d8fb0">
            {fmt(v, tickDec)}
          </text>
        </g>
      ))}
      {xticks.map((d) => (
        <text key={`x${d}`} x={x(d)} y={H - 8} textAnchor="middle" fontSize="11" fill="#7d8fb0">
          {`Day ${d}`}
        </text>
      ))}

      {/* personal baseline bands */}
      {data.map((d, i) =>
        d.band ? (
          <g key={`b${d.ch.key}`}>
            <rect
              x={M.l}
              width={W - M.l - M.r}
              y={y(d.band.high)}
              height={Math.max(1, y(d.band.low) - y(d.band.high))}
              fill="#4c8dff"
              opacity={i === 0 ? 0.16 : 0.09}
            />
            <line x1={M.l} x2={W - M.r} y1={y(d.band.mean)} y2={y(d.band.mean)} stroke="#4c8dff" strokeOpacity="0.45" strokeDasharray="2 4" />
            {i === 0 && (
              <text x={W - M.r + 6} y={y(d.band.mean) + 4} fontSize="11" fill="#8db8ff">
                Your baseline
              </text>
            )}
          </g>
        ) : null,
      )}

      {/* published limits */}
      {lines.map((l, i) => (
        <g key={`l${i}`}>
          <line
            x1={M.l}
            x2={W - M.r}
            y1={y(l.y)}
            y2={y(l.y)}
            stroke={l.kind === "alert" ? STATUS_COLOR.alert : STATUS_COLOR.drift}
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <text x={W - M.r + 6} y={y(l.y) + 4} fontSize="11" fill={l.kind === "alert" ? STATUS_COLOR.alert : STATUS_COLOR.drift}>
            {`${l.label} ${fmt(l.y, l.y % 1 ? 1 : 0)}`}
          </text>
        </g>
      ))}

      {/* series */}
      {data.map((d, i) => (
        <polyline
          key={`s${d.ch.key}`}
          points={d.vals.map((v, k) => `${x(days[k]).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}
          fill="none"
          stroke={i === 0 ? "#e8eef9" : "#8db8ff"}
          strokeOpacity={i === 0 ? 0.95 : 0.7}
          strokeWidth={i === 0 ? 2 : 1.5}
          strokeLinejoin="round"
        />
      ))}

      {/* status markers on non-normal days */}
      {days.map((d, k) => {
        const st = assessmentOf(id, d).status;
        if (st === "normal") return null;
        return <circle key={`p${d}`} cx={x(d)} cy={y(data[0].vals[k])} r="3.4" fill={STATUS_COLOR[st]} />;
      })}

      {/* today */}
      <line x1={x(day)} x2={x(day)} y1={M.t} y2={H - M.b} stroke="#e8eef9" strokeOpacity="0.35" />
      <circle cx={x(day)} cy={y(data[0].vals[data[0].vals.length - 1])} r="5" fill={STATUS_COLOR[assessmentOf(id, day).status]} stroke="#040914" strokeWidth="2" />
      <text x={Math.min(x(day), W - M.r - 4)} y={M.t + 12} textAnchor="end" fontSize="11" fill="#e8eef9">
        {`${fmt(data[0].vals[data[0].vals.length - 1], dec)} ${prim.unit}`}
      </text>
      {chans.length > 1 && (
        <text x={M.l + 6} y={M.t + 12} fontSize="11" fill="#a9b8d3">
          {chans.map((c) => c.label).join(" (white) · ")} (blue)
        </text>
      )}
    </svg>
  );
}

function niceStep(raw: number): number {
  const p = 10 ** Math.floor(Math.log10(raw));
  const n = raw / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return m * p;
}
