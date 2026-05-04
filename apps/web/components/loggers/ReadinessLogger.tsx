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
    setTimeout(() => setStatus(""), 1200);
  }

  const dot = score?.level === "red" ? "bg-bad" : score?.level === "amber" ? "bg-warn" : "bg-accent";
  return (
    <div className="space-y-3">
      <div className="bg-card rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
          <p className="text-xs uppercase tracking-wide text-muted">Readiness</p>
        </div>
        <p className="text-2xl font-semibold capitalize mt-1">{score?.level ?? "—"}</p>
        <p className="text-xs text-muted mt-1">{score?.reason ?? "—"}</p>
        {score?.rule && <p className="text-xs text-fg/80 mt-1">→ {score.rule}</p>}
      </div>

      <label className="block">
        <span className="text-xs text-muted">Sleep last night (h)</span>
        <input inputMode="decimal" value={sleep} onChange={(e) => setSleep(e.target.value)}
          placeholder="7.5"
          className="mt-1 w-full bg-card rounded-xl px-4 py-3 outline-none border border-transparent focus:border-line text-lg" />
      </label>

      <div>
        <p className="text-xs text-muted mb-2">Soreness (1 none → 10 severe)</p>
        <div className="grid grid-cols-10 gap-1">
          {[1,2,3,4,5,6,7,8,9,10].map((n) => (
            <button key={n} onClick={() => setSore(n)}
              className={`py-2 rounded-md text-xs ${sore === n ? "bg-fg text-bg" : "bg-card text-muted"}`}>{n}</button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="text-xs text-muted">HRV rMSSD (optional)</span>
        <input inputMode="decimal" value={hrv} onChange={(e) => setHrv(e.target.value)}
          placeholder="55"
          className="mt-1 w-full bg-card rounded-xl px-4 py-3 outline-none border border-transparent focus:border-line text-lg" />
      </label>

      <button onClick={submit} className="w-full bg-accent text-bg font-semibold rounded-xl py-4 text-base">
        {status === "saved" ? "Saved ✓" : status === "queued" ? "Queued (offline)" : (today ? "Update" : "Log readiness")}
      </button>

      <p className="text-xs text-muted text-center">
        Rules from <span className="text-fg">sleep_performance_elasticity</span>: 2+ nights &gt;1h below 14d median → red.
      </p>
    </div>
  );
}
