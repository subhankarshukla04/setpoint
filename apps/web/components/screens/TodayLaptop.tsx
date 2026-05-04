"use client";
import { useEffect, useState } from "react";
import {
  getToday, getWeights, getReadiness, getProgrammeToday,
  type DaySummary, type WeightEma, type ReadinessScore, type ProgrammeToday,
} from "@/lib/api";
import PreSessionCard from "../PreSessionCard";
import CyclingCard from "../CyclingCard";

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
  const dot = ready?.level === "red" ? "bg-bad" : ready?.level === "amber" ? "bg-warn" : "bg-accent";
  const dayBadge = prog?.is_training_day ? "bg-accent/15 text-accent" : "bg-warn/15 text-warn";

  return (
    <div className="max-w-5xl space-y-6">
      <header className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Today</h2>
          <p className="text-sm text-muted">
            {day?.day ?? "—"} · cut · target {t?.kcal ?? "—"} kcal · {t?.protein_g ?? "—"}g protein
          </p>
        </div>
        {prog && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Phase {prog.phase}</span>
            <span className="text-xs text-muted">· wk {prog.week_of_cut}/12</span>
            <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wide ${dayBadge}`}>
              {prog.day_type}
            </span>
          </div>
        )}
      </header>

      {prog && prog.injuries.length > 0 && (
        <div className="rounded-2xl border border-bad/40 bg-bad/10 p-4 space-y-1">
          {prog.injuries.map((i) => (
            <p key={i.name} className="text-sm">
              <span className="text-bad font-medium">⚠ {i.label}</span>
              <span className="text-muted"> · {i.rule}</span>
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            <p className="text-xs uppercase tracking-wide text-muted">Readiness</p>
          </div>
          <p className="text-2xl font-semibold capitalize mt-1">{ready?.level ?? "—"}</p>
          <p className="text-xs text-muted mt-1 line-clamp-2">{ready?.reason ?? "no data"}</p>
        </div>
        <Card title="Weight (14d EMA)"
          big={ema?.ema != null ? `${ema.ema.toFixed(1)} kg` : "—"}
          sub={ema?.current != null ? `today ${ema.current.toFixed(1)} kg · ${ema.n} entries` : "no entries"} />
        <Card title="Macros"
          big={`${(m?.protein_g ?? 0).toFixed(0)} / ${t?.protein_g ?? "—"}g P`}
          sub={`${(m?.kcal ?? 0).toFixed(0)} / ${t?.kcal ?? "—"} kcal · C ${(m?.carb_g ?? 0).toFixed(0)}/${t?.carb_g ?? "—"} · F ${(m?.fat_g ?? 0).toFixed(0)}/${t?.fat_g ?? "—"}`} />
        <Card title="Sets logged"
          big={String(day?.sets.length ?? 0)}
          sub={day?.sets.length ? day.sets.slice(-1)[0].exercise : "none yet"} />
      </div>

      {prog?.pre_session && <PreSessionCard pre={prog.pre_session} />}
      {prog?.warmup && <PreSessionCard pre={prog.warmup} />}
      {prog?.cardio && (
        <CyclingCard todayWindow={prog.cardio.today_window} nextBest={prog.cardio.next_best} />
      )}

      {prog && (
        <section className="bg-card rounded-2xl p-5">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-xs uppercase tracking-wide text-muted">Today's session</p>
            <p className="text-sm font-medium">{prog.workout.workout}</p>
          </div>
          {prog.workout.exercises.length === 0 ? (
            <p className="text-sm text-muted">{prog.workout.notes ?? "Rest day."}</p>
          ) : (
            <ul className="text-sm divide-y divide-line">
              {prog.workout.exercises.map((e, i) => (
                <li key={`${e.name}-${i}`} className={`py-2 flex justify-between gap-4 ${e._dropped ? "opacity-50" : ""}`}>
                  <div className="min-w-0">
                    <p className={`font-medium truncate ${e._dropped ? "line-through" : ""}`}>
                      {e.superset && <span className="text-[10px] mr-2 px-1.5 py-0.5 rounded bg-line text-muted">SS-{e.superset}</span>}
                      {e.name}
                    </p>
                    {e._swapped_from && (
                      <p className="text-xs text-warn truncate">↻ swapped from {e._swapped_from} ({e._swapped_by})</p>
                    )}
                    {e._reduced && (
                      <p className="text-xs text-accent truncate">↓ reduced — {e._reduce_note} ({e._reduced_by})</p>
                    )}
                    {e._cued && (
                      <p className="text-xs text-warn truncate">⚠ {e._cue_note} ({e._cued_by})</p>
                    )}
                    {e._dropped && (
                      <p className="text-xs text-bad">🚫 dropped — {e._dropped_by}</p>
                    )}
                    {!e._dropped && e.cue && <p className="text-xs text-muted truncate">{e.cue}</p>}
                  </div>
                  <span className="text-muted whitespace-nowrap text-xs">
                    {e.sets} × {e.reps} · RIR {e.rir}{e.rest_sec ? ` · ${e.rest_sec}s` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {prog.workout.notes && prog.workout.exercises.length > 0 && (
            <p className="text-xs text-muted mt-3 italic">{prog.workout.notes}</p>
          )}
        </section>
      )}

      <section className="bg-card rounded-2xl p-5">
        <p className="text-xs uppercase tracking-wide text-muted mb-3">Today's sets</p>
        {day && day.sets.length > 0 ? (
          <ul className="text-sm divide-y divide-line">
            {day.sets.map((s) => (
              <li key={s.id} className="py-2 flex justify-between">
                <span>{s.exercise}</span>
                <span className="text-muted">{s.weight_kg}kg × {s.reps}{s.rir != null ? ` · RIR ${s.rir}` : ""}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">No sets logged. Use the Log tab.</p>}
      </section>

      <section className="bg-card rounded-2xl p-5">
        <p className="text-xs uppercase tracking-wide text-muted mb-3">Today's meals</p>
        {day && day.meals.length > 0 ? (
          <ul className="text-sm divide-y divide-line">
            {day.meals.map((meal) => (
              <li key={meal.id} className="py-2 flex justify-between">
                <span>{meal.name} <span className="text-muted">· {meal.grams.toFixed(0)}g</span></span>
                <span className="text-muted">{meal.kcal_total.toFixed(0)} kcal · P {meal.protein_total.toFixed(0)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">No meals logged.</p>}
      </section>
    </div>
  );
}

function Card({ title, big, sub }: { title: string; big: string; sub: string }) {
  return (
    <div className="bg-card rounded-2xl p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{title}</p>
      <p className="text-2xl font-semibold mt-1">{big}</p>
      <p className="text-xs text-muted mt-1">{sub}</p>
    </div>
  );
}
