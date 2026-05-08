"use client";
import { useEffect, useState } from "react";
import {
  getToday, getWeights, getReadiness, getProgrammeToday,
  type DaySummary, type WeightEma, type ReadinessScore, type ProgrammeToday,
} from "@/lib/api";
import PreSessionCard from "../PreSessionCard";
import CyclingCard from "../CyclingCard";
import WorkoutPicker from "../WorkoutPicker";
import { Pill, Dot } from "../Pill";
import { HazardStrip } from "../HazardStrip";

export default function TodayLaptop() {
  const [day, setDay] = useState<DaySummary | null>(null);
  const [ema, setEma] = useState<WeightEma | null>(null);
  const [ready, setReady] = useState<ReadinessScore | null>(null);
  const [prog, setProg] = useState<ProgrammeToday | null>(null);

  useEffect(() => {
    Promise.all([
      getToday().catch(() => null),
      getWeights().catch(() => null),
      getReadiness().catch(() => null),
      getProgrammeToday().catch(() => null),
    ]).then(([d, w, r, p]) => {
      if (d) setDay(d); if (w) setEma(w.ema); if (r) setReady(r.score); if (p) setProg(p);
    });
  }, []);

  const m = day?.macros;
  const t = prog?.targets;
  const tone: "accent" | "warn" | "bad" =
    ready?.level === "red" ? "bad" : ready?.level === "amber" ? "warn" : "accent";
  const proteinPct = m && t ? Math.min(100, Math.round((m.protein_g / t.protein_g) * 100)) : 0;
  const kcalPct    = m && t ? Math.min(100, Math.round((m.kcal / t.kcal) * 100)) : 0;
  const emaDelta   = ema?.ema != null && ema.current != null ? ema.current - ema.ema : null;

  return (
    <div className="space-y-8">
      {/* Constraint banner */}
      {prog && prog.injuries.length > 0 && (
        <div>
          <HazardStrip tone="flag" label={`// ACTIVE CONSTRAINT — N=${prog.injuries.length} · SESSION MODIFIED`} />
        </div>
      )}

      {/* Top stamp row */}
      <header className="flex items-end justify-between gap-6 border-b border-line pb-5">
        <div>
          <p className="industrial text-[10px] text-muted">FILE / DAILY</p>
          <h2 className="display stencil text-[60px] leading-[0.92] text-fg mt-2">TODAY.</h2>
          <p className="mono text-[11px] text-muted mt-3 tracking-[0.14em] num">
            {day?.day ?? "—"}
            {prog && <> <span className="text-line2">·</span> PHASE {prog.phase} <span className="text-line2">·</span> WEEK {String(prog.week_of_cut).padStart(2, "0")}/12</>}
          </p>
        </div>
        <div className="flex items-end gap-2">
          {prog && <Pill tone={prog.is_training_day ? "accent" : "warn"}>{prog.day_type}</Pill>}
          {prog?.user_picked && <Pill tone="muted">{prog.workout.workout}</Pill>}
        </div>
      </header>

      {/* Hero numeric: weight EMA */}
      <section className="grid grid-cols-12 gap-6 border-b border-line pb-8">
        <div className="col-span-7">
          <p className="industrial text-[10px] text-muted">MASS / 14D EMA</p>
          <div className="flex items-end gap-3 mt-2">
            <span className="display-num text-[112px] leading-[0.85] text-fg">
              {ema?.ema != null ? ema.ema.toFixed(1) : "—"}
            </span>
            <span className="mono text-[16px] text-muted pb-3">KG</span>
          </div>
          <div className="flex gap-6 mt-3 mono text-[10px] tracking-[0.14em] text-muted">
            <span>↳ TODAY <span className="text-fg num">{ema?.current != null ? `${ema.current.toFixed(1)} KG` : "—"}</span></span>
            <span>↳ N <span className="text-fg num">{ema?.n ?? 0}</span></span>
            {emaDelta != null && (
              <span>
                ↳ Δ <span className={`num ${emaDelta < 0 ? "text-mark" : emaDelta > 0 ? "text-flag" : "text-fg"}`}>
                  {emaDelta > 0 ? "+" : ""}{emaDelta.toFixed(2)} KG
                </span>
              </span>
            )}
          </div>
        </div>
        <div className="col-span-5 border-l border-line pl-6 flex flex-col justify-end">
          <p className="industrial text-[10px] text-muted">READINESS</p>
          <div className="flex items-center gap-2 mt-2">
            <Dot tone={tone} />
            <span className="display stencil text-[40px] uppercase leading-none text-fg">
              {ready?.level ?? "—"}
            </span>
          </div>
          <p className="mono text-[10px] tracking-[0.12em] text-muted mt-3 leading-relaxed">
            {ready?.reason ?? "// NO DATA"}
          </p>
          {ready?.rule && (
            <p className="text-[12px] text-fg/85 italic mt-2">"{ready.rule}"</p>
          )}
        </div>
      </section>

      {/* Spec strip — protein / kcal / sets */}
      <section className="grid grid-cols-3 gap-0 border border-line">
        <Spec label="PROTEIN"
          value={m ? m.protein_g.toFixed(0) : "—"}
          unit={t ? `/ ${t.protein_g}G` : ""}
          pct={proteinPct} />
        <Spec label="KCAL"
          value={m ? m.kcal.toFixed(0) : "—"}
          unit={t ? `/ ${t.kcal}` : ""}
          pct={kcalPct}
          divider />
        <Spec label="SETS · TODAY"
          value={String(day?.sets.length ?? 0).padStart(2, "0")}
          unit=""
          pct={null}
          last={day?.sets.length ? day.sets.slice(-1)[0].exercise : "// NONE"}
          divider />
      </section>

      {prog && (
        <WorkoutPicker
          templates={prog.templates}
          selectedId={prog.selected_workout_id}
          onUpdate={setProg}
        />
      )}

      {prog?.user_picked && prog.pre_session && <PreSessionCard pre={prog.pre_session} />}
      {prog?.user_picked && prog.warmup && <PreSessionCard pre={prog.warmup} />}
      {prog?.cardio && (
        <CyclingCard todayWindow={prog.cardio.today_window} nextBest={prog.cardio.next_best} />
      )}

      {prog?.user_picked && (
        <section className="border border-line bg-card">
          <header className="flex items-baseline justify-between px-5 py-3 border-b border-line">
            <span className="industrial text-[10px] text-fg">// SESSION · DIELINE</span>
            <span className="mono text-[11px] tracking-[0.14em] text-muted">{prog.workout.workout.toUpperCase()}</span>
          </header>
          {prog.workout.exercises.length === 0 ? (
            <p className="text-[13px] text-muted px-5 py-4 italic">{prog.workout.notes ?? "// REST DAY"}</p>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-5 py-2 text-left industrial text-[9px] text-muted w-10">LN</th>
                  <th className="px-2 py-2 text-left industrial text-[9px] text-muted">EXERCISE</th>
                  <th className="px-2 py-2 text-right industrial text-[9px] text-muted">SETS</th>
                  <th className="px-2 py-2 text-right industrial text-[9px] text-muted">REPS</th>
                  <th className="px-2 py-2 text-right industrial text-[9px] text-muted">RIR</th>
                  <th className="px-5 py-2 text-right industrial text-[9px] text-muted">REST</th>
                </tr>
              </thead>
              <tbody>
                {prog.workout.exercises.map((e, i) => (
                  <tr key={`${e.name}-${i}`} className={`border-b border-line ${e._dropped ? "opacity-50" : ""}`}>
                    <td className="px-5 py-2.5 mono text-[10px] tracking-[0.14em] text-muted">{String(i + 1).padStart(2, "0")}</td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {e.superset && <Pill tone="muted">SS·{e.superset}</Pill>}
                        <span className={`tracking-tightish ${e._dropped ? "line-through" : ""}`}>{e.name}</span>
                        {e._swapped_from && <Pill tone="warn">SWAP</Pill>}
                        {e._reduced && <Pill tone="accent">RDX</Pill>}
                        {e._cued && <Pill tone="warn">CUE</Pill>}
                        {e._dropped && <Pill tone="bad">DROP</Pill>}
                      </div>
                      {(e._swapped_from || e._reduced || e._cued || e._dropped || (e.cue && !e._dropped)) && (
                        <p className="text-[11px] text-muted italic mt-1 truncate">
                          {e._swapped_from ? `from ${e._swapped_from} · ${e._swapped_by}` :
                           e._reduced ? `${e._reduce_note} · ${e._reduced_by}` :
                           e._cued ? `${e._cue_note} · ${e._cued_by}` :
                           e._dropped ? e._dropped_by ?? "" :
                           e.cue ?? ""}
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-right num text-fg">{e.sets}</td>
                    <td className="px-2 py-2.5 text-right num text-fg">{e.reps}</td>
                    <td className="px-2 py-2.5 text-right num text-fg">{e.rir}</td>
                    <td className="px-5 py-2.5 text-right num text-muted">{e.rest_sec ? `${e.rest_sec}s` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {prog.workout.notes && prog.workout.exercises.length > 0 && (
            <p className="text-[11px] text-muted italic px-5 py-3 border-t border-line">"{prog.workout.notes}"</p>
          )}
        </section>
      )}

      <SimpleList title="// LOGGED SETS · TODAY"
        empty="// NO SETS — USE INPUT TAB"
        rows={day?.sets.map((s) => ({
          left: s.exercise,
          right: `${s.weight_kg} KG × ${s.reps}${s.rir != null ? ` · RIR ${s.rir}` : ""}`,
        })) ?? []} />

      <SimpleList title="// MEALS · TODAY"
        empty="// NO MEALS"
        rows={day?.meals.map((mm) => ({
          left: `${mm.name} · ${mm.grams.toFixed(0)}G`,
          right: `${mm.kcal_total.toFixed(0)} KCAL · P${mm.protein_total.toFixed(0)}`,
        })) ?? []} />
    </div>
  );
}

function Spec({ label, value, unit, pct, divider, last }: {
  label: string; value: string; unit: string;
  pct: number | null; divider?: boolean; last?: string;
}) {
  return (
    <div className={`p-5 ${divider ? "border-l border-line" : ""}`}>
      <p className="industrial text-[10px] text-muted">{label}</p>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="display-num text-[40px] leading-none text-fg">{value}</span>
        {unit && <span className="mono text-[11px] text-muted">{unit}</span>}
      </p>
      {pct != null && (
        <div className="mt-3 h-px bg-line">
          <div className="h-full bg-mark" style={{ width: `${pct}%` }} />
        </div>
      )}
      {pct != null && (
        <p className="mono text-[9.5px] tracking-[0.16em] text-muted mt-1 num">{pct}%</p>
      )}
      {last && (
        <p className="mono text-[10px] tracking-[0.14em] text-muted mt-3 truncate">{last.toUpperCase()}</p>
      )}
    </div>
  );
}

function SimpleList({ title, empty, rows }: {
  title: string; empty: string; rows: { left: string; right: string }[];
}) {
  return (
    <section className="border border-line bg-card">
      <header className="px-5 py-2.5 border-b border-line flex items-baseline justify-between">
        <span className="industrial text-[10px] text-fg">{title}</span>
        <span className="mono text-[9px] text-muted tracking-[0.16em]">N={String(rows.length).padStart(2, "0")}</span>
      </header>
      {rows.length === 0 ? (
        <p className="text-[12px] text-muted px-5 py-3 italic">{empty}</p>
      ) : (
        <ul className="divide-y divide-line text-[13px]">
          {rows.map((r, i) => (
            <li key={i} className="px-5 py-2 flex justify-between gap-4">
              <span className="flex items-baseline gap-3 min-w-0">
                <span className="mono text-[9.5px] text-line2 tracking-[0.18em]">{String(i + 1).padStart(2, "0")}</span>
                <span className="tracking-tightish truncate">{r.left}</span>
              </span>
              <span className="text-muted text-[11px] num self-center">{r.right}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
