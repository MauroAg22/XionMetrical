// Clickable 2D human figure (faceless, flat). Each zone shows the worst
// traffic-light status of its indicators, with a shape + word label so the
// state never depends on color alone. Pure: everything derives from `day`.
import type { KeyboardEvent } from "react";
import { zoneStatus } from "@/lib/assess";
import { INDICATORS, STATUS_LABEL, ZONES } from "@/lib/model";
import type { IndicatorId, Status, ZoneId } from "@/lib/model";
import { assessDay } from "@/lib/assess";
import { STATUS_COLOR, StatusIcon } from "./ui";

interface Props {
  day: number;
  selectedZone?: ZoneId | null;
  onSelect?: (id: IndicatorId, zone: ZoneId) => void;
  className?: string;
}

const LABELS: Record<ZoneId, { x: number; y: number; ax: number; ay: number; anchor: "start" | "end" }> = {
  brain: { x: 92, y: 40, ax: 160, ay: 52, anchor: "end" },
  airway: { x: 92, y: 132, ax: 152, ay: 150, anchor: "end" },
  blood: { x: 92, y: 236, ax: 104, ay: 252, anchor: "end" },
  body: { x: 92, y: 440, ax: 150, ay: 440, anchor: "end" },
  heart: { x: 270, y: 132, ax: 206, ay: 164, anchor: "start" },
  abdomen: { x: 270, y: 222, ax: 208, ay: 228, anchor: "start" },
  muscle: { x: 270, y: 330, ax: 216, ay: 340, anchor: "start" },
};

const SHORT: Record<ZoneId, string> = {
  brain: "Brain",
  airway: "Lungs",
  blood: "Blood",
  body: "Whole body",
  heart: "Heart",
  abdomen: "Digestion",
  muscle: "Muscles",
};

/** Worst indicator of a zone (ties: catalogue order). */
export function leadIndicator(zone: ZoneId, day: number): IndicatorId {
  const rank: Record<Status, number> = { normal: 0, drift: 1, alert: 2 };
  const list = assessDay(day).filter((a) => INDICATORS.find((d) => d.id === a.id)?.zone === zone);
  return list.reduce((best, a) => (rank[a.status] > rank[best.status] ? a : best), list[0]).id;
}

export function BodyFigure({ day, selectedZone = null, onSelect, className = "" }: Props) {
  const zs = zoneStatus(day);
  const interactive = !!onSelect;

  const zoneProps = (zone: ZoneId) => {
    const label = `${ZONES[zone].name}: ${STATUS_LABEL[zs[zone]]}`;
    if (!interactive) return { "aria-label": label };
    return {
      role: "button",
      tabIndex: 0,
      "aria-label": `${label}. Show details`,
      "aria-pressed": selectedZone === zone,
      onClick: () => onSelect?.(leadIndicator(zone, day), zone),
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(leadIndicator(zone, day), zone);
        }
      },
      style: { cursor: "pointer" },
    } as const;
  };

  const fillFor = (zone: ZoneId) => STATUS_COLOR[zs[zone]];
  const sel = (zone: ZoneId) => (selectedZone === zone ? { stroke: "#ffffff", strokeWidth: 2.5 } : { stroke: fillFor(zone), strokeWidth: 1.5 });
  const op = (zone: ZoneId) => (zs[zone] === "normal" ? 0.42 : 0.78);

  return (
    <svg viewBox="-12 0 384 540" className={`h-auto w-full select-none ${className}`} role="group" aria-label={`Body map for mission day ${day} (simulated data)`}>
      <defs>
        <filter id="xm-glow" x="-30%" y="-10%" width="160%" height="120%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={fillFor("body")} floodOpacity={zs.body === "normal" ? 0.35 : 0.85} />
        </filter>
        <linearGradient id="xm-suit" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#22376a" />
          <stop offset="1" stopColor="#152447" />
        </linearGradient>
      </defs>

      {/* whole body = the silhouette itself */}
      <g {...zoneProps("body")} filter="url(#xm-glow)">
        <g stroke="url(#xm-suit)" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M126 124 L106 210 L98 290" strokeWidth="26" />
          <path d="M234 124 L254 210 L262 290" strokeWidth="26" />
          <path d="M160 276 L156 392 L152 498" strokeWidth="34" />
          <path d="M200 276 L204 392 L208 498" strokeWidth="34" />
        </g>
        <circle cx="98" cy="300" r="13" fill="#1d3060" />
        <circle cx="262" cy="300" r="13" fill="#1d3060" />
        <ellipse cx="148" cy="512" rx="21" ry="10" fill="#1d3060" />
        <ellipse cx="212" cy="512" rx="21" ry="10" fill="#1d3060" />
        <path d="M128 110 Q180 98 232 110 L238 142 Q232 212 222 272 Q180 290 138 272 Q128 212 122 142 Z" fill="url(#xm-suit)" />
        <rect x="168" y="86" width="24" height="20" rx="8" fill="#1d3060" />
        <circle cx="180" cy="56" r="34" fill="url(#xm-suit)" />
        {selectedZone === "body" && (
          <path d="M128 110 Q180 98 232 110 L238 142 Q232 212 222 272 Q180 290 138 272 Q128 212 122 142 Z" fill="none" stroke="#fff" strokeWidth="2" />
        )}
      </g>

      {/* brain */}
      <g {...zoneProps("brain")}>
        <path d="M178.5 33 C167 29 156 37 156.5 48 C154.5 59 162 69 172 68.5 C175 70.5 178 70 178.5 68 Z" fill={fillFor("brain")} fillOpacity={op("brain")} {...sel("brain")} />
        <path d="M181.5 33 C193 29 204 37 203.5 48 C205.5 59 198 69 188 68.5 C185 70.5 182 70 181.5 68 Z" fill={fillFor("brain")} fillOpacity={op("brain")} {...sel("brain")} />
      </g>

      {/* lungs / airway */}
      <g {...zoneProps("airway")}>
        <ellipse cx="160" cy="154" rx="16" ry="30" fill={fillFor("airway")} fillOpacity={op("airway")} {...sel("airway")} />
        <ellipse cx="200" cy="154" rx="16" ry="30" fill={fillFor("airway")} fillOpacity={op("airway")} {...sel("airway")} />
        <path d="M180 118 V136 M180 136 L168 146 M180 136 L192 146" stroke={fillFor("airway")} strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* heart */}
      <g {...zoneProps("heart")}>
        <path
          d="M196 182 C186 174 180 168 180 160 C180 153 186 149 191 151 C194 152 196 155 196 155 C196 155 198 152 201 151 C206 149 212 153 212 160 C212 168 206 174 196 182 Z"
          fill={fillFor("heart")}
          fillOpacity={zs.heart === "normal" ? 0.6 : 0.95}
          {...sel("heart")}
        />
      </g>

      {/* abdomen */}
      <g {...zoneProps("abdomen")}>
        <ellipse cx="180" cy="228" rx="30" ry="26" fill={fillFor("abdomen")} fillOpacity={op("abdomen")} {...sel("abdomen")} />
      </g>

      {/* muscles: upper arms and thighs */}
      <g {...zoneProps("muscle")}>
        <ellipse cx="116" cy="168" rx="10" ry="30" transform="rotate(14 116 168)" fill={fillFor("muscle")} fillOpacity={op("muscle")} {...sel("muscle")} />
        <ellipse cx="244" cy="168" rx="10" ry="30" transform="rotate(-14 244 168)" fill={fillFor("muscle")} fillOpacity={op("muscle")} {...sel("muscle")} />
        <ellipse cx="158" cy="340" rx="14" ry="42" fill={fillFor("muscle")} fillOpacity={op("muscle")} {...sel("muscle")} />
        <ellipse cx="202" cy="340" rx="14" ry="42" fill={fillFor("muscle")} fillOpacity={op("muscle")} {...sel("muscle")} />
      </g>

      {/* blood (fingertip sample) */}
      <g {...zoneProps("blood")}>
        <path d="M104 238 C104 238 94 250 94 256 C94 262 98 266 104 266 C110 266 114 262 114 256 C114 250 104 238 104 238 Z" fill={fillFor("blood")} fillOpacity={zs.blood === "normal" ? 0.6 : 0.95} {...sel("blood")} />
      </g>

      {/* labels with leader lines */}
      {(Object.keys(LABELS) as ZoneId[]).map((z) => {
        const L = LABELS[z];
        const st = zs[z];
        const textX = L.anchor === "end" ? L.x - 20 : L.x + 20;
        return (
          <g key={z} {...zoneProps(z)} aria-hidden={interactive ? undefined : true}>
            <line x1={L.anchor === "end" ? L.x + 2 : L.x - 2} y1={L.y} x2={L.ax} y2={L.ay} stroke="#7d8fb0" strokeOpacity="0.5" />
            <g transform={`translate(${L.anchor === "end" ? L.x - 14 : L.x}, ${L.y - 7})`}>
              <StatusIcon status={st} size={14} />
            </g>
            <text x={textX} y={L.y + 4} textAnchor={L.anchor} fontSize="13" fontWeight={selectedZone === z ? 700 : 500} fill={selectedZone === z ? "#ffffff" : "#c9d5ea"}>
              {SHORT[z]}
            </text>
            <text x={textX} y={L.y + 19} textAnchor={L.anchor} fontSize="11" fill={STATUS_COLOR[st]}>
              {STATUS_LABEL[st]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
