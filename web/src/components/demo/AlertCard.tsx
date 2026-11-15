// Early-warning card: the yellow/red indicators of the selected day.
import { activeAlerts } from "@/lib/assess";
import { BASELINE_DAYS, INDICATORS, STATUS_LABEL } from "@/lib/model";
import type { IndicatorId } from "@/lib/model";
import { STATUS_COLOR, StatusIcon } from "./ui";

interface Props {
  day: number;
  onSelect?: (id: IndicatorId) => void;
  className?: string;
}

export function AlertCard({ day, onSelect, className = "" }: Props) {
  const alerts = activeAlerts(day);
  if (alerts.length === 0) {
    const building = day <= BASELINE_DAYS;
    return (
      <section
        aria-live="polite"
        className={`flex items-start gap-3 rounded-2xl border bg-space-900/85 px-4 py-3 ${className}`}
        style={{ borderColor: building ? "var(--color-space-600)" : "var(--color-ok)" }}
      >
        <StatusIcon status="normal" size={20} />
        <div>
          <p className="font-semibold text-ink">
            {building ? `Building your personal baseline · day ${day} of ${BASELINE_DAYS}` : `All ${INDICATORS.length} indicators within your baseline and reference limits`}
          </p>
          <p className="text-sm text-muted">
            {building
              ? "After day 30 each value is compared with you, not with an average person. Published limits apply from day 1."
              : "No early warning today. Keep measuring at the same time each day."}
          </p>
        </div>
      </section>
    );
  }
  const worst = alerts[0].status;
  const n = alerts.length;
  const title =
    worst === "alert"
      ? `Act now · ${n} indicator${n > 1 ? "s need" : " needs"} attention`
      : `Early warning · ${n} indicator${n > 1 ? "s" : ""} drifting from your baseline`;
  return (
    <section
      aria-live="polite"
      aria-label="Early warning"
      className={`rounded-2xl border-2 bg-space-900/90 px-4 py-3 ${className}`}
      style={{ borderColor: STATUS_COLOR[worst], boxShadow: `0 0 0 4px color-mix(in srgb, ${STATUS_COLOR[worst]} 14%, transparent)` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold" style={{ color: STATUS_COLOR[worst] }}>
          <StatusIcon status={worst} size={20} />
          {title}
        </p>
        <p className="text-xs text-muted">Flagged on board · no need to wait for Earth (up to 20 min each way)</p>
      </div>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {alerts.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onSelect?.(a.id)}
              className="flex w-full items-center gap-2 rounded-lg bg-space-850 px-3 py-2 text-left text-sm text-ink hover:bg-space-800"
            >
              <StatusIcon status={a.status} size={15} title={STATUS_LABEL[a.status]} />
              <span>{a.headline}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
