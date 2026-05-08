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

function e1rm(weight: number, reps: number): number {
  if (reps <= 0 || reps >= 37) return weight;
  return Math.round(weight * (36 / (37 - reps)) * 10) / 10;
}

type Receipt = {
  exercise: string; weight: number; reps: number; rir: number | null;
  e1rm: number; pr: boolean; queued: boolean; ts: string;
};

export default function SetLogger() {
  const [exercise, setExercise] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rir, setRir] = useState<number | null>(1);
  const [recent, setRecent] = useState<string[]>([]);
  const [last, setLast] = useState<SetRow[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => { setRecent(loadRecent()); }, []);
  useEffect(() => {
    if (!exercise.trim()) { setLast([]); return; }
    lastSets(exercise.trim()).then((r) => setLast(r.results)).catch(() => setLast([]));
  }, [exercise]);

  const last1 = last[0];
  const liveE1rm = (() => {
    const w = parseFloat(weight), r = parseInt(reps);
    return isFinite(w) && isFinite(r) ? e1rm(w, r) : null;
  })();
  const last30Best = last
    .filter((s) => {
      const d = new Date(s.logged_at);
      return Date.now() - d.getTime() < 30 * 24 * 60 * 60 * 1000;
    })
    .reduce((m, s) => Math.max(m, e1rm(s.weight_kg, s.reps)), 0);

  async function submit() {
    const w = parseFloat(weight), r = parseInt(reps);
    if (!exercise.trim() || !isFinite(w) || !isFinite(r)) return;
    const ex = exercise.trim();
    const res = await postOrQueue("/sets", { exercise: ex, weight_kg: w, reps: r, rir });
    pushRecent(ex); setRecent(loadRecent());
    const e = e1rm(w, r);
    const pr = last30Best > 0 && e > last30Best;
    setReceipt({
      exercise: ex, weight: w, reps: r, rir,
      e1rm: e, pr, queued: !res.ok,
      ts: new Date().toTimeString().slice(0, 8),
    });
    setWeight(""); setReps("");
    setTimeout(() => setReceipt(null), 2400);
    if (res.ok) lastSets(ex).then((r) => setLast(r.results)).catch(() => {});
  }

  function fillFromLast() {
    if (!last1) return;
    setWeight(String(last1.weight_kg));
    setReps(String(last1.reps));
    setRir(last1.rir ?? 1);
  }

  return (
    <div className="space-y-4 relative">
      {/* Receipt */}
      {receipt && (
        <div className={`fixed bottom-6 right-6 z-50 max-w-sm border-2 ${receipt.pr ? "border-mark bg-mark text-ink" : "border-fg bg-bg text-fg"} px-4 py-3 animate-receipt shadow-[8px_8px_0_0_rgba(0,0,0,0.3)]`}>
          <div className="flex items-baseline justify-between border-b border-current/20 pb-1.5">
            <p className="mono text-[10px] tracking-[0.2em] font-bold">
              {receipt.pr ? "// PR · NEW BEST" : receipt.queued ? "// QUEUED" : "// LOGGED"}
            </p>
            <p className="mono text-[10px] tracking-[0.16em] num">{receipt.ts}</p>
          </div>
          <p className="mono text-[12px] tracking-[0.06em] mt-2 num font-bold">{receipt.exercise.toUpperCase()}</p>
          <p className="display-num text-[26px] mt-1 num">
            {receipt.weight} <span className="mono text-[12px]">×</span> {receipt.reps}
          </p>
          <p className="mono text-[10px] tracking-[0.16em] mt-1 num opacity-80">
            RIR {receipt.rir ?? "—"} · e1RM {receipt.e1rm} KG
          </p>
        </div>
      )}

      {/* Exercise input */}
      <div>
        <p className="industrial text-[9px] text-muted mb-1.5">// EXERCISE</p>
        <input value={exercise} onChange={(e) => setExercise(e.target.value)}
          placeholder="bench smith / squat / deadlift…"
          className="w-full bg-card border border-line px-4 py-3 outline-none focus:border-mark text-[15px] tracking-tightish" />
      </div>

      {recent.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {recent.map((n) => (
            <button key={n} onClick={() => setExercise(n)}
              className="shrink-0 mono text-[10px] tracking-[0.14em] uppercase px-2.5 py-1.5 border border-line text-muted hover:text-fg hover:border-line2">{n}</button>
          ))}
        </div>
      )}

      {/* Carbon copy of last */}
      {last1 && (
        <button onClick={fillFromLast}
          className="w-full text-left bg-card border border-line border-dashed px-4 py-2.5 hover:border-mark/50 group">
          <div className="flex items-center justify-between">
            <p className="industrial text-[9px] text-muted">// LAST · TAP TO COPY</p>
            <span className="mono text-[9px] tracking-[0.16em] text-line2 group-hover:text-mark">↩</span>
          </div>
          <p className="mono text-[12px] tracking-[0.06em] mt-1 num text-fg">
            {last1.weight_kg} KG × {last1.reps} · RIR {last1.rir ?? "—"}
          </p>
        </button>
      )}

      {/* Weight × Reps */}
      <div className="grid grid-cols-2 gap-2">
        <NumInput label="WEIGHT / KG" value={weight} onChange={setWeight} />
        <NumInput label="REPS" value={reps} onChange={setReps} />
      </div>

      {/* Live e1RM preview */}
      {liveE1rm != null && (
        <div className="border border-dashed border-line2 px-3 py-2 flex items-baseline justify-between">
          <span className="industrial text-[9px] text-muted">// LIVE · e1RM (BRZYCKI)</span>
          <span className="mono text-[12px] tracking-[0.06em] num text-fg">
            {liveE1rm} KG
            {last30Best > 0 && (
              <span className={`ml-2 text-[10px] ${liveE1rm > last30Best ? "text-mark" : "text-muted"}`}>
                {liveE1rm > last30Best ? `↗ +${(liveE1rm - last30Best).toFixed(1)} VS 30D` : `30D BEST ${last30Best}`}
              </span>
            )}
          </span>
        </div>
      )}

      {/* RIR keypad */}
      <div>
        <p className="industrial text-[9px] text-muted mb-1.5">// RIR · REPS IN RESERVE</p>
        <div className="grid grid-cols-5 gap-1.5">
          {[0, 1, 2, 3, 4].map((n) => (
            <button key={n} onClick={() => setRir(n)}
              className={`py-3 mono text-[14px] tracking-[0.06em] border transition-colors
                ${rir === n ? "bg-fg text-ink border-fg" : "bg-card text-muted border-line hover:border-line2"}`}>{n}</button>
          ))}
        </div>
      </div>

      {/* Commit */}
      <button onClick={submit}
        className="w-full bg-fg text-ink mono font-bold tracking-[0.18em] uppercase py-4 text-[13px] hover:bg-mark transition-colors flex items-center justify-center gap-3">
        <span>▸ COMMIT SET</span>
        <span className="mono text-[10px] text-ink/50 tracking-[0.16em] hidden sm:inline">[⌘↵]</span>
      </button>
    </div>
  );
}

function NumInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="industrial text-[9px] text-muted">{label}</span>
      <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-card border border-line px-4 py-3 outline-none focus:border-mark display-num text-[28px] num" />
    </label>
  );
}
