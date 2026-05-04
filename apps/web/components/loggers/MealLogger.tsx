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
    setTimeout(() => setStatus(""), 1200);
    if (res.ok) getToday().then(setDay).catch(() => {});
  }

  return (
    <div className="space-y-3">
      {day?.macros && (
        <div className="grid grid-cols-4 gap-2 bg-card rounded-xl p-3 text-center">
          <S label="kcal" v={day.macros.kcal} />
          <S label="P" v={day.macros.protein_g} />
          <S label="C" v={day.macros.carb_g} />
          <S label="F" v={day.macros.fat_g} />
        </div>
      )}

      <input value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="search foods (chicken, oats, whey…)"
        className="w-full bg-card rounded-xl px-4 py-3 outline-none border border-transparent focus:border-line" />

      <div className="space-y-1.5 max-h-60 overflow-y-auto">
        {foods.map((f) => (
          <button key={f.id} onClick={() => { setPick(f); setGrams(String(f.serving_g)); }}
            className={`w-full text-left rounded-xl px-3 py-2 ${pick?.id === f.id ? "bg-fg text-bg" : "bg-card"}`}>
            <div className="flex justify-between items-center">
              <span className="text-sm">{f.name}</span>
              <span className={`text-xs ${pick?.id === f.id ? "text-bg/70" : "text-muted"}`}>
                {f.kcal} kcal · {f.protein_g}P / {f.serving_g}g
              </span>
            </div>
          </button>
        ))}
        {foods.length === 0 && <p className="text-sm text-muted text-center py-4">No matches.</p>}
      </div>

      {pick && (
        <div className="space-y-3 bg-card rounded-2xl p-4">
          <p className="text-sm">{pick.name}</p>
          <label className="block">
            <span className="text-xs text-muted">Grams</span>
            <input inputMode="decimal" value={grams} onChange={(e) => setGrams(e.target.value)}
              className="mt-1 w-full bg-bg rounded-xl px-4 py-3 outline-none border border-line text-lg" />
          </label>
          <Preview food={pick} grams={parseFloat(grams) || 0} />
          <button onClick={submit} className="w-full bg-accent text-bg font-semibold rounded-xl py-3">
            {status === "saved" ? "Saved ✓" : status === "queued" ? "Queued (offline)" : "Add"}
          </button>
        </div>
      )}
    </div>
  );
}

function S({ label, v }: { label: string; v: number }) {
  return <div><p className="text-xs text-muted">{label}</p><p className="text-sm font-semibold">{v.toFixed(0)}</p></div>;
}

function Preview({ food, grams }: { food: Food; grams: number }) {
  const ratio = grams / food.serving_g;
  return (
    <p className="text-xs text-muted">
      {(food.kcal * ratio).toFixed(0)} kcal · P {(food.protein_g * ratio).toFixed(1)} ·
      C {(food.carb_g * ratio).toFixed(1)} · F {(food.fat_g * ratio).toFixed(1)}
    </p>
  );
}
