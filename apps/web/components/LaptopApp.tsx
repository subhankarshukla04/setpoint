"use client";
import { useEffect, useState } from "react";
import TodayLaptop from "./screens/TodayLaptop";
import LogLaptop from "./screens/LogLaptop";
import PlanLaptop from "./screens/PlanLaptop";
import CoachLaptop from "./screens/CoachLaptop";
import KBLaptop from "./screens/KBLaptop";
import ReviewLaptop from "./screens/ReviewLaptop";
import InjuriesScreen from "./screens/InjuriesScreen";
import SyncStatus from "./SyncStatus";
import { Wordmark } from "./Wordmark";
import StreakStamp from "./StreakStamp";
import BootStamp from "./BootStamp";

type Tab = "today" | "log" | "plan" | "review" | "injuries" | "coach" | "kb";

const TABS: { id: Tab; code: string; label: string; chord: string }[] = [
  { id: "today",    code: "01", label: "LOG / TODAY",          chord: "g·t" },
  { id: "log",      code: "02", label: "INPUT",                chord: "g·l" },
  { id: "plan",     code: "03", label: "PROGRAMME",            chord: "g·p" },
  { id: "review",   code: "04", label: "PERIODIC REVIEW",      chord: "g·r" },
  { id: "injuries", code: "05", label: "CONSTRAINTS",          chord: "g·i" },
  { id: "coach",    code: "06", label: "CONSULT",              chord: "g·c" },
  { id: "kb",       code: "07", label: "FIELD MANUAL",         chord: "g·k" },
];

export default function LaptopApp() {
  const [tab, setTab] = useState<Tab>("today");

  useEffect(() => {
    let last = "";
    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.target && (e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "?") { window.dispatchEvent(new CustomEvent("setpoint:openManual")); return; }
      const k = e.key.toLowerCase();
      if (last === "g") {
        const map: Record<string, Tab> = { t: "today", l: "log", p: "plan", r: "review", i: "injuries", c: "coach", k: "kb" };
        if (map[k]) setTab(map[k]);
        last = "";
        return;
      }
      last = k === "g" ? "g" : "";
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-dvh flex bg-bg text-fg">
      <BootStamp />
      <aside className="w-64 border-r border-line flex flex-col bg-bg">
        {/* Top stamp block */}
        <div className="px-4 pt-5 pb-4 border-b border-line">
          <div className="flex items-baseline justify-between">
            <Wordmark size={18} />
          </div>
          <p className="industrial text-[9px] text-muted mt-2">
            "OPERATOR'S MANUAL"
          </p>
          <p className="industrial text-[9px] text-muted mt-1">
            CUT · 12W · TORONTO
          </p>
        </div>

        {/* Streak + sync */}
        <div className="px-4 py-4 border-b border-line flex items-stretch gap-2">
          <StreakStamp />
          <div className="flex-1 border border-line2 px-2 py-1.5 flex flex-col justify-between">
            <p className="industrial text-[9px] text-muted">STATUS</p>
            <SyncStatus />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3">
          {TABS.map(({ id, code, label, chord }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className={`group w-full flex items-stretch text-left transition-colors ${active ? "" : "hover:bg-card2"}`}>
                <span className={`w-1 ${active ? "bg-mark" : "bg-transparent"}`} />
                <span className="flex-1 px-3 py-2.5 flex items-baseline justify-between gap-3">
                  <span className="flex items-baseline gap-2 min-w-0">
                    <span className={`mono text-[9px] tracking-[0.18em] ${active ? "text-mark" : "text-muted"}`}>{code}</span>
                    <span className={`mono text-[10.5px] tracking-[0.16em] truncate ${active ? "text-fg" : "text-muted group-hover:text-fg"}`}>{label}</span>
                  </span>
                  <span className="mono text-[8.5px] tracking-[0.16em] text-line2 group-hover:text-muted shrink-0">{chord}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer stamp */}
        <div className="px-4 py-3 border-t border-line">
          <p className="industrial text-[8.5px] text-muted leading-relaxed">
            MFG. SETPOINT™ / TORONTO<br />
            BUILD · 0001 · LOCAL
          </p>
          <p className="industrial text-[8.5px] text-line2 mt-2">PRESS <span className="text-muted">?</span> FOR MANUAL</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="px-10 py-8 max-w-[1280px] mx-auto">
          {tab === "today" && <TodayLaptop />}
          {tab === "log" && <LogLaptop />}
          {tab === "plan" && <PlanLaptop />}
          {tab === "review" && <ReviewLaptop />}
          {tab === "injuries" && <InjuriesScreen />}
          {tab === "coach" && <CoachLaptop />}
          {tab === "kb" && <KBLaptop />}
        </div>
      </main>
    </div>
  );
}
