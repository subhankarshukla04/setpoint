"""SQLite store for KB chunks. FTS5 (BM25) + numpy cosine for vectors."""
from __future__ import annotations

import json
import sqlite3
import struct
from pathlib import Path
from typing import Any

import numpy as np

EMBED_DIM = 384


def _pack(vec: list[float]) -> bytes:
    return struct.pack(f"{len(vec)}f", *vec)


def _unpack(blob: bytes) -> np.ndarray:
    n = len(blob) // 4
    return np.array(struct.unpack(f"{n}f", blob), dtype=np.float32)


class KBStore:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._cache_matrix: np.ndarray | None = None
        self._cache_ids: list[int] = []

    def init_schema(self):
        c = self.conn.cursor()
        c.executescript(
            """
            CREATE TABLE IF NOT EXISTS articles (
                topic TEXT PRIMARY KEY,
                pillar TEXT NOT NULL,
                confidence TEXT NOT NULL,
                last_reviewed TEXT NOT NULL,
                applies_to TEXT,
                related TEXT,
                sources TEXT,
                title TEXT NOT NULL,
                summary TEXT NOT NULL,
                body TEXT NOT NULL,
                content_hash TEXT NOT NULL,
                indexed_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS chunks (
                chunk_id INTEGER PRIMARY KEY,
                topic TEXT NOT NULL REFERENCES articles(topic) ON DELETE CASCADE,
                ord INTEGER NOT NULL,
                heading TEXT,
                text TEXT NOT NULL,
                cite_ids TEXT,
                embedding BLOB
            );
            CREATE INDEX IF NOT EXISTS chunks_by_topic ON chunks(topic);
            CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
                text, content='chunks', content_rowid='chunk_id', tokenize='porter unicode61'
            );
            CREATE TABLE IF NOT EXISTS citations (
                cite_id TEXT PRIMARY KEY,
                payload TEXT NOT NULL
            );
            """
        )
        self.conn.commit()

    def article_count(self) -> int:
        return self.conn.execute("SELECT count(*) FROM articles").fetchone()[0]

    def chunk_count(self) -> int:
        return self.conn.execute("SELECT count(*) FROM chunks").fetchone()[0]

    def get_article(self, topic: str) -> dict[str, Any] | None:
        row = self.conn.execute("SELECT * FROM articles WHERE topic = ?", (topic,)).fetchone()
        if not row:
            return None
        d = dict(row)
        for k in ("applies_to", "related", "sources"):
            d[k] = json.loads(d[k]) if d.get(k) else []
        return d

    def _invalidate_vec_cache(self):
        self._cache_matrix = None
        self._cache_ids = []

    def _load_vec_cache(self):
        if self._cache_matrix is not None:
            return
        rows = self.conn.execute(
            "SELECT chunk_id, embedding FROM chunks WHERE embedding IS NOT NULL"
        ).fetchall()
        if not rows:
            self._cache_matrix = np.zeros((0, EMBED_DIM), dtype=np.float32)
            self._cache_ids = []
            return
        ids, vecs = [], []
        for r in rows:
            ids.append(r["chunk_id"])
            vecs.append(_unpack(r["embedding"]))
        self._cache_ids = ids
        self._cache_matrix = np.vstack(vecs)

    def hybrid_search(self, query, query_embedding=None, k=5, alpha=0.5):
        bm25_rank = {}
        try:
            rows = self.conn.execute(
                """SELECT c.chunk_id, bm25(chunks_fts) AS s
                   FROM chunks_fts JOIN chunks c ON c.chunk_id = chunks_fts.rowid
                   WHERE chunks_fts MATCH ? ORDER BY s LIMIT ?""",
                (query, k * 4),
            ).fetchall()
            for i, r in enumerate(rows):
                bm25_rank[r["chunk_id"]] = i + 1
        except sqlite3.OperationalError:
            pass

        vec_rank = {}
        if query_embedding is not None:
            self._load_vec_cache()
            if self._cache_matrix is not None and len(self._cache_ids):
                q = np.array(query_embedding, dtype=np.float32)
                qn = q / (np.linalg.norm(q) + 1e-9)
                mat = self._cache_matrix
                norms = np.linalg.norm(mat, axis=1) + 1e-9
                sims = mat @ qn / norms
                top_idx = np.argsort(-sims)[: k * 4]
                for i, idx in enumerate(top_idx):
                    vec_rank[self._cache_ids[int(idx)]] = i + 1

        all_ids = set(bm25_rank) | set(vec_rank)
        if not all_ids:
            return []

        scored = []
        for cid in all_ids:
            br = bm25_rank.get(cid, k * 10)
            vr = vec_rank.get(cid, k * 10)
            score = alpha * (1 / (60 + br)) + (1 - alpha) * (1 / (60 + vr))
            scored.append((score, cid))
        scored.sort(reverse=True)

        top_ids = [cid for _, cid in scored[:k]]
        placeholders = ",".join("?" * len(top_ids))
        rows = self.conn.execute(
            f"""SELECT c.chunk_id, c.topic, c.heading, c.text, c.cite_ids,
                       a.title, a.pillar, a.summary
                FROM chunks c JOIN articles a ON a.topic = c.topic
                WHERE c.chunk_id IN ({placeholders})""",
            top_ids,
        ).fetchall()
        by_id = {r["chunk_id"]: r for r in rows}

        out = []
        for score, cid in scored[:k]:
            r = by_id.get(cid)
            if not r:
                continue
            d = dict(r)
            d["cite_ids"] = json.loads(d["cite_ids"]) if d.get("cite_ids") else []
            d["score"] = round(float(score), 6)
            out.append(d)
        return out

    def upsert_article(self, art):
        c = self.conn.cursor()
        c.execute(
            """INSERT INTO articles (topic, pillar, confidence, last_reviewed, applies_to,
                                     related, sources, title, summary, body, content_hash, indexed_at)
               VALUES (:topic, :pillar, :confidence, :last_reviewed, :applies_to,
                       :related, :sources, :title, :summary, :body, :content_hash, :indexed_at)
               ON CONFLICT(topic) DO UPDATE SET
                  pillar=excluded.pillar, confidence=excluded.confidence,
                  last_reviewed=excluded.last_reviewed, applies_to=excluded.applies_to,
                  related=excluded.related, sources=excluded.sources, title=excluded.title,
                  summary=excluded.summary, body=excluded.body,
                  content_hash=excluded.content_hash, indexed_at=excluded.indexed_at""",
            art,
        )
        for (cid,) in c.execute("SELECT chunk_id FROM chunks WHERE topic = ?", (art["topic"],)).fetchall():
            c.execute("DELETE FROM chunks_fts WHERE rowid = ?", (cid,))
        c.execute("DELETE FROM chunks WHERE topic = ?", (art["topic"],))
        self._invalidate_vec_cache()

    def insert_chunk(self, topic, ord_, heading, text, cite_ids, embedding):
        c = self.conn.cursor()
        emb_blob = _pack(embedding) if embedding is not None else None
        c.execute(
            "INSERT INTO chunks (topic, ord, heading, text, cite_ids, embedding) VALUES (?, ?, ?, ?, ?, ?)",
            (topic, ord_, heading, text, json.dumps(cite_ids), emb_blob),
        )
        chunk_id = c.lastrowid
        c.execute("INSERT INTO chunks_fts(rowid, text) VALUES (?, ?)", (chunk_id, text))
        return chunk_id

    def upsert_citations(self, citations):
        c = self.conn.cursor()
        for cid, payload in citations.items():
            c.execute(
                "INSERT OR REPLACE INTO citations (cite_id, payload) VALUES (?, ?)",
                (cid, json.dumps(payload)),
            )

    def commit(self):
        self.conn.commit()
        self._invalidate_vec_cache()

    def close(self):
        self.conn.close()
