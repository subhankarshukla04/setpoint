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
  const tone: "accent" | "warn" | "bad" =
    ready?.level === "red" ? "bad" : ready?.level === "amber" ? "warn" : "accent";

  return (
    <div className="space-y-5">
      {prog && prog.injuries.length > 0 && (
        <HazardStrip tone="flag" label={`// ACTIVE CONSTRAINT — N=${prog.injuries.length}`} />
      )}

      {/* Hero EMA */}
      <section className="border border-line p-4">
        <p className="industrial text-[9px] text-muted">MASS / 14D EMA</p>
        <div className="flex items-end gap-2 mt-2">
          <span className="display-num text-[64px] leading-[0.85] text-fg">
            {ema?.ema != null ? ema.ema.toFixed(1) : "—"}
          </span>
          <span className="mono text-[11px] text-muted pb-1.5">KG</span>
        </div>
        <p className="mono text-[10px] tracking-[0.14em] text-muted mt-2 num">
          ↳ TODAY {ema?.current != null ? `${ema.current.toFixed(1)} KG` : "—"} · N={ema?.n ?? 0}
        </p>
      </section>

      {/* Readiness */}
      <section className="border border-line p-4">
        <div className="flex items-center justify-between">
          <p className="industrial text-[9px] text-muted">READINESS</p>
          <Dot tone={tone} />
        </div>
        <p className="display stencil text-[34px] uppercase mt-1 leading-none text-fg">{ready?.level ?? "—"}</p>
        <p className="mono text-[10px] tracking-[0.12em] text-muted mt-2 leading-relaxed">{ready?.reason ?? "// LOG ON INPUT → READY"}</p>
        {ready?.rule && <p className="text-[11.5px] text-fg/85 italic mt-1.5">"{ready.rule}"</p>}
      </section>

      {/* Session ribbon */}
      {prog && (
        <section className="border border-line p-4">
          <div className="flex items-center justify-between">
            <p className="industrial text-[9px] text-fg">{prog.user_picked ? "// LOCKED" : "// UNSET"}</p>
            <Pill tone={prog.is_training_day ? "accent" : "warn"}>{prog.day_type}</Pill>
          </div>
          <p className="text-[14px] font-semibold tracking-tightish mt-1.5">
            {prog.user_picked ? prog.workout.workout : "NO SESSION PICKED"}
          </p>
          <p className="mono text-[10px] tracking-[0.14em] text-muted mt-1 num">
            PHASE {prog.phase} · WK {String(prog.week_of_cut).padStart(2, "0")}/12 · {t?.kcal} KCAL · {t?.protein_g}P
          </p>
        </section>
      )}

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
        <CyclingCard todayWindow={prog.cardio.today_window} nextBest={prog.cardio.next_best} compact />
      )}

      {/* Macro spec */}
      <section className="border border-line p-4">
        <p className="industrial text-[9px] text-muted">MACROS</p>
        <div className="mt-3 space-y-2.5">
          <Bar label="P" v={m?.protein_g ?? 0} t={t?.protein_g ?? 170} />
          <Bar label="C" v={m?.carb_g ?? 0} t={t?.carb_g ?? 220} />
          <Bar label="F" v={m?.fat_g ?? 0} t={t?.fat_g ?? 55} />
        </div>
        <div className="mt-3 flex justify-between mono text-[11px] tracking-[0.14em] border-t border-line pt-2 num">
          <span className="text-muted">KCAL</span>
          <span className="text-fg">{(m?.kcal ?? 0).toFixed(0)} / {t?.kcal ?? "—"}</span>
        </div>
      </section>

      {/* Recent sets */}
      <section className="border border-line">
        <header className="px-4 py-2.5 border-b border-line flex items-baseline justify-between">
          <span className="industrial text-[9px] text-fg">// SETS · TODAY</span>
          <span className="mono text-[9px] text-muted tracking-[0.16em] num">N={String(day?.sets.length ?? 0).padStart(2, "0")}</span>
        </header>
        {day && day.sets.length > 0 ? (
          <ul className="divide-y divide-line">
            {day.sets.slice(-5).map((s, i) => (
              <li key={s.id} className="px-4 py-2 flex justify-between gap-3 text-[13px]">
                <span className="flex items-baseline gap-2 min-w-0">
                  <span className="mono text-[9px] text-line2 tracking-[0.18em]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="truncate tracking-tightish">{s.exercise}</span>
                </span>
                <span className="text-muted text-[11px] num self-center">
                  {s.weight_kg}×{s.reps}{s.rir != null ? ` · R${s.rir}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : <p className="text-[12px] text-muted italic px-4 py-3">// NO SETS YET</p>}
      </section>
    </div>
  );
}

function Bar({ label, v, t }: { label: string; v: number; t: number }) {
  const pct = Math.min(100, (v / t) * 100);
  return (
    <div>
      <div className="flex justify-between mono text-[10px] tracking-[0.14em] mb-1 num">
        <span className="text-muted">{label}</span>
        <span className="text-fg">{v.toFixed(0)} / {t}G</span>
      </div>
      <div className="h-px bg-line">
        <div className="h-full bg-mark" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
