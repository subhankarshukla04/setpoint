"use client";
import { useState } from "react";
import { search, type KBChunk } from "@/lib/api";

export default function KBLaptop() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<KBChunk[]>([]);
  const [loading, setLoading] = useState(false);

  async function go() {
    if (!q.trim()) return;
    setLoading(true);
    try { const r = await search(q, 12); setResults(r.results); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="border-b border-line pb-5">
        <p className="industrial text-[10px] text-muted">CATALOG / FIELD MANUAL</p>
        <h2 className="display stencil text-[60px] leading-[0.92] text-fg mt-2">MANUAL.</h2>
        <p className="mono text-[11px] tracking-[0.14em] text-muted mt-3">"GROUNDED PROSE. CITE BY [TOPIC §HEADING]."</p>
      </header>

      <div className="flex border border-line">
        <span className="mono text-[10px] tracking-[0.18em] text-muted self-center px-4 border-r border-line">{">"} QUERY</span>
        <input value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="search the index — 27 entries"
          className="flex-1 bg-transparent px-4 py-3 outline-none text-[13px] tracking-tightish" />
        <button onClick={go}
          className="bg-fg text-ink mono font-bold tracking-[0.18em] uppercase px-5 text-[11px] hover:bg-mark transition-colors">
          ▸ GO
        </button>
      </div>
      {loading && <p className="mono text-[10px] tracking-[0.16em] text-muted">// COMPILING…</p>}

      <div className="border border-line divide-y divide-line">
        {results.length === 0 && !loading && (
          <p className="mono text-[10px] tracking-[0.14em] text-muted px-5 py-4 italic">// EMPTY · ENTER A QUERY</p>
        )}
        {results.map((r, i) => {
          const id = `${(r.pillar ?? "?").slice(0, 1).toUpperCase()}.${String(i + 1).padStart(2, "0")}`;
          return (
            <article key={r.chunk_id} className="px-5 py-4 hover:bg-card2 transition-colors">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="flex items-baseline gap-3 min-w-0">
                  <span className="mono text-[10px] tracking-[0.18em] text-mark">[{id}]</span>
                  <span className="mono text-[10px] tracking-[0.14em] text-muted uppercase truncate">
                    {r.pillar} · {r.topic} §{r.heading || "INTRO"}
                  </span>
                </div>
                <span className="mono text-[9.5px] tracking-[0.14em] text-line2 num">SCORE {r.score}</span>
              </div>
              <p className="text-[13px] mt-2 leading-relaxed line-clamp-3 qmark text-fg/95">{r.text}</p>
              <button
                onClick={() => navigator.clipboard?.writeText(`[${r.topic} §${r.heading || "intro"}]`)}
                className="mt-2 mono text-[9px] tracking-[0.18em] text-muted hover:text-mark"
              >▸ COPY CITATION</button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
