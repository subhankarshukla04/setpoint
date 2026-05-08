export function Wordmark({ size = 16 }: { size?: number }) {
  return (
    <span
      className="display font-bold tracking-tighter3 leading-none"
      style={{ fontSize: size }}
    >
      SETPOINT
      <sup className="mono text-[0.45em] tracking-normal text-muted ml-0.5 align-super">™</sup>
    </span>
  );
}

export function SubLock({ children }: { children: React.ReactNode }) {
  return (
    <p className="industrial text-[9px] text-muted mt-1">{children}</p>
  );
}
