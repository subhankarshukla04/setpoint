"use client";
import { useState } from "react";
import { Dumbbell, CalendarDays, Activity, MessageSquare, Library, BarChart3, HeartPulse, type LucideIcon } from "lucide-react";
import TodayLaptop from "./screens/TodayLaptop";
import LogLaptop from "./screens/LogLaptop";
import PlanLaptop from "./screens/PlanLaptop";
import CoachLaptop from "./screens/CoachLaptop";
import KBLaptop from "./screens/KBLaptop";
import ReviewLaptop from "./screens/ReviewLaptop";
import InjuriesScreen from "./screens/InjuriesScreen";
import SyncStatus from "./SyncStatus";

type Tab = "today" | "log" | "plan" | "review" | "injuries" | "coach" | "kb";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "today", label: "Today", icon: Activity },
  { id: "log", label: "Log", icon: Dumbbell },
  { id: "plan", label: "Plan", icon: CalendarDays },
  { id: "review", label: "Review", icon: BarChart3 },
  { id: "injuries", label: "Injuries", icon: HeartPulse },
  { id: "coach", label: "Coach", icon: MessageSquare },
  { id: "kb", label: "KB", icon: Library },
];

export default function LaptopApp() {
  const [tab, setTab] = useState<Tab>("today");
  return (
    <div className="min-h-dvh flex bg-bg text-fg">
      <aside className="w-56 border-r border-line p-4 flex flex-col gap-1">
        <div className="px-2 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">CutTrack</h1>
            <p className="text-xs text-muted">cut · Toronto</p>
          </div>
          <SyncStatus />
        </div>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${tab === id ? "bg-card text-fg" : "text-muted hover:text-fg"}`}>
            <Icon size={16} />{label}
          </button>
        ))}
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        {tab === "today" && <TodayLaptop />}
        {tab === "log" && <LogLaptop />}
        {tab === "plan" && <PlanLaptop />}
        {tab === "review" && <ReviewLaptop />}
        {tab === "injuries" && <InjuriesScreen />}
        {tab === "coach" && <CoachLaptop />}
        {tab === "kb" && <KBLaptop />}
      </main>
    </div>
  );
}
