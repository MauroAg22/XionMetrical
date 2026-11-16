// Shared, pure UI pieces for the demo (also used by the video scenes).
// Status is never shown by color alone: every state has a shape + a word.
import { HAZARDS, STATUS_LABEL } from "@/lib/model";
import type { HazardId, Status } from "@/lib/model";
import { SOURCES } from "@/lib/sources";
import type { SourceId } from "@/lib/sources";

export const STATUS_COLOR: Record<Status, string> = {
  normal: "var(--color-ok)",
  drift: "var(--color-drift)",
  alert: "var(--color-alert)",
};

/** Circle + check (normal), triangle + ! (drifting), octagon + ! (act now). */
export function StatusIcon({ status, size = 16, title }: { status: Status; size?: number; title?: string }) {
  const c = STATUS_COLOR[status];
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden={title ? undefined : true} role={title ? "img" : undefined} className="shrink-0">
      {title ? <title>{title}</title> : null}
      {status === "normal" && (
        <>
          <circle cx="10" cy="10" r="8.5" fill={c} />
          <path d="M6 10.3l2.6 2.6L14.2 7.4" stroke="#04140b" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {status === "drift" && (
        <>
          <path d="M10 1.8L19 17.6H1z" fill={c} strokeLinejoin="round" />
          <rect x="9" y="7" width="2" height="5.6" rx="1" fill="#1f1400" />
          <circle cx="10" cy="15" r="1.2" fill="#1f1400" />
        </>
      )}
      {status === "alert" && (
        <>
          <path d="M6.3 1.5h7.4l5.3 5.3v7.4l-5.3 5.3H6.3L1 14.2V6.8z" fill={c} />
          <rect x="9" y="5.2" width="2" height="6.6" rx="1" fill="#2a0303" />
          <circle cx="10" cy="14.6" r="1.25" fill="#2a0303" />
        </>
      )}
    </svg>
  );
}

export function StatusPill({ status, className = "" }: { status: Status; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
      style={{ borderColor: STATUS_COLOR[status], color: STATUS_COLOR[status] }}
    >
      <StatusIcon status={status} size={13} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function HazardTag({ hazard }: { hazard: HazardId }) {
  const h = HAZARDS[hazard];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[2px] bg-space-800 px-2 py-0.5 text-[11px] font-medium font-display tracking-[0.04em] text-muted">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: h.color }} aria-hidden />
      {h.name}
    </span>
  );
}

/** Inline source citations. An empty list is shown explicitly. */
export function SourceChips({ ids, className = "" }: { ids: SourceId[]; className?: string }) {
  if (ids.length === 0) {
    return <span className={`text-[11px] italic text-faint ${className}`}>No published source</span>;
  }
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {ids.map((id) => {
        const s = SOURCES[id];
        const cls =
          "inline-flex items-center rounded border border-space-600 bg-space-850 px-1.5 py-px text-[11px] leading-4 text-accent-soft";
        return s.url ? (
          <a key={id} href={s.url} target="_blank" rel="noreferrer" className={`${cls} hover:border-accent hover:text-ink`} title={`${s.org} — ${s.title}`}>
            {s.short}
          </a>
        ) : (
          <span key={id} className={`${cls} text-muted`} title={s.title}>
            {s.short}
          </span>
        );
      })}
    </span>
  );
}

export function SimulatedBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-space-600 bg-space-850 px-2.5 py-0.5 text-[11px] font-medium text-muted ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
      Prototype · simulated data
    </span>
  );
}
