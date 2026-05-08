"use client";
import { useEffect, useState } from "react";
import { getToday, searchFoods, type DaySummary, type Food } from "@/lib/api";
import { postOrQueue } from "@/lib/queue";

export default function MealLogger() {
  const [q, setQ] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [pick, setPick] = useState<Food | null>(null);
  const [grams, setGrams] = useState("");
  const [day, setDay] = useState<DaySummary | null>(null);
  const [status, setStatus] = useState<"" | "saved" | "queued">("");

  useEffect(() => { searchFoods("", true).then((r) => setFoods(r.results)).catch(() => {}); }, []);
  useEffect(() => { getToday().then(setDay).catch(() => {}); }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!q.trim()) searchFoods("", true).then((r) => setFoods(r.results)).catch(() => {});
      else searchFoods(q).then((r) => setFoods(r.results)).catch(() => {});
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  async function submit() {
    if (!pick) return;
    const g = parseFloat(grams) || pick.serving_g;
    const res = await postOrQueue<{ macros: any }>("/meals", { food_id: pick.id, grams: g });
    setStatus(res.ok ? "saved" : "queued");
    setPick(null); setGrams(""); setQ("");
    setTimeout(() => setStatus(""), 1400);
    if (res.ok) getToday().then(setDay).catch(() => {});
  }

  return (
    <div className="space-y-4">
      {day?.macros && (
        <div className="grid grid-cols-4 border border-line">
          <S label="KCAL" v={day.macros.kcal} />
          <S label="P" v={day.macros.protein_g} divider />
          <S label="C" v={day.macros.carb_g} divider />
          <S label="F" v={day.macros.fat_g} divider />
        </div>
      )}

      <input value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="search foods (chicken, oats, whey…)"
        className="w-full bg-card border border-line px-4 py-3 outline-none focus:border-mark text-[14px]" />

      <div className="space-y-1 max-h-72 overflow-y-auto border border-line">
        {foods.map((f, i) => (
          <button key={f.id} onClick={() => { setPick(f); setGrams(String(f.serving_g)); }}
            className={`w-full text-left px-3 py-2 border-b border-line last:border-0 transition-colors
              ${pick?.id === f.id ? "bg-mark text-ink" : "bg-card hover:bg-card2"}`}>
            <div className="flex justify-between items-center gap-3">
              <span className="flex items-baseline gap-2 min-w-0">
                <span className={`mono text-[9px] tracking-[0.18em] ${pick?.id === f.id ? "text-ink/60" : "text-line2"}`}>{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[13px] truncate">{f.name}</span>
              </span>
              <span className={`mono text-[10px] tracking-[0.1em] num shrink-0 ${pick?.id === f.id ? "text-ink/80" : "text-muted"}`}>
                {f.kcal} KCAL · P{f.protein_g} / {f.serving_g}G
              </span>
            </div>
          </button>
        ))}
        {foods.length === 0 && <p className="text-[12px] text-muted text-center py-4 italic">// NO MATCHES</p>}
      </div>

      {pick && (
        <div className="space-y-3 border border-line p-4">
          <p className="industrial text-[10px] text-fg">// SELECTED · {pick.name.toUpperCase()}</p>
          <label className="block">
            <span className="industrial text-[9px] text-muted">// GRAMS</span>
            <input inputMode="decimal" value={grams} onChange={(e) => setGrams(e.target.value)}
              className="mt-1 w-full bg-bg border border-line px-4 py-3 outline-none focus:border-mark display-num text-[22px] num" />
          </label>
          <Preview food={pick} grams={parseFloat(grams) || 0} />
          <button onClick={submit}
            className="w-full bg-fg text-ink mono font-bold tracking-[0.18em] uppercase py-3.5 text-[13px] hover:bg-mark transition-colors">
            {status === "saved" ? "▸ LOGGED ✓" : status === "queued" ? "▸ QUEUED · OFFLINE" : "▸ ADD MEAL"}
          </button>
        </div>
      )}
    </div>
  );
}

function S({ label, v, divider }: { label: string; v: number; divider?: boolean }) {
  return (
    <div className={`p-3 ${divider ? "border-l border-line" : ""}`}>
      <p className="industrial text-[9px] text-muted">{label}</p>
      <p className="display-num text-[18px] text-fg num mt-1">{v.toFixed(0)}</p>
    </div>
  );
}

function Preview({ food, grams }: { food: Food; grams: number }) {
  const ratio = grams / food.serving_g;
  return (
    <p className="mono text-[10.5px] tracking-[0.1em] text-muted num">
      ↳ {(food.kcal * ratio).toFixed(0)} KCAL · P{(food.protein_g * ratio).toFixed(1)} ·
      C{(food.carb_g * ratio).toFixed(1)} · F{(food.fat_g * ratio).toFixed(1)}
    </p>
  );
}
