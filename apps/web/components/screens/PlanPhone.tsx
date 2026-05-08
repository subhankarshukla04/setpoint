"use client";
import { useEffect, useState } from "react";
import {
  getProgrammeToday, getRecentPicks,
  type ProgrammeToday,
} from "@/lib/api";
import CyclingCard from "../CyclingCard";
import WorkoutPicker from "../WorkoutPicker";
import { Pill, Dot } from "../Pill";

type Pick = { day: string; workout_id: string; picked_at: string };

export default function PlanPhone() {
  const [prog, setProg] = useState<ProgrammeToday | null>(null);
  const [history, setHistory] = useState<Pick[]>([]);

  const refresh = () => {
    getProgrammeToday().then(setProg).catch(() => {});
    getRecentPicks(7).then((r) => setHistory(r.picks)).catch(() => {});
  };
  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (!prog) return <p className="mono text-[10px] tracking-[0.16em] text-muted">// LOADING…</p>;

  const labelById: Record<string, string> = Object.fromEntries(
    prog.templates.map((t) => [t.id, t.label]),
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-baseline border-b border-line pb-2">
        <span className="industrial text-[10px] text-fg">// PROGRAMME</span>
        <span className="mono text-[9px] text-muted tracking-[0.14em] num">
          PH {prog.phase} · WK {String(prog.week_of_cut).padStart(2, "0")}/12
          {prog.injuries.length > 0 && <span className="text-flag"> · MOD</span>}
        </span>
      </div>

      <WorkoutPicker
        templates={prog.templates}
        selectedId={prog.selected_workout_id}
        onUpdate={(next) => { setProg(next); getRecentPicks(7).then((r) => setHistory(r.picks)); }}
      />

      {prog.cardio && prog.cardio.next_best.length > 0 && (
        <CyclingCard todayWindow={prog.cardio.today_window} nextBest={prog.cardio.next_best} compact />
      )}

      {prog.user_picked && (
        <section className="border border-line bg-card">
          <header className="px-4 py-3 border-b border-line flex items-baseline justify-between">
            <p className="text-sm font-medium tracking-tightish">{prog.workout.workout}</p>
            <span className="mono text-[9px] text-muted tracking-[0.14em] num">
              {prog.targets.kcal} KCAL · {prog.targets.protein_g}P
            </span>
          </header>
          <div className="px-4 py-3 space-y-3">
            {prog.pre_session && (
              <div>
                <p className="industrial text-[9px] text-flag/85">{prog.pre_session.title.toUpperCase()}</p>
                <ul className="mt-1 space-y-0.5 text-xs text-fg/90">
                  {prog.pre_session.items.map((it, i) => <li key={i} className="leading-tight">{it}</li>)}
                </ul>
              </div>
            )}
            {prog.warmup && (
              <div>
                <p className="industrial text-[9px] text-mark">{prog.warmup.title.toUpperCase()}</p>
                <ul className="mt-1 space-y-0.5 text-xs text-fg/90">
                  {prog.warmup.items.map((it, i) => <li key={i} className="leading-tight">{it}</li>)}
                </ul>
              </div>
            )}
            {prog.workout.exercises.length > 0 && (
              <div>
                <p className="industrial text-[9px] text-fg">// WORKING SETS</p>
                <ul className="mt-1 space-y-1.5 text-xs">
                  {prog.workout.exercises.map((e, i) => (
                    <li key={i} className={e._dropped ? "opacity-60" : ""}>
                      <div className="flex justify-between gap-2">
                        <span className="min-w-0 flex items-center gap-1.5 flex-wrap">
                          <span className="mono text-[9px] text-line2 tracking-[0.18em]">{String(i + 1).padStart(2, "0")}</span>
                          {e.superset && <Pill tone="muted">SS·{e.superset}</Pill>}
                          <span className={`tracking-tightish truncate ${e._dropped ? "line-through" : ""}`}>{e.name}</span>
                          {e._swapped_from && <Pill tone="warn">SWAP</Pill>}
                          {e._reduced && <Pill tone="accent">RDX</Pill>}
                          {e._cued && <Pill tone="warn">CUE</Pill>}
                          {e._dropped && <Pill tone="bad">DROP</Pill>}
                        </span>
                        <span className="text-muted shrink-0 num mono text-[10px] tracking-[0.1em]">{e.sets}×{e.reps} R{e.rir}</span>
                      </div>
                      {e._swapped_from && <p className="text-[10px] text-muted mt-0.5 italic">from {e._swapped_from}</p>}
                      {e._reduced && <p className="text-[10px] text-muted mt-0.5 italic">{e._reduce_note}</p>}
                      {e._cued && <p className="text-[10px] text-muted mt-0.5 italic">{e._cue_note}</p>}
                      {e._dropped && <p className="text-[10px] text-muted mt-0.5 italic">{e._dropped_by}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="border border-line bg-card">
          <header className="px-3 py-2 border-b border-line">
            <span className="industrial text-[9px] text-fg">// LOG BOOK</span>
          </header>
          <ul className="text-xs divide-y divide-line">
            {history.slice(0, 7).map((p, i) => (
              <li key={p.day} className="px-3 py-1.5 flex justify-between items-center">
                <span className="flex items-baseline gap-2">
                  <span className="mono text-[9px] text-line2 tracking-[0.18em]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="mono text-[10px] text-muted num tracking-[0.1em]">{p.day}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Dot tone={p.workout_id === "rest" ? "warn" : "accent"} />
                  <span className="mono text-[10px] tracking-[0.12em] uppercase">{labelById[p.workout_id] ?? p.workout_id}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
