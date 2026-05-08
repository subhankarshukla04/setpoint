"use client";
import { useEffect, useState } from "react";
import { getRecentPicks } from "@/lib/api";

export default function StreakStamp() {
  const [streak, setStreak] = useState<number | null>(null);
  useEffect(() => {
    getRecentPicks(60)
      .then((r) => {
        const days = r.picks.map((p) => p.day).sort().reverse();
        let s = 0;
        const today = new Date(); today.setHours(0,0,0,0);
        for (let i = 0; i < days.length; i++) {
          const d = new Date(days[i]); d.setHours(0,0,0,0);
          const expected = new Date(today); expected.setDate(today.getDate() - i);
          if (d.getTime() === expected.getTime()) s += 1;
          else break;
        }
        setStreak(s);
      })
      .catch(() => setStreak(0));
  }, []);

  if (streak == null) return null;
  return (
    <div className="border border-line2 px-2 py-1.5">
      <p className="industrial text-[9px] text-muted">STREAK / DAYS</p>
      <p className="display-num text-[20px] text-fg leading-none mt-0.5">{String(streak).padStart(2, "0")}</p>
    </div>
  );
}
