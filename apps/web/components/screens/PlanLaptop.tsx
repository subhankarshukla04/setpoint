"use client";
import { useEffect, useState } from "react";
import {
  getProgrammeToday, getRecentPicks,
  type ProgrammeToday, type ProgrammeWorkoutEx,
} from "@/lib/api";
import PreSessionCard from "../PreSessionCard";
import CyclingCard from "../CyclingCard";
import WorkoutPicker from "../WorkoutPicker";
import { Pill, Dot } from "../Pill";

type Pick = { day: string; workout_id: string; picked_at: string };

export default function PlanLaptop() {
  const [prog, setProg] = useState<ProgrammeToday | null>(null);
  const [history, setHistory] = useState<Pick[]>([]);

  const refresh = () => {
    getProgrammeToday().then(setProg).catch(() => {});
    getRecentPicks(14).then((r) => setHistory(r.picks)).catch(() => {});
  };
  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (!prog) return <p className="mono text-[11px] tracking-[0.16em] text-muted">// LOADING…</p>;

  const labelById: Record<string, string> = Object.fromEntries(
    prog.templates.map((t) => [t.id, t.label]),
  );

  return (
    <div className="space-y-8">
      <header className="border-b border-line pb-5 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <p className="industrial text-[10px] text-muted">FILE / PROGRAMME</p>
          <h2 className="display stencil text-[60px] leading-[0.92] text-fg mt-2">PLAN.</h2>
          <p className="mono text-[11px] text-muted mt-3 tracking-[0.14em]">
            "PICK TODAY'S SPECIMEN. TAP AGAIN TO CLEAR."
          </p>
        </div>
        <div className="flex items-center gap-2 mono text-[10px] tracking-[0.14em]">
          <Pill tone="muted">PHASE {prog.phase}</Pill>
          <Pill tone="muted">WK {String(prog.week_of_cut).padStart(2, "0")}/12</Pill>
          {prog.injuries.length > 0 && (
            <Pill tone="bad">{prog.injuries.length} INJURY ACTIVE</Pill>
          )}
        </div>
      </header>

      <WorkoutPicker
        templates={prog.templates}
        selectedId={prog.selected_workout_id}
        onUpdate={(next) => { setProg(next); getRecentPicks(14).then((r) => setHistory(r.picks)); }}
      />

      {prog.cardio && prog.cardio.next_best.length > 0 && (
        <CyclingCard todayWindow={prog.cardio.today_window} nextBest={prog.cardio.next_best} />
      )}

      {prog.user_picked && (
        <section className="border border-line bg-card">
          <header className="flex items-baseline justify-between px-5 py-4 border-b border-line">
            <div>
              <span className="industrial text-[10px] text-fg">// SESSION SPEC SHEET</span>
              <p className="display stencil text-[24px] uppercase tracking-tighter3 mt-1.5">{prog.workout.workout}</p>
            </div>
            <p className="mono text-[10px] text-muted tracking-[0.14em] text-right num">
              {prog.day_type.toUpperCase()}<br />
              {prog.targets.kcal} KCAL · P{prog.targets.protein_g} · C{prog.targets.carb_g} · F{prog.targets.fat_g}
            </p>
          </header>

          <div className="p-5 space-y-5">
            {prog.pre_session && <PreSessionCard pre={prog.pre_session} />}
            {prog.warmup && <PreSessionCard pre={prog.warmup} />}

            {prog.workout.exercises.length === 0 ? (
              <p className="text-[13px] text-muted italic">"{prog.workout.notes ?? "REST."}"</p>
            ) : (
              <div>
                <p className="industrial text-[10px] text-fg mb-3">// WORKING SETS</p>
                <ul className="text-[13px] divide-y divide-line border-y border-line">
                  {prog.workout.exercises.map((e, i) => <ExRow key={i} e={e} idx={i} />)}
                </ul>
                {prog.workout.notes && (
                  <p className="text-[11px] text-muted italic mt-3">"{prog.workout.notes}"</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="border border-line bg-card">
          <header className="px-5 py-2.5 border-b border-line flex items-baseline justify-between">
            <span className="industrial text-[10px] text-fg">// LOG BOOK · RECENT PICKS</span>
            <span className="mono text-[9px] tracking-[0.16em] text-muted num">N={String(history.length).padStart(2, "0")}</span>
          </header>
          <ul className="text-[13px] divide-y divide-line">
            {history.slice(0, 14).map((p, i) => (
              <li key={p.day} className="px-5 py-2 flex justify-between items-center">
                <span className="flex items-baseline gap-3">
                  <span className="mono text-[9px] text-line2 tracking-[0.18em]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="mono text-[11px] text-muted tracking-[0.1em] num">{p.day}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Dot tone={p.workout_id === "rest" ? "warn" : "accent"} />
                  <span className="mono text-[11px] tracking-[0.12em] uppercase">{labelById[p.workout_id] ?? p.workout_id}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ExRow({ e, idx }: { e: ProgrammeWorkoutEx; idx: number }) {
  return (
    <li className={`py-3 px-1 flex justify-between gap-4 ${e._dropped ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex items-baseline gap-3">
        <span className="mono text-[9.5px] text-line2 tracking-[0.18em] mt-0.5">{String(idx + 1).padStart(2, "0")}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {e.superset && <Pill tone="muted">SS·{e.superset}</Pill>}
            <p className={`font-medium tracking-tightish ${e._dropped ? "line-through" : ""}`}>{e.name}</p>
            {e._swapped_from && <Pill tone="warn">SWAP</Pill>}
            {e._reduced && <Pill tone="accent">RDX</Pill>}
            {e._cued && <Pill tone="warn">CUE</Pill>}
            {e._dropped && <Pill tone="bad">DROP</Pill>}
          </div>
          {e._swapped_from && <p className="text-[11px] text-muted mt-1 truncate italic">from {e._swapped_from} · {e._swapped_by}</p>}
          {e._reduced && <p className="text-[11px] text-muted mt-1 truncate italic">{e._reduce_note} · {e._reduced_by}</p>}
          {e._cued && <p className="text-[11px] text-muted mt-1 truncate italic">{e._cue_note} · {e._cued_by}</p>}
          {e._dropped && <p className="text-[11px] text-muted mt-1 italic">{e._dropped_by}</p>}
          {!e._dropped && e.cue && !e._swapped_from && !e._reduced && !e._cued && (
            <p className="text-[11px] text-muted mt-1 truncate italic">{e.cue}</p>
          )}
        </div>
      </div>
      <span className="mono text-[10.5px] text-muted whitespace-nowrap num self-center tracking-[0.1em]">
        {e.sets} × {e.reps} · RIR {e.rir}{e.rest_sec ? ` · ${e.rest_sec}S` : ""}
      </span>
    </li>
  );
}
