// Ten indicator tiles: value, status (icon + word) and days off baseline.
import { assessDay, formatValue } from "@/lib/assess";
import { HAZARDS, INDICATOR_BY_ID, STATUS_LABEL } from "@/lib/model";
import type { IndicatorId } from "@/lib/model";
import { STATUS_COLOR, StatusIcon } from "./ui";

interface Props {
  day: number;
  selected?: IndicatorId | null;
  onSelect?: (id: IndicatorId) => void;
  className?: string;
}

export function IndicatorList({ day, selected = null, onSelect, className = "" }: Props) {
  const items = assessDay(day);
  return (
    <ul className={`grid grid-cols-2 gap-2 ${className}`} aria-label={`Ten indicators on mission day ${day}`}>
      {items.map((a) => {
        const def = INDICATOR_BY_ID[a.id];
        const v = formatValue(def, day);
        const isSel = selected === a.id;
        const c = STATUS_COLOR[a.status];
        return (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onSelect?.(a.id)}
              aria-pressed={isSel}
              aria-label={`${def.name}: ${v.value} ${v.unit}, ${STATUS_LABEL[a.status]}`}
              className={`group relative w-full overflow-hidden rounded-xl border bg-space-900/80 px-3 py-2.5 text-left transition-colors hover:bg-space-850 ${
                isSel ? "border-accent-soft ring-1 ring-accent-soft" : "border-space-700"
              }`}
            >
              <span className="absolute inset-y-0 left-0 w-1" style={{ background: c, opacity: a.status === "normal" ? 0.55 : 1 }} aria-hidden />
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: HAZARDS[def.hazard].color }} aria-hidden />
                  {def.short}
                </span>
                <StatusIcon status={a.status} size={15} />
              </span>
              <span className="mt-1 block whitespace-nowrap font-mono text-lg font-semibold leading-6 text-ink">
                {v.value}
                <span className="ml-1 font-sans text-xs font-normal text-muted">{v.unit}</span>
              </span>
              <span className="block text-[11px] font-medium" style={{ color: c }}>
                {STATUS_LABEL[a.status]}
                {a.daysOutOfBand >= 2 ? ` · ${a.daysOutOfBand} days` : ""}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
