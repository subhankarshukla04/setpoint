import { apiBase } from "./api";

type Pending = { id: string; path: string; body: unknown; method: "POST" | "DELETE"; ts: number };
const KEY = "cutrack:queue";

function load(): Pending[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(items: Pending[]) { localStorage.setItem(KEY, JSON.stringify(items)); }

export function pendingCount(): number { return load().length; }

export function enqueue(path: string, body: unknown, method: "POST" | "DELETE" = "POST") {
  const items = load();
  items.push({ id: crypto.randomUUID(), path, body, method, ts: Date.now() });
  save(items);
}

async function tryFlush() {
  const items = load();
  if (!items.length) return { flushed: 0, remaining: 0 };
  let flushed = 0;
  const failed: Pending[] = [];
  for (const it of items) {
    try {
      const r = await fetch(`${apiBase}${it.path}`, {
        method: it.method,
        headers: { "Content-Type": "application/json" },
        body: it.method === "DELETE" ? undefined : JSON.stringify(it.body),
      });
      if (r.ok) flushed++; else failed.push(it);
    } catch { failed.push(it); }
  }
  save(failed);
  return { flushed, remaining: failed.length };
}

let timer: ReturnType<typeof setInterval> | null = null;
export function startSyncLoop(onChange?: (n: number) => void) {
  if (typeof window === "undefined" || timer) return;
  const tick = async () => {
    try {
      const r = await fetch(`${apiBase}/health`, { signal: AbortSignal.timeout(2000) });
      if (r.ok) {
        const { flushed } = await tryFlush();
        if (flushed) onChange?.(pendingCount());
      }
    } catch { /* offline */ }
  };
  tick();
  timer = setInterval(tick, 30_000);
  window.addEventListener("online", tick);
  window.addEventListener("focus", tick);
}

export async function postOrQueue<T>(path: string, body: unknown): Promise<{ ok: boolean; data?: T }> {
  try {
    const r = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
    if (r.ok) return { ok: true, data: (await r.json()) as T };
    enqueue(path, body);
    return { ok: false };
  } catch {
    enqueue(path, body);
    return { ok: false };
  }
}
