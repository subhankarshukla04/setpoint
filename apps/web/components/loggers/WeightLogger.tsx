"use client";
import { useEffect, useState } from "react";
import { getWeights, type WeightEma } from "@/lib/api";
import { postOrQueue } from "@/lib/queue";

export default function WeightLogger() {
  const [w, setW] = useState("");
  const [ema, setEma] = useState<WeightEma | null>(null);
  const [status, setStatus] = useState<"" | "saved" | "queued">("");

  useEffect(() => { getWeights().then((r) => setEma(r.ema)).catch(() => {}); }, []);

  async function submit() {
    const v = parseFloat(w);
    if (!isFinite(v)) return;
    const res = await postOrQueue<{ ema: WeightEma }>("/weights", { weight_kg: v });
    if (res.ok && res.data) setEma(res.data.ema);
    setStatus(res.ok ? "saved" : "queued");
    setW("");
    setTimeout(() => setStatus(""), 1200);
  }

  return (
    <div className="space-y-3">
      <div className="bg-card rounded-2xl p-4">
        <p className="text-xs uppercase tracking-wide text-muted">14d EMA</p>
        <p className="text-3xl font-semibold mt-1">{ema?.ema != null ? `${ema.ema.toFixed(2)} kg` : "—"}</p>
        <p className="text-xs text-muted mt-1">{ema?.n ?? 0} entries · last {ema?.last_day ?? "never"}</p>
      </div>

      <label className="block">
        <span className="text-xs text-muted">This morning (kg)</span>
        <input inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} placeholder="95.4"
          className="mt-1 w-full bg-card rounded-xl px-4 py-3 outline-none border border-transparent focus:border-line text-2xl" />
      </label>

      <button onClick={submit} className="w-full bg-accent text-bg font-semibold rounded-xl py-4 text-base">
        {status === "saved" ? "Saved ✓" : status === "queued" ? "Queued (offline)" : "Log weight"}
      </button>

      <p className="text-xs text-muted text-center">
        Weigh fasted, post-void, same scale. The EMA absorbs daily noise — see KB
        article <span className="text-fg">trend_weighting_scale_weight</span>.
      </p>
    </div>
  );
}
