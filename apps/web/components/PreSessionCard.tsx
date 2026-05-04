"use client";
import type { PreSession } from "@/lib/api";

const KIND_STYLE: Record<PreSession["kind"], { ring: string; chip: string; chipText: string }> = {
  rehab:     { ring: "border-bad/50 bg-bad/5",       chip: "bg-bad/20",    chipText: "text-bad" },
  rehab_day: { ring: "border-bad/60 bg-bad/10",      chip: "bg-bad/25",    chipText: "text-bad" },
  warmup:    { ring: "border-accent/40 bg-accent/5", chip: "bg-accent/20", chipText: "text-accent" },
  z2:        { ring: "border-line bg-card",          chip: "bg-line",      chipText: "text-muted" },
};

const KIND_LABEL: Record<PreSession["kind"], string> = {
  rehab: "REHAB",
  rehab_day: "REHAB DAY",
  warmup: "WARMUP",
  z2: "RECOVERY",
};

export default function PreSessionCard({ pre }: { pre: PreSession }) {
  if (!pre) return null;
  const s = KIND_STYLE[pre.kind];

  return (
    <section className={`rounded-2xl border p-4 ${s.ring}`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium">{pre.title}</p>
          {pre.subtitle && <p className="text-xs text-muted truncate">{pre.subtitle}</p>}
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide ${s.chip} ${s.chipText}`}>
          {KIND_LABEL[pre.kind]}
        </span>
      </div>

      {pre.sections?.length ? (
        <div className="mt-4 space-y-4">
          {pre.sections.map((sec, i) => (
            <div key={i}>
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <p className="text-xs uppercase tracking-wide text-fg/90 font-medium">{sec.section}</p>
                {sec.duration && (
                  <span className="text-[10px] text-muted">{sec.duration}</span>
                )}
              </div>
              {sec.rationale && (
                <p className="text-[11px] text-muted italic mt-0.5">{sec.rationale}</p>
              )}
              <ul className="mt-1.5 space-y-1 text-sm">
                {sec.items.map((it, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="text-muted">·</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="mt-3 space-y-1 text-sm">
          {pre.items.map((it, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted">·</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
