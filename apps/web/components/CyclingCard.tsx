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
    <section className="rounded-2xl border border-line bg-card p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">Bike Share Toronto — best windows</p>
        <span className="text-[10px] text-muted">~18 kg bike · MET 7 easy / 8.5 mod</span>
      </div>
      {hasToday && (
        <div className="mt-3 rounded-xl border border-accent/40 bg-accent/5 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-accent">TODAY · {todayWindow!.label}</p>
            <p className="text-xs text-muted">{todayWindow!.ride_minutes} min ride</p>
          </div>
          <p className="text-xs text-muted mt-1">
            {todayWindow!.avg_temp_c}°C · {todayWindow!.conditions} · {todayWindow!.max_wind_kmh} km/h wind · {todayWindow!.max_precip_pct}% precip · score {todayWindow!.score}
          </p>
          <p className="text-xs text-fg mt-1">
            ≈ <span className="text-accent">{todayWindow!.kcal_easy}</span> kcal easy · <span className="text-accent">{todayWindow!.kcal_moderate}</span> kcal moderate
          </p>
        </div>
      )}
      {upcoming.length > 0 && (
        <ul className={`${compact ? "mt-2" : "mt-3"} divide-y divide-line text-sm`}>
          {upcoming.map((w) => (
            <li key={w.date} className="py-2 flex justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate">{w.label}</p>
                <p className="text-xs text-muted truncate">
                  {w.avg_temp_c}°C · {w.conditions} · {w.max_wind_kmh} km/h · {w.max_precip_pct}% precip
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-fg">{w.kcal_easy}–{w.kcal_moderate} kcal</p>
                <p className="text-[10px] text-muted">{w.ride_minutes} min · {w.score}/100</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {!hasToday && upcoming.length === 0 && (
        <p className="text-xs text-muted mt-2">No good cycling windows in the next 7 days.</p>
      )}
    </section>
  );
}
