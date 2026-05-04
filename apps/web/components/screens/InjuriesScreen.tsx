"use client";
import { useEffect, useState } from "react";
import { getInjuries, toggleInjury, type InjuryEntry } from "@/lib/api";

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

  if (!list) return <p className="text-sm text-muted">Loading injuries…</p>;
  const anyActive = list.some((i) => i.active);

  return (
    <div className="max-w-3xl space-y-5">
      <header>
        <h2 className="text-2xl font-semibold">Injuries</h2>
        <p className="text-sm text-muted">
          Each injury affects only the movements that anatomically load the injured tissue.
          Toggle to apply <span className="text-warn">swaps</span>,{" "}
          <span className="text-accent">reductions</span>, and{" "}
          <span className="text-bad">drops</span> to today's session.
          Toggle off to restore the original plan.
        </p>
      </header>

      {anyActive && (
        <div className="rounded-2xl border border-warn/40 bg-warn/10 p-3 text-xs text-fg/90">
          Plan is currently <span className="text-warn font-medium">modified</span> — see Today.
        </div>
      )}

      <div className="space-y-3">
        {list.map((inj) => (
          <article key={inj.name}
            className={`rounded-2xl p-4 border ${inj.active ? "border-bad/50 bg-bad/5" : "border-line bg-card"}`}>
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{inj.label}</p>
                {inj.anatomy && <p className="text-[11px] text-muted mt-0.5">{inj.anatomy}</p>}
                <p className="text-xs text-fg/80 mt-1">{inj.rule}</p>
              </div>
              <button onClick={() => flip(inj)} disabled={busy === inj.name}
                className={`shrink-0 px-3 py-1.5 text-xs rounded-full border transition
                  ${inj.active
                    ? "border-bad/60 bg-bad/20 text-bad"
                    : "border-line text-muted hover:text-fg"}
                  ${busy === inj.name ? "opacity-50" : ""}`}>
                {inj.active ? "ACTIVE — turn off" : "off — activate"}
              </button>
            </header>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-1 mt-4 text-xs">
              <Col title="Swap (HIGH)" tone="warn">
                {inj.swaps.length ? inj.swaps.map((s, i) => (
                  <li key={i}><span className="text-muted">{s.pattern}</span> → <span className="text-fg">{s.to}</span></li>
                )) : <Empty />}
              </Col>
              <Col title="Reduce (MED)" tone="accent">
                {inj.reduces.length ? inj.reduces.map((r, i) => (
                  <li key={i}><span className="text-fg">{r.pattern}</span> <span className="text-muted">— {r.note}</span></li>
                )) : <Empty />}
              </Col>
              <Col title="Cue (LOW)" tone="warn">
                {inj.cues.length ? inj.cues.map((c, i) => (
                  <li key={i}><span className="text-fg">{c.pattern}</span> <span className="text-muted">— {c.note}</span></li>
                )) : <Empty />}
              </Col>
              <Col title="Drop" tone="bad">
                {inj.drops.length ? inj.drops.map((d, i) => (
                  <li key={i} className="text-fg">{d}</li>
                )) : <Empty />}
              </Col>
            </div>

            {inj.rehab.length > 0 && (
              <div className="mt-4 pt-3 border-t border-line text-xs">
                <p className="uppercase text-muted tracking-wide mb-1">Rehab — add to every session</p>
                <ul className="space-y-0.5 text-fg/90">
                  {inj.rehab.map((r, i) => <li key={i}>· {r}</li>)}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>

      <p className="text-xs text-muted">
        Reduce = keep the movement at lower load (sets−1, RIR+1) for active rehab.
        Drop = remove the line entirely. Swaps preserve sets/reps.
      </p>
    </div>
  );
}

function Col({ title, tone, children }: { title: string; tone: "warn" | "accent" | "bad"; children: React.ReactNode }) {
  const cls = tone === "warn" ? "text-warn" : tone === "accent" ? "text-accent" : "text-bad";
  return (
    <div>
      <p className={`uppercase tracking-wide mb-1 ${cls}`}>{title}</p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function Empty() {
  return <li className="text-muted">—</li>;
}
