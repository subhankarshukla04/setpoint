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

export default function LogLaptop() {
  const [tab, setTab] = useState<Tab>("set");
  return (
    <div className="max-w-2xl space-y-6">
      <header className="border-b border-line pb-5">
        <p className="industrial text-[10px] text-muted">FILE / INPUT</p>
        <h2 className="display stencil text-[60px] leading-[0.92] text-fg mt-2">INPUT.</h2>
        <p className="mono text-[11px] tracking-[0.14em] text-muted mt-3">"COMMIT THE SET. THE NUMBER IS THE PRODUCT."</p>
      </header>
      <div className="grid grid-cols-4 border border-line">
        {TABS.map(({ id, code, label }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)}
              className={`relative py-3 flex flex-col items-center gap-1 border-r last:border-r-0 border-line transition-colors
                ${active ? "bg-mark text-ink" : "text-muted hover:text-fg hover:bg-card2"}`}>
              <span className={`mono text-[9px] tracking-[0.2em] ${active ? "text-ink/70" : "text-line2"}`}>{code}</span>
              <span className="mono text-[11px] tracking-[0.18em]">{label}</span>
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
