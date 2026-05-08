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
    setTimeout(() => setStatus(""), 1400);
  }

  return (
    <div className="space-y-4">
      <div className="border border-line p-4">
        <p className="industrial text-[10px] text-muted">// 14D EMA</p>
        <p className="display-num text-[56px] leading-none mt-2 text-fg num">
          {ema?.ema != null ? ema.ema.toFixed(2) : "—"}
          <span className="mono text-[14px] text-muted ml-2">KG</span>
        </p>
        <p className="mono text-[10px] tracking-[0.14em] text-muted mt-2 num uppercase">
          ↳ N={ema?.n ?? 0} · LAST {ema?.last_day ?? "NEVER"}
        </p>
      </div>

      <label className="block">
        <span className="industrial text-[9px] text-muted">// THIS MORNING / KG</span>
        <input inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} placeholder="95.4"
          className="mt-1 w-full bg-card border border-line px-4 py-3 outline-none focus:border-mark display-num text-[28px] num" />
      </label>

      <button onClick={submit}
        className="w-full bg-fg text-ink mono font-bold tracking-[0.18em] uppercase py-4 text-[13px] hover:bg-mark transition-colors">
        {status === "saved" ? "▸ LOGGED ✓" : status === "queued" ? "▸ QUEUED · OFFLINE" : "▸ COMMIT MASS"}
      </button>

      <p className="text-[11px] text-muted leading-relaxed italic">
        "Fasted, post-void, same scale. The EMA absorbs daily noise — see KB <span className="text-fg not-italic">trend_weighting_scale_weight</span>."
      </p>
    </div>
  );
}
