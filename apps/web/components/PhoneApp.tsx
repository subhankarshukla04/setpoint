"use client";
import { useState } from "react";
import { Dumbbell, CalendarDays, Activity, HeartPulse, type LucideIcon } from "lucide-react";
import TodayPhone from "./screens/TodayPhone";
import LogPhone from "./screens/LogPhone";
import PlanPhone from "./screens/PlanPhone";
import InjuriesScreen from "./screens/InjuriesScreen";
import SyncStatus from "./SyncStatus";

type Tab = "today" | "log" | "plan" | "injuries";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "today", label: "Today", icon: Activity },
  { id: "log", label: "Log", icon: Dumbbell },
  { id: "plan", label: "Plan", icon: CalendarDays },
  { id: "injuries", label: "Injury", icon: HeartPulse },
];

export default function PhoneApp() {
  const [tab, setTab] = useState<Tab>("today");
  return (
    <div className="min-h-dvh flex flex-col bg-bg text-fg">
      <header className="safe-top px-4 py-3 border-b border-line flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">CutTrack</h1>
        <SyncStatus />
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {tab === "today" && <TodayPhone />}
        {tab === "log" && <LogPhone />}
        {tab === "plan" && <PlanPhone />}
        {tab === "injuries" && <InjuriesScreen />}
      </main>
      <nav className="safe-bottom border-t border-line bg-bg">
        <div className="grid grid-cols-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`py-3 flex flex-col items-center gap-1 text-xs ${tab === id ? "text-fg" : "text-muted"}`}>
              <Icon size={22} />{label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
