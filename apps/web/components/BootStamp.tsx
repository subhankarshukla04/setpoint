"use client";
import { useEffect, useState } from "react";

const KEY = "setpoint:bootstamp:lastShownAt";
const COOLDOWN_MS = 1000 * 60 * 30; // once per 30 min

export default function BootStamp() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let last = 0;
    try { last = Number(sessionStorage.getItem(KEY)) || 0; } catch {}
    if (Date.now() - last < COOLDOWN_MS) return;
    try { sessionStorage.setItem(KEY, String(Date.now())); } catch {}
    setShow(true);
    const a = setTimeout(() => setPhase(1), 350);
    const b = setTimeout(() => setPhase(2), 700);
    const c = setTimeout(() => setPhase(3), 1050);
    const d = setTimeout(() => setShow(false), 1700);
    return () => { [a, b, c, d].forEach(clearTimeout); };
  }, []);

  if (!show) return null;

  const date = new Date().toISOString().slice(0, 10);
  const time = new Date().toTimeString().slice(0, 5);

  return (
    <div className="fixed inset-0 z-[100] bg-bg flex items-center justify-center scanlines pointer-events-none animate-bootstamp">
      <div className="mono text-[11px] tracking-[0.2em] uppercase text-fg/90 max-w-[520px] w-full px-8 leading-relaxed">
        <p className="text-mark">SETPOINT™ <span className="text-muted">v0.1 / TORONTO</span></p>
        <p className="mt-3 text-muted">{">"} BOOT · {date} · {time}</p>
        {phase >= 1 && <p className="mt-1">{">"} SYS_OK <span className="text-muted">// kernel</span></p>}
        {phase >= 2 && <p className="mt-1">{">"} KB[27] LOADED <span className="text-muted">// pillars 4</span></p>}
        {phase >= 3 && <p className="mt-1 text-mark">{">"} READY <span className="text-muted">// operator: subhankar</span></p>}
      </div>
    </div>
  );
}
