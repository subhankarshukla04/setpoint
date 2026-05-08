"use client";
import { useState } from "react";
import TodayPhone from "./screens/TodayPhone";
import LogPhone from "./screens/LogPhone";
import PlanPhone from "./screens/PlanPhone";
import InjuriesScreen from "./screens/InjuriesScreen";
import SyncStatus from "./SyncStatus";
import { Wordmark } from "./Wordmark";
import BootStamp from "./BootStamp";

type Tab = "today" | "log" | "plan" | "injuries";

const TABS: { id: Tab; code: string; label: string }[] = [
  { id: "today",    code: "01", label: "TODAY" },
  { id: "log",      code: "02", label: "INPUT" },
  { id: "plan",     code: "03", label: "PLAN" },
  { id: "injuries", code: "04", label: "RX" },
];

export default function PhoneApp() {
  const [tab, setTab] = useState<Tab>("today");
  return (
    <div className="min-h-dvh flex flex-col bg-bg text-fg">
      <BootStamp />
      <header className="safe-top px-4 py-3 border-b border-line flex items-center justify-between">
        <div>
          <Wordmark size={14} />
          <p className="industrial text-[8.5px] text-muted mt-0.5">CUT · 12W · TORONTO</p>
        </div>
        <SyncStatus />
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-5">
        {tab === "today" && <TodayPhone />}
        {tab === "log" && <LogPhone />}
        {tab === "plan" && <PlanPhone />}
        {tab === "injuries" && <InjuriesScreen />}
      </main>
      <nav className="safe-bottom border-t border-line bg-bg">
        <div className="grid grid-cols-4">
          {TABS.map(({ id, code, label }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} className="relative py-3 flex flex-col items-center justify-center gap-1">
                <span className={`absolute top-0 left-0 right-0 h-0.5 ${active ? "bg-mark" : "bg-transparent"}`} />
                <span className={`mono text-[9px] tracking-[0.18em] ${active ? "text-mark" : "text-line2"}`}>{code}</span>
                <span className={`mono text-[10px] tracking-[0.18em] ${active ? "text-fg" : "text-muted"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
