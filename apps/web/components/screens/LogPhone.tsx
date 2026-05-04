"use client";
import { useState } from "react";
import { Dumbbell, Apple, Scale, Heart } from "lucide-react";
import SetLogger from "../loggers/SetLogger";
import MealLogger from "../loggers/MealLogger";
import WeightLogger from "../loggers/WeightLogger";
import ReadinessLogger from "../loggers/ReadinessLogger";

type Tab = "set" | "meal" | "weight" | "ready";

export default function LogPhone() {
  const [tab, setTab] = useState<Tab>("set");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-1.5 bg-card rounded-2xl p-1">
        <P id="set" cur={tab} onClick={setTab} icon={<Dumbbell size={14} />}>Set</P>
        <P id="meal" cur={tab} onClick={setTab} icon={<Apple size={14} />}>Meal</P>
        <P id="weight" cur={tab} onClick={setTab} icon={<Scale size={14} />}>Weight</P>
        <P id="ready" cur={tab} onClick={setTab} icon={<Heart size={14} />}>Ready</P>
      </div>
      {tab === "set" && <SetLogger />}
      {tab === "meal" && <MealLogger />}
      {tab === "weight" && <WeightLogger />}
      {tab === "ready" && <ReadinessLogger />}
    </div>
  );
}

function P({ id, cur, onClick, icon, children }: { id: Tab; cur: Tab; onClick: (id: Tab) => void; icon: React.ReactNode; children: React.ReactNode }) {
  const active = cur === id;
  return (
    <button onClick={() => onClick(id)}
      className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs ${active ? "bg-fg text-bg" : "text-muted"}`}>
      {icon}{children}
    </button>
  );
}
