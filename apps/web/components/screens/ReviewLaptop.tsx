"use client";
import { useEffect, useState } from "react";
import { getReview, type WeeklyReview } from "@/lib/api";

export default function ReviewLaptop() {
  const [r, setR] = useState<WeeklyReview | null>(null);
  useEffect(() => { getReview().then(setR).catch(() => {}); }, []);
  if (!r) return <p className="mono text-[10px] tracking-[0.16em] text-muted">// COMPILING REVIEW…</p>;

  const dotColor = r.readiness.level === "red" ? "bg-flag" : r.readiness.level === "amber" ? "bg-caution" : "bg-mark";

  return (
    <div className="space-y-8">
      {/* Masthead */}
      <header className="border-y border-fg py-5">
        <div className="flex items-baseline justify-between">
          <p className="industrial text-[10px] text-muted">PERIODICAL · ISSUE 03</p>
          <p className="mono text-[10px] tracking-[0.16em] text-muted">SETPOINT™ / REVIEW</p>
        </div>
        <h2 className="display stencil text-[80px] leading-[0.9] text-fg mt-2">WEEK·03.</h2>
        <p className="text-[14px] italic text-muted mt-2">"e1RM trend per lift, weight slope, deload signal."</p>
      </header>

      {/* Lead indicators strip */}
      <section className="grid grid-cols-3 gap-0 border border-line">
        <div className="p-5">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 ${dotColor}`} />
            <p className="industrial text-[10px] text-muted">READINESS</p>
          </div>
          <p className="display stencil text-[36px] uppercase mt-2 leading-none text-fg">{r.readiness.level}</p>
          <p className="text-[12px] text-muted mt-2 italic leading-relaxed">"{r.readiness.reason}"</p>
        </div>
        <div className="p-5 border-l border-line">
          <p className="industrial text-[10px] text-muted">WEIGHT SLOPE</p>
          <p className="display-num text-[36px] mt-2 num text-fg leading-none">
            {r.weight_slope_pct_per_week != null
              ? `${r.weight_slope_pct_per_week > 0 ? "+" : ""}${r.weight_slope_pct_per_week}`
              : "—"}
            <span className="mono text-[12px] text-muted ml-1">%/WK</span>
          </p>
          <p className="mono text-[10px] tracking-[0.14em] text-muted mt-2 uppercase">
            {r.weight_slope_pct_per_week == null
              ? "↳ NEED ≥14D MASS"
              : Math.abs(r.weight_slope_pct_per_week) > 1.0
                ? "↳ OUTSIDE 0.5–1.0%/WK BAND"
                : "↳ IN RANGE"}
          </p>
        </div>
        <div className={`p-5 border-l border-line relative ${r.deload_recommended ? "" : ""}`}>
          {r.deload_recommended && <div className="absolute inset-0 hazard-flag opacity-[0.06] pointer-events-none" />}
          <p className="industrial text-[10px] text-muted">DELOAD SIGNAL</p>
          <p className={`display stencil text-[36px] uppercase mt-2 leading-none ${r.deload_recommended ? "text-flag" : "text-fg"}`}>
            {r.deload_recommended ? "FIRE" : "HOLD"}
          </p>
          <p className="mono text-[10px] tracking-[0.14em] text-muted mt-2 uppercase">
            {r.deload_reasons.length ? `↳ ${r.deload_reasons.join(" · ")}` : "↳ NO TRIGGERS"}
          </p>
        </div>
      </section>

      {/* Lifts */}
      <section className="border border-line">
        <header className="px-5 py-3 border-b border-line flex items-baseline justify-between">
          <span className="industrial text-[10px] text-fg">// LIFTS · TRENDS</span>
          <span className="mono text-[9px] tracking-[0.16em] text-muted num">N={String(r.lifts.length).padStart(2, "0")}</span>
        </header>
        {r.lifts.length === 0 && (
          <p className="text-[12px] text-muted px-5 py-4 italic">// LOG A FEW SETS PER EXERCISE TO SEE TRENDS</p>
        )}
        <div className="divide-y divide-line">
          {r.lifts.map((l) => (
            <div key={l.exercise} className="px-5 py-4 grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4">
                <p className="font-medium text-[14px] tracking-tightish">{l.exercise}</p>
                <p className="mono text-[9.5px] tracking-[0.14em] text-muted mt-0.5 num uppercase">N={l.n} SESSIONS</p>
              </div>
              <div className="col-span-6">
                <Spark history={l.history} trend={l.trend} />
              </div>
              <div className="col-span-2 text-right">
                <p className={`display-num text-[20px] num ${l.trend === "up" ? "text-mark" : l.trend === "down" ? "text-flag" : "text-fg"}`}>
                  {l.trend === "up" ? "↗" : l.trend === "down" ? "↘" : "→"} {l.latest_e1rm}
                </p>
                <p className="mono text-[9px] tracking-[0.16em] text-muted mt-0.5">KG e1RM</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footnote */}
      <p className="text-[11px] text-muted leading-relaxed italic border-t border-line pt-3">
        "Trend uses Brzycki e1RM = weight × 36/(37−reps). Deload heuristic per
        <span className="text-fg not-italic"> deload_triggers.md</span> — fire when ≥2 compounds flat ≥4 sessions OR readiness red."
      </p>
    </div>
  );
}

function Spark({ history, trend }: { history: { day: string; e1rm: number }[]; trend: "up" | "down" | "flat" }) {
  if (history.length < 2) {
    return <p className="mono text-[10px] tracking-[0.14em] text-muted">// NEED ≥2 SESSIONS</p>;
  }
  const vals = history.map((h) => h.e1rm);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const w = 360, h = 56, pad = 4;
  const innerW = w - pad * 2, innerH = h - pad * 2;
  const xy = (v: number, i: number): [number, number] => [
    pad + (i / (vals.length - 1)) * innerW,
    pad + innerH - ((v - min) / range) * innerH,
  ];
  const pts = vals.map((v, i) => xy(v, i).join(",")).join(" ");
  const color = trend === "up" ? "#D9FF00" : trend === "down" ? "#FF3B1F" : "#F2F0EA";
  const minIdx = vals.indexOf(min), maxIdx = vals.indexOf(max);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      {/* baseline */}
      <line x1={pad} x2={w - pad} y1={h / 2} y2={h / 2} stroke="#1F1D17" strokeDasharray="2 3" />
      {/* min/max ticks */}
      {[minIdx, maxIdx].map((idx, k) => {
        if (idx < 0) return null;
        const [x, y] = xy(vals[idx], idx);
        return (
          <g key={k}>
            <line x1={x} x2={x} y1={pad} y2={h - pad} stroke="#2A2820" strokeDasharray="1 3" />
            <text x={x + 3} y={idx === maxIdx ? y - 3 : y + 9} fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#7A7872" letterSpacing="1">
              {vals[idx]}
            </text>
          </g>
        );
      })}
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
      {vals.map((v, i) => {
        const [x, y] = xy(v, i);
        return <circle key={i} cx={x} cy={y} r="1.5" fill={color} />;
      })}
    </svg>
  );
}
