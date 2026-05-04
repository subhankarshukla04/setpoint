"use client";
import { useEffect, useState } from "react";
import { getProgrammeWeek, type ProgrammeWeek } from "@/lib/api";
import CyclingCard from "../CyclingCard";

export default function PlanPhone() {
  const [week, setWeek] = useState<ProgrammeWeek | null>(null);
  const [openDow, setOpenDow] = useState<number | null>(null);

  const refresh = () => getProgrammeWeek().then(setWeek).catch(() => {});
  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (!week) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-2">
      <div className="px-1 flex justify-between items-center">
        <p className="text-xs uppercase tracking-wide text-muted">This week</p>
        <p className="text-[10px] text-muted">
          ph {week.phase} · wk {week.week_of_cut}/12
          {week.injuries.length > 0 && <span className="text-bad"> · modified</span>}
        </p>
      </div>

      {week.cardio?.windows && week.cardio.windows.length > 0 && (
        <CyclingCard nextBest={week.cardio.windows.slice(0, 3)} compact />
      )}

      {week.days.map((d) => {
        const exs = d.workout.exercises;
        const swapped = exs.filter((e) => e._swapped_from).length;
        const reduced = exs.filter((e) => e._reduced).length;
        const dropped = exs.filter((e) => e._dropped).length;
        const cued = exs.filter((e) => e._cued).length;
        const isOpen = openDow === d.dow;
        return (
          <div key={d.dow}
            className={`bg-card rounded-xl ${d.is_today ? "ring-1 ring-accent/50" : ""}`}>
            <button onClick={() => setOpenDow((x) => x === d.dow ? null : d.dow)}
              className="w-full text-left px-4 py-3">
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {d.label}{d.is_today && <span className="text-accent text-xs ml-1">· today</span>}
                  </p>
                  <p className="text-xs text-muted truncate">{d.workout.workout}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted">{d.targets.kcal} kcal · {d.targets.protein_g}P</p>
                  {(swapped + reduced + dropped + cued) > 0 && (
                    <p className="text-[10px] mt-0.5">
                      {dropped > 0 && <span className="text-bad">🚫{dropped} </span>}
                      {swapped > 0 && <span className="text-warn">↻{swapped} </span>}
                      {reduced > 0 && <span className="text-accent">↓{reduced} </span>}
                      {cued > 0 && <span className="text-warn">⚠{cued}</span>}
                    </p>
                  )}
                </div>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-line px-4 py-3 space-y-3">
                {d.pre_session && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-bad">{d.pre_session.title}</p>
                    <ul className="mt-1 space-y-0.5 text-xs">
                      {d.pre_session.items.map((it, i) => <li key={i}>· {it}</li>)}
                    </ul>
                  </div>
                )}
                {d.warmup && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-accent">{d.warmup.title}</p>
                    <ul className="mt-1 space-y-0.5 text-xs">
                      {d.warmup.items.map((it, i) => <li key={i}>· {it}</li>)}
                    </ul>
                  </div>
                )}
                {exs.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted">Working sets</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      {exs.map((e, i) => (
                        <li key={i} className={e._dropped ? "opacity-50" : ""}>
                          <div className="flex justify-between gap-2">
                            <span className={`min-w-0 truncate ${e._dropped ? "line-through" : ""}`}>
                              {e.superset && <span className="text-[9px] mr-1 px-1 rounded bg-line text-muted">SS-{e.superset}</span>}
                              {e.name}
                            </span>
                            <span className="text-muted shrink-0">{e.sets}×{e.reps} R{e.rir}</span>
                          </div>
                          {e._swapped_from && <p className="text-[10px] text-warn">↻ from {e._swapped_from}</p>}
                          {e._reduced && <p className="text-[10px] text-accent">↓ {e._reduce_note}</p>}
                          {e._cued && <p className="text-[10px] text-warn">⚠ {e._cue_note}</p>}
                          {e._dropped && <p className="text-[10px] text-bad">🚫 {e._dropped_by}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
