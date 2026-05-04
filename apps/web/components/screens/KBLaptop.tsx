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
    try { const r = await search(q, 8); setResults(r.results); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold mb-4">Knowledge base</h2>
      <div className="flex gap-2 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="search 27 articles"
          className="flex-1 bg-card rounded-xl px-4 py-2 text-sm outline-none border border-transparent focus:border-line" />
        <button onClick={go} className="bg-fg text-bg rounded-xl px-4 text-sm font-medium">Search</button>
      </div>
      {loading && <p className="text-sm text-muted">searching…</p>}
      <div className="space-y-3">
        {results.map((r) => (
          <div key={r.chunk_id} className="bg-card rounded-xl p-4">
            <p className="text-xs text-muted">{r.pillar} · {r.topic} §{r.heading || "intro"} · score {r.score}</p>
            <p className="text-sm mt-1 line-clamp-3">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
