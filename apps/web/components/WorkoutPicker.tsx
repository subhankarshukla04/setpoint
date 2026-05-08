"use client";
import { useState } from "react";
import { pickWorkout, unpickWorkout, type WorkoutTemplate, type ProgrammeToday } from "@/lib/api";

type Props = {
  templates: WorkoutTemplate[];
  selectedId: string | null;
  onUpdate: (next: ProgrammeToday) => void;
};

const ABBREV: Record<string, string> = {
  chest_shoulders: "CS",
  back_rear_delts: "BR",
  arms: "AR",
  legs_abs: "LG",
  rest: "RD",
};

const SHORT: Record<string, string> = {
  chest_shoulders: "CHEST · SHOULDERS",
  back_rear_delts: "BACK · REAR DELTS",
  arms: "ARMS",
  legs_abs: "LEGS · ABS",
  rest: "REST",
};

export default function WorkoutPicker({ templates, selectedId, onUpdate }: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  const pick = async (id: string) => {
    if (busy) return;
    setBusy(id);
    try {
      const next = id === selectedId ? await unpickWorkout() : await pickWorkout(id);
      onUpdate(next);
    } finally {
      setBusy(null);
    }
  };

  const ordered = [
    ...templates.filter((t) => t.is_training),
    ...templates.filter((t) => !t.is_training),
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between border-b border-line pb-2">
        <span className="industrial text-[10px] text-fg">
          {selectedId ? "// TODAY'S SPECIMEN — LOCKED" : "// SELECT TODAY'S SPECIMEN"}
        </span>
        {selectedId && (
          <button onClick={() => pick(selectedId)}
            className="industrial text-[9px] text-muted hover:text-flag">
            ⊗ CLEAR
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {ordered.map((t, idx) => {
          const active = t.id === selectedId;
          const isBusy = busy === t.id;
          const code = String(idx + 1).padStart(2, "0");
          return (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              disabled={!!busy}
              className={`group relative text-left p-3 border transition-all overflow-hidden
                ${active
                  ? "bg-mark text-ink border-mark"
                  : "bg-card border-line hover:border-line2 hover:bg-card2 text-fg"}
                ${isBusy ? "opacity-50" : ""}`}
            >
              {/* Specimen header — lot # / status */}
              <div className="flex items-center justify-between">
                <span className={`mono text-[9px] tracking-[0.2em] ${active ? "text-ink/70" : "text-muted"}`}>
                  LOT·{code}
                </span>
                {active ? (
                  <span className="mono text-[9px] tracking-[0.2em] text-ink font-bold">SEL</span>
                ) : t.is_training ? null : (
                  <span className="mono text-[9px] tracking-[0.2em] text-muted">REST</span>
                )}
              </div>

              {/* Stencil abbreviation */}
              <p className={`stencil mt-3 leading-none ${active ? "text-ink" : "text-fg"}`} style={{ fontSize: 44 }}>
                {ABBREV[t.id] ?? "—"}
              </p>

              {/* Body */}
              <p className={`mono text-[10px] tracking-[0.14em] mt-3 leading-tight ${active ? "text-ink" : "text-fg"}`}>
                {SHORT[t.id] ?? t.label.toUpperCase()}
              </p>
              <p className={`mono text-[9px] tracking-[0.18em] mt-1 num ${active ? "text-ink/70" : "text-muted"}`}>
                {t.is_training ? `${String(t.exercise_count).padStart(2, "0")} LIFTS` : "—"}
              </p>

              {/* Acid corner cut on hover only when not active */}
              {!active && (
                <span className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-l-[10px] border-t-transparent border-l-transparent group-hover:border-t-mark transition-colors" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
