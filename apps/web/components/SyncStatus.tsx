"use client";
import { useEffect, useState } from "react";
import { pendingCount, startSyncLoop } from "@/lib/queue";

export default function SyncStatus() {
  const [n, setN] = useState(0);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setN(pendingCount());
    setOnline(navigator.onLine);
    startSyncLoop(setN);
    const i = setInterval(() => setN(pendingCount()), 1000);
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      clearInterval(i);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  let dot = "bg-mark";
  let text = "ONLINE · SYNCED";
  if (!online) { dot = "bg-flag animate-pulse2"; text = "OFFLINE"; }
  else if (n > 0) { dot = "bg-caution animate-pulse2"; text = `QUEUED · ${n}`; }

  return (
    <span className="inline-flex items-center gap-1.5 mono text-[9px] tracking-[0.18em] text-muted">
      <span className={`w-1.5 h-1.5 ${dot}`} />
      {text}
    </span>
  );
}
