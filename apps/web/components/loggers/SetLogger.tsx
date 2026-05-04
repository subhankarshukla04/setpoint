"use client";
import { useEffect, useState } from "react";
import { lastSets, type SetRow } from "@/lib/api";
import { postOrQueue } from "@/lib/queue";

const RECENT_KEY = "cutrack:recentExercises";
function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function pushRecent(name: string) {
  const cur = loadRecent().filter((n) => n !== name);
  cur.unshift(name);
  localStorage.setItem(RECENT_KEY, JSON.stringify(cur.slice(0, 12)));
}

export default function SetLogger() {
  const [exercise, setExercise] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rir, setRir] = useState<number | null>(1);
  const [recent, setRecent] = useState<string[]>([]);
  const [last, setLast] = useState<SetRow[]>([]);
  const [status, setStatus] = useState<"" | "saved" | "queued">("");

  useEffect(() => { setRecent(loadRecent()); }, []);
  useEffect(() => {
    if (!exercise.trim()) { setLast([]); return; }
    lastSets(exercise.trim()).then((r) => setLast(r.results)).catch(() => setLast([]));
  }, [exercise]);

  const last1 = last[0];

  async function submit() {
    const w = parseFloat(weight), r = parseInt(reps);
    if (!exercise.trim() || !isFinite(w) || !isFinite(r)) return;
    const res = await postOrQueue("/sets", { exercise: exercise.trim(), weight_kg: w, reps: r, rir });
    pushRecent(exercise.trim()); setRecent(loadRecent());
    setStatus(res.ok ? "saved" : "queued");
    setWeight(""); setReps("");
    setTimeout(() => setStatus(""), 1200);
    if (res.ok) lastSets(exercise.trim()).then((r) => setLast(r.results)).catch(() => {});
  }

  function fillFromLast() {
    if (!last1) return;
    setWeight(String(last1.weight_kg));
    setReps(String(last1.reps));
    setRir(last1.rir ?? 1);
  }

  return (
    <div className="space-y-3">
      <input value={exercise} onChange={(e) => setExercise(e.target.value)}
        placeholder="Exercise (e.g. Bench smith)"
        className="w-full bg-card rounded-xl px-4 py-3 outline-none border border-transparent focus:border-line" />

      {recent.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {recent.map((n) => (
            <button key={n} onClick={() => setExercise(n)}
              className="shrink-0 text-xs px-3 py-1.5 bg-card rounded-full text-muted">{n}</button>
          ))}
        </div>
      )}

      {last1 && (
        <button onClick={fillFromLast} className="w-full text-left bg-card rounded-xl px-4 py-2 text-xs text-muted">
          last: {last1.weight_kg}kg × {last1.reps} · RIR {last1.rir ?? "—"}  · tap to fill
        </button>
      )}

      <div className="grid grid-cols-2 gap-2">
        <NumInput label="Weight (kg)" value={weight} onChange={setWeight} />
        <NumInput label="Reps" value={reps} onChange={setReps} />
      </div>

      <div>
        <p className="text-xs text-muted mb-2">RIR</p>
        <div className="grid grid-cols-5 gap-2">
          {[0, 1, 2, 3, 4].map((n) => (
            <button key={n} onClick={() => setRir(n)}
              className={`py-2 rounded-xl text-sm ${rir === n ? "bg-fg text-bg" : "bg-card text-muted"}`}>{n}</button>
          ))}
        </div>
      </div>

      <button onClick={submit} className="w-full bg-accent text-bg font-semibold rounded-xl py-4 text-base">
        {status === "saved" ? "Saved ✓" : status === "queued" ? "Queued (offline)" : "Log set"}
      </button>
    </div>
  );
}

function NumInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-muted">{label}</span>
      <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-card rounded-xl px-4 py-3 outline-none border border-transparent focus:border-line text-lg" />
    </label>
  );
}
