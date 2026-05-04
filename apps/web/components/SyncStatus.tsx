"use client";
import { useEffect, useState } from "react";
import { pendingCount, startSyncLoop } from "@/lib/queue";

export default function SyncStatus() {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(pendingCount());
    startSyncLoop(setN);
    const i = setInterval(() => setN(pendingCount()), 1000);
    return () => clearInterval(i);
  }, []);
  if (n === 0) return null;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-warn/20 text-warn">{n} queued</span>;
}
