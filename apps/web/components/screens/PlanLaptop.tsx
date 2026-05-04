"use client";
import { useEffect, useState } from "react";
import { getProgrammeWeek, type ProgrammeWeek, type ProgrammeDay } from "@/lib/api";
import PreSessionCard from "../PreSessionCard";
import CyclingCard from "../CyclingCard";

export default function PlanLaptop() {
  const [week, setWeek] = useState<ProgrammeWeek | null>(null);
  const [openDow, setOpenDow] = useState<number | null>(null);

  const refresh = () => getProgrammeWeek().then(setWeek).catch(() => {});
  useEffect(() => {
    refresh();
    // re-fetch when tab regains focus so injury toggles reflect immediately
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (!week) return <p className="text-sm text-muted">Loading plan…</p>;

  const open = openDow != null ? week.days.find((d) => d.dow === openDow) : null;

  return (
    <div className="max-w-6xl space-y-5">
      <header className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Plan</h2>
          <p className="text-sm text-muted">
            Live view — adjusts automatically when you toggle injuries.
            Click a day to expand.
          </p>
        </div>
        <div className="text-xs text-muted">
          Phase {week.phase} · wk {week.week_of_cut}/12
          {week.injuries.length > 0 && (
            <span className="ml-3 text-bad">
              · {week.injuries.length} injury active — plan modified
            </span>
          )}
        </div>
      </header>

      {week.cardio?.windows && week.cardio.windows.length > 0 && (
        <CyclingCard nextBest={week.cardio.windows.slice(0, 3)} />
      )}

      <div className="grid grid-cols-7 gap-3">
        {week.days.map((d) => (
          <DayCard key={d.dow} d={d} open={openDow === d.dow}
            onClick={() => setOpenDow((x) => x === d.dow ? null : d.dow)} />
        ))}
      </div>

      {open && <DayDetail day={open} />}
    </div>
  );
}

function DayCard({ d, open, onClick }: { d: ProgrammeDay; open: boolean; onClick: () => void }) {
  const exs = d.workout.exercises;
  const swapped = exs.filter((e) => e._swapped_from).length;
  const reduced = exs.filter((e) => e._reduced).length;
  const dropped = exs.filter((e) => e._dropped).length;
  const cued = exs.filter((e) => e._cued).length;
  const modified = swapped + reduced + dropped + cued;
  const dayBadge = d.is_training_day ? "bg-accent/15 text-accent" : "bg-warn/15 text-warn";

  return (
    <button onClick={onClick}
      className={`bg-card rounded-xl p-3 min-h-40 text-left border transition
        ${open ? "border-accent" : "border-transparent"}
        ${d.is_today ? "ring-1 ring-accent/40" : ""}`}>
      <div className="flex justify-between items-baseline">
        <p className="text-xs text-muted">{d.label}{d.is_today && " · today"}</p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide ${dayBadge}`}>
          {d.day_type[0]}
        </span>
      </div>
      <p className="text-sm font-medium mt-1">{d.workout.workout}</p>
      <p className="text-xs text-muted mt-2">{d.targets.kcal} kcal · {d.targets.protein_g}g P</p>

      {modified > 0 && (
        <p className="text-[10px] text-bad mt-2">
          {dropped > 0 && <span>🚫{dropped} </span>}
          {swapped > 0 && <span className="text-warn">↻{swapped} </span>}
          {reduced > 0 && <span className="text-accent">↓{reduced} </span>}
          {cued > 0 && <span className="text-warn">⚠{cued}</span>}
        </p>
      )}

      {exs.length > 0 ? (
        <ul className="mt-2 text-[10px] text-muted space-y-0.5">
          {exs.slice(0, 3).map((e, i) => (
            <li key={i} className={`truncate ${e._dropped ? "line-through" : ""}`}>{e.name}</li>
          ))}
          {exs.length > 3 && <li>+{exs.length - 3}</li>}
        </ul>
      ) : (
        <p className="mt-2 text-[10px] text-muted">{d.pre_session.kind === "rehab_day" ? "rehab day" : "rest"}</p>
      )}
    </button>
  );
}

function DayDetail({ day }: { day: ProgrammeDay }) {
  return (
    <section className="bg-card rounded-2xl p-5 space-y-5">
      <header className="flex items-baseline justify-between">
        <div>
          <h3 className="text-lg font-semibold">{day.label} · {day.workout.workout}</h3>
          <p className="text-xs text-muted">
            {day.day_type} day · target {day.targets.kcal} kcal · P {day.targets.protein_g} · C {day.targets.carb_g} · F {day.targets.fat_g}
          </p>
        </div>
      </header>

      {day.pre_session && <PreSessionCard pre={day.pre_session} />}
      {day.warmup && <PreSessionCard pre={day.warmup} />}

      {day.workout.exercises.length === 0 ? (
        <p className="text-sm text-muted italic">{day.workout.notes ?? "Rest."}</p>
      ) : (
        <div>
          <p className="text-xs uppercase tracking-wide text-muted mb-2">Working sets</p>
          <ul className="text-sm divide-y divide-line">
            {day.workout.exercises.map((e, i) => (
              <li key={i} className={`py-2 flex justify-between gap-4 ${e._dropped ? "opacity-50" : ""}`}>
                <div className="min-w-0">
                  <p className={`font-medium truncate ${e._dropped ? "line-through" : ""}`}>
                    {e.superset && <span className="text-[10px] mr-2 px-1.5 py-0.5 rounded bg-line text-muted">SS-{e.superset}</span>}
                    {e.name}
                  </p>
                  {e._swapped_from && <p className="text-xs text-warn truncate">↻ swapped from {e._swapped_from} ({e._swapped_by})</p>}
                  {e._reduced && <p className="text-xs text-accent truncate">↓ reduced — {e._reduce_note} ({e._reduced_by})</p>}
                  {e._cued && <p className="text-xs text-warn truncate">⚠ {e._cue_note} ({e._cued_by})</p>}
                  {e._dropped && <p className="text-xs text-bad">🚫 dropped — {e._dropped_by}</p>}
                  {!e._dropped && e.cue && <p className="text-xs text-muted truncate">{e.cue}</p>}
                </div>
                <span className="text-muted whitespace-nowrap text-xs">
                  {e.sets} × {e.reps} · RIR {e.rir}{e.rest_sec ? ` · ${e.rest_sec}s` : ""}
                </span>
              </li>
            ))}
          </ul>
          {day.workout.notes && (
            <p className="text-xs text-muted italic mt-3">{day.workout.notes}</p>
          )}
        </div>
      )}
    </section>
  );
}
