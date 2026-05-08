"use client";
import { useEffect, useState } from "react";
import { getReadiness, type ReadinessRow, type ReadinessScore } from "@/lib/api";
import { postOrQueue } from "@/lib/queue";

export default function ReadinessLogger() {
  const [sleep, setSleep] = useState("");
  const [sore, setSore] = useState<number | null>(3);
  const [hrv, setHrv] = useState("");
  const [today, setToday] = useState<ReadinessRow | null>(null);
  const [score, setScore] = useState<ReadinessScore | null>(null);
  const [status, setStatus] = useState<"" | "saved" | "queued">("");

  useEffect(() => {
    getReadiness().then((r) => {
      setToday(r.today); setScore(r.score);
      if (r.today) {
        if (r.today.sleep_hours != null) setSleep(String(r.today.sleep_hours));
        if (r.today.soreness != null) setSore(r.today.soreness);
        if (r.today.hrv_rmssd != null) setHrv(String(r.today.hrv_rmssd));
      }
    }).catch(() => {});
  }, []);

  async function submit() {
    const payload = {
      sleep_hours: parseFloat(sleep) || null,
      soreness: sore,
      hrv_rmssd: parseFloat(hrv) || null,
    };
    const res = await postOrQueue<{ score: ReadinessScore }>("/readiness", payload);
    if (res.ok && res.data) setScore(res.data.score);
    setStatus(res.ok ? "saved" : "queued");
    setTimeout(() => setStatus(""), 1400);
  }

  const dotColor = score?.level === "red" ? "bg-flag" : score?.level === "amber" ? "bg-caution" : "bg-mark";
  return (
    <div className="space-y-4">
      <div className="border border-line p-4">
        <div className="flex items-center justify-between">
          <p className="industrial text-[10px] text-muted">// READINESS · SCORE</p>
          <span className={`w-2 h-2 ${dotColor}`} />
        </div>
        <p className="display stencil text-[44px] uppercase mt-2 leading-none text-fg">{score?.level ?? "—"}</p>
        <p className="mono text-[10px] tracking-[0.14em] text-muted mt-2 leading-relaxed">{score?.reason ?? "// NO DATA"}</p>
        {score?.rule && <p className="text-[12px] text-fg/85 mt-1.5 italic">"{score.rule}"</p>}
      </div>

      <label className="block">
        <span className="industrial text-[9px] text-muted">// SLEEP / HOURS</span>
        <input inputMode="decimal" value={sleep} onChange={(e) => setSleep(e.target.value)}
          placeholder="7.5"
          className="mt-1 w-full bg-card border border-line px-4 py-3 outline-none focus:border-mark display-num text-[22px] num" />
      </label>

      <div>
        <p className="industrial text-[9px] text-muted mb-1.5">// SORENESS · 1 NONE → 10 SEVERE</p>
        <div className="grid grid-cols-10 gap-1">
          {[1,2,3,4,5,6,7,8,9,10].map((n) => (
            <button key={n} onClick={() => setSore(n)}
              className={`py-2.5 mono text-[12px] border ${sore === n ? "bg-fg text-ink border-fg" : "bg-card text-muted border-line"}`}>{n}</button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="industrial text-[9px] text-muted">// HRV rMSSD · OPTIONAL</span>
        <input inputMode="decimal" value={hrv} onChange={(e) => setHrv(e.target.value)}
          placeholder="55"
          className="mt-1 w-full bg-card border border-line px-4 py-3 outline-none focus:border-mark display-num text-[22px] num" />
      </label>

      <button onClick={submit}
        className="w-full bg-fg text-ink mono font-bold tracking-[0.18em] uppercase py-4 text-[13px] hover:bg-mark transition-colors">
        {status === "saved" ? "▸ LOGGED ✓" : status === "queued" ? "▸ QUEUED · OFFLINE" : (today ? "▸ UPDATE READINESS" : "▸ COMMIT READINESS")}
      </button>

      <p className="text-[11px] text-muted text-center italic">
        "Rules from <span className="text-fg not-italic">sleep_performance_elasticity</span>: 2+ nights &gt;1h below 14d median → red."
      </p>
    </div>
  );
}
