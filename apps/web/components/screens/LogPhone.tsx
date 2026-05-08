"use client";
import { useState } from "react";
import SetLogger from "../loggers/SetLogger";
import MealLogger from "../loggers/MealLogger";
import WeightLogger from "../loggers/WeightLogger";
import ReadinessLogger from "../loggers/ReadinessLogger";

type Tab = "set" | "meal" | "weight" | "ready";

const TABS: { id: Tab; code: string; label: string }[] = [
  { id: "set",    code: "01", label: "SET" },
  { id: "meal",   code: "02", label: "MEAL" },
  { id: "weight", code: "03", label: "MASS" },
  { id: "ready",  code: "04", label: "READY" },
];

export default function LogPhone() {
  const [tab, setTab] = useState<Tab>("set");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 border border-line">
        {TABS.map(({ id, code, label }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)}
              className={`py-2.5 flex flex-col items-center gap-0.5 border-r last:border-r-0 border-line
                ${active ? "bg-mark text-ink" : "text-muted"}`}>
              <span className={`mono text-[8px] tracking-[0.2em] ${active ? "text-ink/70" : "text-line2"}`}>{code}</span>
              <span className="mono text-[10px] tracking-[0.18em]">{label}</span>
            </button>
          );
        })}
      </div>
      {tab === "set" && <SetLogger />}
      {tab === "meal" && <MealLogger />}
      {tab === "weight" && <WeightLogger />}
      {tab === "ready" && <ReadinessLogger />}
    </div>
  );
}
