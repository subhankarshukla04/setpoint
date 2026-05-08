"use client";
import type { CyclingWindow } from "@/lib/api";

export default function CyclingCard({
  todayWindow, nextBest, compact = false,
}: {
  todayWindow?: CyclingWindow | null;
  nextBest?: CyclingWindow[];
  compact?: boolean;
}) {
  const hasToday = !!todayWindow;
  const upcoming = nextBest ?? [];
  if (!hasToday && upcoming.length === 0) return null;

  return (
    <section className="border border-line bg-card">
      <header className="flex items-baseline justify-between px-5 py-2.5 border-b border-line bg-card2">
        <span className="industrial text-[10px] text-fg">// DEPARTURES · BIKE SHARE TORONTO</span>
        <span className="mono text-[9px] text-muted tracking-[0.14em]">~18 KG · MET 7 / 8.5</span>
      </header>

      {hasToday && (
        <div className="px-5 py-3 border-b border-line bg-mark/[0.05] relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-mark" />
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <span className="mono text-[9px] tracking-[0.2em] text-mark">NOW</span>
              <span className="display stencil text-[18px] uppercase tracking-tighter3 text-fg">
                {todayWindow!.label}
              </span>
            </div>
            <span className="display-num text-[20px] text-fg num">{todayWindow!.ride_minutes}<span className="mono text-[10px] text-muted ml-1">MIN</span></span>
          </div>
          <p className="mono text-[10px] text-muted mt-2 tracking-[0.12em] num uppercase">
            {todayWindow!.avg_temp_c}°C · {todayWindow!.conditions} · {todayWindow!.max_wind_kmh} KM/H · {todayWindow!.max_precip_pct}% PRECIP · SCORE {todayWindow!.score}/100
          </p>
          <p className="mono text-[11px] text-fg mt-1.5 num tracking-[0.1em]">
            <span className="text-mark">{todayWindow!.kcal_easy}</span> KCAL EASY · <span className="text-mark">{todayWindow!.kcal_moderate}</span> KCAL MODERATE
          </p>
        </div>
      )}

      {upcoming.length > 0 && (
        <table className={`w-full text-[12px] ${compact ? "" : ""}`}>
          <thead>
            <tr className="border-b border-line">
              <th className="px-5 py-2 text-left industrial text-[9px] text-muted">WINDOW</th>
              <th className="px-2 py-2 text-left industrial text-[9px] text-muted hidden sm:table-cell">COND</th>
              <th className="px-2 py-2 text-right industrial text-[9px] text-muted">SCORE</th>
              <th className="px-5 py-2 text-right industrial text-[9px] text-muted">KCAL</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map((w) => (
              <tr key={w.date} className="border-b border-line last:border-0">
                <td className="px-5 py-2">
                  <p className="mono text-[11px] tracking-[0.1em] text-fg uppercase truncate">{w.label}</p>
                  <p className="mono text-[9.5px] text-muted num tracking-[0.1em]">{w.avg_temp_c}°C · {w.ride_minutes} MIN</p>
                </td>
                <td className="px-2 py-2 hidden sm:table-cell">
                  <p className="mono text-[10px] text-muted uppercase tracking-[0.1em] truncate">{w.conditions}</p>
                  <p className="mono text-[9.5px] text-muted num">{w.max_wind_kmh}KM/H · {w.max_precip_pct}%</p>
                </td>
                <td className="px-2 py-2 text-right mono text-[11px] num text-fg">{w.score}<span className="text-line2">/100</span></td>
                <td className="px-5 py-2 text-right mono text-[10.5px] num text-fg tracking-[0.08em]">{w.kcal_easy}–{w.kcal_moderate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
