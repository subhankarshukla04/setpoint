"use client";
import { useEffect, useState } from "react";
import { getReview, type WeeklyReview } from "@/lib/api";

export default function ReviewLaptop() {
  const [r, setR] = useState<WeeklyReview | null>(null);
  useEffect(() => { getReview().then(setR).catch(() => {}); }, []);
  if (!r) return <p className="text-sm text-muted">Loading review…</p>;

  const dot = r.readiness.level === "red" ? "bg-bad" : r.readiness.level === "amber" ? "bg-warn" : "bg-accent";

  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Weekly review</h2>
        <p className="text-sm text-muted">e1RM trend per lift, weight slope, deload signal.</p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            <p className="text-xs uppercase tracking-wide text-muted">Readiness</p>
          </div>
          <p className="text-2xl font-semibold capitalize mt-1">{r.readiness.level}</p>
          <p className="text-xs text-muted mt-1">{r.readiness.reason}</p>
        </div>
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Weight slope</p>
          <p className="text-2xl font-semibold mt-1">
            {r.weight_slope_pct_per_week != null
              ? `${r.weight_slope_pct_per_week > 0 ? "+" : ""}${r.weight_slope_pct_per_week}%/wk`
              : "—"}
          </p>
          <p className="text-xs text-muted mt-1">
            {r.weight_slope_pct_per_week == null
              ? "need ≥14 days of weight"
              : Math.abs(r.weight_slope_pct_per_week) > 1.0
                ? "outside 0.5–1.0%/wk band"
                : "in range"}
          </p>
        </div>
        <div className={`rounded-2xl p-4 ${r.deload_recommended ? "bg-warn/10 border border-warn/40" : "bg-card"}`}>
          <p className="text-xs uppercase tracking-wide text-muted">Deload signal</p>
          <p className="text-2xl font-semibold mt-1">{r.deload_recommended ? "Fire" : "Hold"}</p>
          <p className="text-xs text-muted mt-1">
            {r.deload_reasons.length ? r.deload_reasons.join(" · ") : "no triggers"}
          </p>
        </div>
      </div>

      <section className="bg-card rounded-2xl p-5">
        <p className="text-xs uppercase tracking-wide text-muted mb-3">Lifts ({r.lifts.length})</p>
        {r.lifts.length === 0 && <p className="text-sm text-muted">Log a few sets per exercise to see trends.</p>}
        <div className="space-y-3">
          {r.lifts.map((l) => (
            <div key={l.exercise} className="border border-line rounded-xl p-3">
              <div className="flex justify-between items-baseline">
                <p className="font-medium text-sm">{l.exercise}</p>
                <span className={`text-xs ${l.trend === "up" ? "text-accent" : l.trend === "down" ? "text-bad" : "text-muted"}`}>
                  {l.trend === "up" ? "↗" : l.trend === "down" ? "↘" : "→"} {l.latest_e1rm} kg e1RM
                </span>
              </div>
              <Spark history={l.history} />
              <p className="text-xs text-muted mt-1">{l.n} sessions tracked</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted">
        Trend uses Brzycki e1RM = weight × 36/(37−reps). Deload heuristic per
        <span className="text-fg"> deload_triggers.md</span> — fire when ≥2 compounds flat ≥4 sessions OR readiness red.
      </p>
    </div>
  );
}

function Spark({ history }: { history: { day: string; e1rm: number }[] }) {
  if (history.length < 2) return <p className="text-xs text-muted mt-2">need ≥2 sessions for trend</p>;
  const vals = history.map((h) => h.e1rm);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const w = 240, h = 32;
  const pts = vals
    .map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="mt-2">
      <polyline fill="none" stroke="#fafafa" strokeWidth="1.5" points={pts} />
    </svg>
  );
}
