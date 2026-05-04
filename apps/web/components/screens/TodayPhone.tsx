"use client";
import { useEffect, useState } from "react";
import {
  getToday, getWeights, getReadiness, getProgrammeToday,
  type DaySummary, type WeightEma, type ReadinessScore, type ProgrammeToday,
} from "@/lib/api";
import PreSessionCard from "../PreSessionCard";
import CyclingCard from "../CyclingCard";

export default function TodayPhone() {
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
    <div className="space-y-4">
      {prog && (
        <section className="bg-card rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{prog.workout.workout}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide ${dayBadge}`}>
              {prog.day_type}
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Phase {prog.phase} · wk {prog.week_of_cut}/12 · target {t?.kcal} kcal · {t?.protein_g}g P
          </p>
          {prog.injuries.length > 0 && (
            <p className="text-xs text-bad mt-2">⚠ {prog.injuries[0].rule}</p>
          )}
        </section>
      )}

      {prog?.pre_session && <PreSessionCard pre={prog.pre_session} />}
      {prog?.warmup && <PreSessionCard pre={prog.warmup} />}
      {prog?.cardio && (
        <CyclingCard todayWindow={prog.cardio.today_window} nextBest={prog.cardio.next_best} compact />
      )}

      <section className="bg-card rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
          <p className="text-xs uppercase tracking-wide text-muted">Readiness</p>
        </div>
        <p className="text-2xl font-semibold capitalize mt-1">{ready?.level ?? "—"}</p>
        <p className="text-xs text-muted mt-1">{ready?.reason ?? "log on the Log → Ready tab"}</p>
        {ready?.rule && <p className="text-xs text-fg/80 mt-1">→ {ready.rule}</p>}
      </section>

      <section className="bg-card rounded-2xl p-4">
        <p className="text-xs uppercase tracking-wide text-muted">Weight (14d EMA)</p>
        <p className="text-2xl font-semibold mt-1">{ema?.ema != null ? `${ema.ema.toFixed(1)} kg` : "—"}</p>
        <p className="text-xs text-muted mt-1">
          {ema?.current != null ? `today ${ema.current.toFixed(1)} kg · ${ema.n} entries` : "log your morning weight"}
        </p>
      </section>

      <section className="bg-card rounded-2xl p-4">
        <p className="text-xs uppercase tracking-wide text-muted mb-2">Macros</p>
        <Bar label="Protein" v={m?.protein_g ?? 0} t={t?.protein_g ?? 170} />
        <Bar label="Carbs" v={m?.carb_g ?? 0} t={t?.carb_g ?? 220} />
        <Bar label="Fat" v={m?.fat_g ?? 0} t={t?.fat_g ?? 55} />
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-muted">kcal</span>
          <span>{(m?.kcal ?? 0).toFixed(0)} / {t?.kcal ?? "—"}</span>
        </div>
      </section>

      <section className="bg-card rounded-2xl p-4">
        <p className="text-xs uppercase tracking-wide text-muted mb-2">Today's sets ({day?.sets.length ?? 0})</p>
        {day && day.sets.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {day.sets.slice(-5).map((s) => (
              <li key={s.id} className="flex justify-between">
                <span>{s.exercise}</span>
                <span className="text-muted">{s.weight_kg}×{s.reps}{s.rir != null ? ` · RIR ${s.rir}` : ""}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">No sets logged yet.</p>}
      </section>
    </div>
  );
}

function Bar({ label, v, t }: { label: string; v: number; t: number }) {
  const pct = Math.min(100, (v / t) * 100);
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted">{label}</span>
        <span>{v.toFixed(0)} / {t}g</span>
      </div>
      <div className="h-1.5 rounded-full bg-line overflow-hidden">
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
