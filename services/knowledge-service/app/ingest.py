"""Walk research/wiki/, parse front-matter + body, chunk by H2, embed, store."""
from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import frontmatter
import structlog

from .db import KBStore
from .embed import embed_texts

log = structlog.get_logger()

CITE_RE = re.compile(r"\[\^([a-zA-Z0-9_\-]+)\]")


def _hash(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def _split_chunks(body: str) -> list[tuple[str | None, str]]:
    parts = re.split(r"^(## .+)$", body, flags=re.MULTILINE)
    out: list[tuple[str | None, str]] = []
    if parts and not parts[0].lstrip().startswith("##"):
        head = parts.pop(0).strip()
        if head:
            out.append((None, head))
    while parts:
        heading = parts.pop(0).lstrip("# ").strip()
        text = parts.pop(0).strip() if parts else ""
        if text:
            out.append((heading, text))
    return out


def ingest_wiki(store: KBStore, wiki_dir: Path, citations_path: Path) -> dict:
    started = datetime.now(timezone.utc)
    if citations_path.exists():
        cites = json.loads(citations_path.read_text())
        store.upsert_citations(cites.get("citations", {}))

    indexed = chunked = skipped = 0
    for md in sorted(wiki_dir.rglob("*.md")):
        if md.name == "_index.md":
            continue
        post = frontmatter.load(md)
        meta = post.metadata
        topic = meta.get("topic")
        if not topic:
            log.warning("kb.ingest.skip", file=str(md))
            skipped += 1
            continue

        body = post.content
        title_m = re.search(r"^# (.+)$", body, re.MULTILINE)
        title = title_m.group(1).strip() if title_m else topic
        sum_m = re.search(r"^> (.+)$", body, re.MULTILINE)
        summary = sum_m.group(1).strip() if sum_m else ""

        store.upsert_article({
            "topic": topic, "pillar": meta.get("pillar", ""),
            "confidence": meta.get("confidence", "medium"),
            "last_reviewed": str(meta.get("last_reviewed", "")),
            "applies_to": json.dumps(meta.get("applies_to", [])),
            "related": json.dumps(meta.get("related", [])),
            "sources": json.dumps(meta.get("sources", [])),
            "title": title, "summary": summary, "body": body,
            "content_hash": _hash(body), "indexed_at": started.isoformat(),
        })

        chunks = _split_chunks(body)
        embs = embed_texts([c[1] for c in chunks])
        for i, ((heading, text), emb) in enumerate(zip(chunks, embs)):
            cite_ids = sorted(set(CITE_RE.findall(text)))
            store.insert_chunk(topic, i, heading, text, cite_ids, emb)
            chunked += 1
        indexed += 1

    store.commit()
    return {
        "articles_indexed": indexed, "chunks_indexed": chunked, "skipped": skipped,
        "took_ms": int((datetime.now(timezone.utc) - started).total_seconds() * 1000),
        "embed_model": "all-MiniLM-L6-v2",
    }
