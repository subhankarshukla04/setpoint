"use client";
import type { PreSession } from "@/lib/api";

const KIND_STYLE: Record<PreSession["kind"], { rail: string; label: string }> = {
  rehab:     { rail: "bg-flag",    label: "text-flag" },
  rehab_day: { rail: "bg-flag",    label: "text-flag" },
  warmup:    { rail: "bg-mark",    label: "text-mark" },
  z2:        { rail: "bg-line2",   label: "text-muted" },
};

const KIND_LABEL: Record<PreSession["kind"], string> = {
  rehab: "RX · REHAB",
  rehab_day: "RX · REHAB DAY",
  warmup: "WARM-UP",
  z2: "RECOVERY · Z2",
};

export default function PreSessionCard({ pre }: { pre: PreSession }) {
  if (!pre) return null;
  const s = KIND_STYLE[pre.kind];

  return (
    <section className="border border-line bg-card relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.rail}`} />
      <header className="flex items-baseline justify-between px-5 py-3 border-b border-line">
        <div className="min-w-0">
          <p className={`industrial text-[10px] ${s.label}`}>// {KIND_LABEL[pre.kind]}</p>
          <p className="text-[14px] font-semibold tracking-tightish mt-1">{pre.title}</p>
          {pre.subtitle && <p className="text-[11px] text-muted truncate mt-0.5 italic">"{pre.subtitle}"</p>}
        </div>
      </header>

      <div className="px-5 py-4">
        {pre.sections?.length ? (
          <div className="space-y-4">
            {pre.sections.map((sec, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <p className="industrial text-[10px] text-fg">// {sec.section.toUpperCase()}</p>
                  {sec.duration && (
                    <span className="mono text-[10px] text-muted num tracking-[0.14em]">{sec.duration.toUpperCase()}</span>
                  )}
                </div>
                {sec.rationale && (
                  <p className="text-[11.5px] text-muted italic mt-1 leading-relaxed">"{sec.rationale}"</p>
                )}
                <ul className="mt-2 space-y-1 text-[13px] leading-relaxed">
                  {sec.items.map((it, j) => (
                    <li key={j} className="flex gap-2.5 items-baseline">
                      <span className="mono text-[9px] text-line2 tracking-[0.18em]">{String(j + 1).padStart(2, "0")}</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-1 text-[13px]">
            {pre.items.map((it, i) => (
              <li key={i} className="flex gap-2.5 items-baseline">
                <span className="mono text-[9px] text-line2 tracking-[0.18em]">{String(i + 1).padStart(2, "0")}</span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
