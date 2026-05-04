"use client";
import { useState } from "react";
import { coach, type KBChunk } from "@/lib/api";

type Msg = { role: "user" | "assistant"; text: string; chunks?: KBChunk[]; model?: string | null };

const SUGGESTIONS = [
  "should I deload this week?",
  "my left elbow hurts inside, what should I do today",
  "how do I stop binge eating",
  "best protein-rich meal under $5",
];

export default function CoachLaptop() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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
      setMsgs((m) => [...m, { role: "assistant", text: `error: ${(e as Error).message}` }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-3xl flex flex-col h-[calc(100dvh-4rem)]">
      <h2 className="text-2xl font-semibold mb-4">Coach</h2>
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {msgs.length === 0 && (
          <div>
            <p className="text-sm text-muted mb-3">
              Grounded in your KB + today's logged data. Citations look like [topic §heading].
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)}
                  className="text-xs px-3 py-1.5 bg-card rounded-full text-muted hover:text-fg">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div className={`inline-block rounded-2xl px-4 py-2 max-w-[85%] text-sm ${m.role === "user" ? "bg-card" : "bg-card border border-line"}`}>
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.chunks && m.chunks.length > 0 && (
                <p className="text-xs text-muted mt-2">
                  {m.chunks.map((c) => `[${c.topic} §${c.heading || "intro"}]`).join(" · ")}
                  {m.model ? ` · ${m.model}` : ""}
                </p>
              )}
            </div>
          </div>
        ))}
        {loading && <p className="text-sm text-muted">thinking…</p>}
      </div>
      <div className="flex gap-2 border-t border-line pt-3">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="ask anything"
          className="flex-1 bg-card rounded-xl px-4 py-2 text-sm outline-none border border-transparent focus:border-line" />
        <button onClick={() => ask()} disabled={loading}
          className="bg-fg text-bg rounded-xl px-4 text-sm font-medium disabled:opacity-50">Ask</button>
      </div>
    </div>
  );
}
