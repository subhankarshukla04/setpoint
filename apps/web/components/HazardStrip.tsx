export function HazardStrip({ tone = "mark", label }: { tone?: "mark" | "flag"; label?: string }) {
  const cls = tone === "flag" ? "hazard-flag" : "hazard";
  return (
    <div className="relative">
      <div className={`h-1.5 w-full ${cls}`} />
      {label && (
        <p className="industrial text-[9px] text-muted mt-1">{label}</p>
      )}
    </div>
  );
}
