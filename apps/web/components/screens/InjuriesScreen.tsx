"use client";
import { useEffect, useState } from "react";
import { getInjuries, toggleInjury, type InjuryEntry } from "@/lib/api";
import { Pill } from "../Pill";
import { HazardStrip } from "../HazardStrip";

export default function InjuriesScreen() {
  const [list, setList] = useState<InjuryEntry[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => getInjuries().then((r) => setList(r.injuries)).catch(() => setList([]));
  useEffect(() => { load(); }, []);

  async function flip(inj: InjuryEntry) {
    setBusy(inj.name);
    try {
      await toggleInjury(inj.name, !inj.active);
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (!list) return <p className="mono text-[10px] tracking-[0.16em] text-muted">// LOADING CONSTRAINTS…</p>;
  const anyActive = list.some((i) => i.active);
  const activeN = list.filter((i) => i.active).length;

  return (
    <div className="space-y-6">
      <header className="border-b border-line pb-5 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="industrial text-[10px] text-muted">CHART / OPERATIONAL CONSTRAINTS</p>
          <h2 className="display stencil text-[60px] leading-[0.92] text-fg mt-2">RX.</h2>
          <p className="text-[13px] text-muted italic mt-3 max-w-2xl leading-relaxed">
            "Each constraint affects only the movements that anatomically load the injured tissue. Toggle to apply swaps, reductions, and drops to today's session."
          </p>
        </div>
        <div className="border border-line2 px-3 py-2">
          <p className="industrial text-[9px] text-muted">ACTIVE / N</p>
          <p className="display-num text-[28px] num text-fg leading-none mt-1">
            {String(activeN).padStart(2, "0")}
            <span className="mono text-[10px] text-muted ml-1">/ {String(list.length).padStart(2, "0")}</span>
          </p>
        </div>
      </header>

      {anyActive && (
        <HazardStrip tone="flag" label="// PLAN MODIFIED — SEE TODAY" />
      )}

      <div className="space-y-4">
        {list.map((inj, idx) => (
          <article key={inj.name}
            className={`border bg-card relative ${inj.active ? "border-flag/60" : "border-line"}`}>
            {inj.active && <div className="absolute top-0 left-0 right-0 h-1.5 hazard-flag" />}
            <header className={`flex items-start justify-between gap-4 px-5 py-4 border-b border-line ${inj.active ? "pt-5" : ""}`}>
              <div className="min-w-0 flex items-baseline gap-3">
                <span className="mono text-[10px] tracking-[0.2em] text-line2">RX·{String(idx + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {inj.active && <span className="w-1.5 h-1.5 bg-flag" />}
                    <p className="font-semibold tracking-tightish text-[15px]">{inj.label}</p>
                  </div>
                  {inj.anatomy && <p className="mono text-[10px] tracking-[0.1em] text-muted mt-1 uppercase">{inj.anatomy}</p>}
                  <p className="text-[12.5px] text-fg/85 mt-1.5 italic max-w-2xl">"{inj.rule}"</p>
                </div>
              </div>
              <button onClick={() => flip(inj)} disabled={busy === inj.name}
                className={`shrink-0 px-3 py-1.5 mono text-[10px] uppercase tracking-[0.16em] border transition
                  ${inj.active
                    ? "border-flag bg-flag text-bg hover:opacity-90"
                    : "border-line text-muted hover:text-fg hover:border-mark hover:bg-mark/10"}
                  ${busy === inj.name ? "opacity-50" : ""}`}>
                {inj.active ? "● ACTIVE · DEACTIVATE" : "○ ACTIVATE"}
              </button>
            </header>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 px-5 py-4 text-[12px]">
              <Col title="SWAP" tone="warn" code="01" emptyShown={inj.swaps.length === 0}>
                {inj.swaps.map((s, i) => (
                  <li key={i}><span className="text-muted">{s.pattern}</span> <span className="text-line2">→</span> <span className="text-fg">{s.to}</span></li>
                ))}
              </Col>
              <Col title="REDUCE" tone="accent" code="02" emptyShown={inj.reduces.length === 0}>
                {inj.reduces.map((r, i) => (
                  <li key={i}><span className="text-fg">{r.pattern}</span> <span className="text-muted italic">— {r.note}</span></li>
                ))}
              </Col>
              <Col title="CUE" tone="warn" code="03" emptyShown={inj.cues.length === 0}>
                {inj.cues.map((c, i) => (
                  <li key={i}><span className="text-fg">{c.pattern}</span> <span className="text-muted italic">— {c.note}</span></li>
                ))}
              </Col>
              <Col title="DROP" tone="bad" code="04" emptyShown={inj.drops.length === 0}>
                {inj.drops.map((d, i) => (
                  <li key={i} className="text-fg">{d}</li>
                ))}
              </Col>
            </div>

            {inj.rehab.length > 0 && (
              <div className="px-5 py-3 border-t border-line bg-card2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="industrial text-[10px] text-fg">// REHAB · EVERY SESSION</span>
                  <Pill tone="muted">{inj.rehab.length} DRILLS</Pill>
                </div>
                <ul className="space-y-0.5 text-[12px] text-fg/90">
                  {inj.rehab.map((r, i) => (
                    <li key={i} className="flex gap-2.5 items-baseline">
                      <span className="mono text-[9px] text-line2 tracking-[0.18em]">{String(i + 1).padStart(2, "0")}</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>

      <p className="text-[11px] text-muted leading-relaxed italic border-t border-line pt-3">
        "REDUCE = keep the movement at lower load (sets−1, RIR+1) for active rehab.
        DROP = remove the line entirely. SWAPS preserve sets/reps."
      </p>
    </div>
  );
}

function Col({ title, tone, code, emptyShown, children }: {
  title: string; tone: "warn" | "accent" | "bad"; code: string;
  emptyShown: boolean; children: React.ReactNode;
}) {
  const cls = tone === "warn" ? "text-caution" : tone === "accent" ? "text-mark" : "text-flag";
  return (
    <div>
      <p className={`industrial text-[10px] mb-2 ${cls}`}>RX·{code} {title}</p>
      <ul className="space-y-1 leading-relaxed">
        {emptyShown ? <li className="mono text-[10px] tracking-[0.14em] text-line2">// NONE</li> : children}
      </ul>
    </div>
  );
}
