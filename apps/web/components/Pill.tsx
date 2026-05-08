import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "warn" | "bad" | "muted";

const TONE: Record<Tone, string> = {
  neutral: "text-fg/85 border-line2",
  accent:  "text-mark border-mark/45",
  warn:    "text-caution border-caution/45",
  bad:     "text-flag border-flag/45",
  muted:   "text-muted border-line",
};

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-[1px] border text-[9px] font-bold uppercase tracking-[0.18em] mono ${TONE[tone]}`}
      style={{ lineHeight: "14px" }}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = "neutral" }: { tone?: Tone }) {
  const map: Record<Tone, string> = {
    neutral: "bg-fg/40",
    accent:  "bg-mark",
    warn:    "bg-caution",
    bad:     "bg-flag",
    muted:   "bg-muted",
  };
  return <span className={`inline-block w-1.5 h-1.5 ${map[tone]}`} />;
}
