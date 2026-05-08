"use client";
import { useEffect, useRef, useState } from "react";
import { coach, type KBChunk } from "@/lib/api";

type Msg = { role: "user" | "assistant"; text: string; chunks?: KBChunk[]; model?: string | null };

const SUGGESTIONS = [
  "should I deload this week",
  "left elbow hurts inside, what should I do today",
  "how do I stop binge eating",
  "best protein-rich meal under 5 dollars",
];

export default function CoachLaptop() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length, loading]);

  async function ask(q?: string) {
    const text = (q ?? input).trim();
    if (!text || loading) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const r = await coach(text, 3);
      setMsgs((m) => [...m, { role: "assistant", text: r.answer, chunks: r.chunks, model: r.model }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", text: `// ERROR · ${(e as Error).message}` }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] max-w-4xl">
      <header className="border-b border-line pb-5 mb-5">
        <p className="industrial text-[10px] text-muted">CONSOLE / CONSULT</p>
        <h2 className="display stencil text-[60px] leading-[0.92] text-fg mt-2">CONSULT.</h2>
        <p className="mono text-[11px] tracking-[0.14em] text-muted mt-3">"KB-GROUNDED. CITATIONS LOOK LIKE [TOPIC §HEADING]."</p>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto border border-line bg-card2 scanlines mono text-[12.5px] leading-relaxed">
        {msgs.length === 0 && (
          <div className="p-5 space-y-3">
            <p className="text-muted">{">"} READY · type a query, or pick:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)}
                  className="text-[10.5px] tracking-[0.08em] uppercase px-2.5 py-1 border border-line text-muted hover:text-mark hover:border-mark/50">
                  ▸ {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="divide-y divide-line">
          {msgs.map((m, i) => (
            <div key={i} className="px-5 py-3 grid grid-cols-[60px_1fr] gap-3">
              <span className={`text-[10px] tracking-[0.18em] ${m.role === "user" ? "text-fg" : "text-mark"}`}>
                {String(i + 1).padStart(3, "0")}<br />
                {m.role === "user" ? "ASK" : "→KB"}
              </span>
              <div className="min-w-0">
                <p className="whitespace-pre-wrap text-fg/95">{m.text}</p>
                {m.chunks && m.chunks.length > 0 && (
                  <p className="text-[10px] text-muted mt-2 tracking-[0.08em]">
                    <span className="text-line2">SOURCES · </span>
                    {m.chunks.map((c, j) => (
                      <span key={j}>
                        <span className="text-mark">[{c.topic} §{c.heading || "intro"}]</span>
                        {j < m.chunks!.length - 1 && " · "}
                      </span>
                    ))}
                    {m.model && <span className="text-line2"> · {m.model}</span>}
                  </p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="px-5 py-3 grid grid-cols-[60px_1fr] gap-3">
              <span className="text-[10px] tracking-[0.18em] text-mark">···<br />→KB</span>
              <p className="text-muted animate-pulse2">// COMPILING · KB·SCAN[27] · LLM·INFER…</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex border border-line border-t-0 bg-bg">
        <span className="mono text-[14px] text-mark self-center px-4 border-r border-line">{">"}</span>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="ask anything"
          className="flex-1 bg-transparent px-4 py-3 outline-none mono text-[13px] tracking-tightish" />
        <button onClick={() => ask()} disabled={loading}
          className="bg-fg text-ink mono font-bold tracking-[0.18em] uppercase px-5 text-[11px] hover:bg-mark transition-colors disabled:opacity-50">
          ▸ ASK
        </button>
      </div>
    </div>
  );
}
