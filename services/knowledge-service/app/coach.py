"""Coach: OpenRouter (Gemini) with KB context + user data stuffed in."""
from __future__ import annotations

import os

from openai import OpenAI

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = os.environ.get("OPENROUTER_COACH_MODEL", "google/gemini-2.0-flash-exp:free")

SYSTEM_TEMPLATE = """You are CutTrack's coach for Subh — 22M, 6'2", 96 kg, on a 12-week cut in Toronto.

You answer using the KB excerpts AND the user's live context below. If neither
covers the question, say "the KB doesn't cover this" and suggest the closest
relevant article.

Rules:
- Cite every KB-derived claim inline as [topic §heading] using the exact topic and heading from the excerpts.
- Reference the user's live context (sets, weight, macros) when relevant — don't guess.
- Default response length: under 100 words. Expand only if asked.
- Friendly, direct, no filler. No medical diagnosis — refer out per the KB's refer-out criteria.
- If the question touches injury or pain, surface the training_in_pain_decision_framework rule.

USER CONTEXT (today + recent):
{user_context}

KB EXCERPTS:
{context}
"""


def _format_context(chunks: list[dict]) -> str:
    blocks = []
    for c in chunks:
        head = c.get("heading") or "intro"
        blocks.append(f"### [{c['topic']} §{head}]\n{c['text']}")
    return "\n\n".join(blocks)


def coach_answer(question, chunks, model=None, user_context=""):
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return {"answer": "OPENROUTER_API_KEY not set. Add it to .env to enable the coach.",
                "model": None, "chunks": chunks}

    client = OpenAI(base_url=OPENROUTER_BASE_URL, api_key=api_key)
    system = SYSTEM_TEMPLATE.format(
        context=_format_context(chunks),
        user_context=user_context or "(no recent activity logged)",
    )
    resp = client.chat.completions.create(
        model=model or DEFAULT_MODEL,
        messages=[{"role": "system", "content": system},
                  {"role": "user", "content": question}],
        temperature=0.2,
        extra_headers={"HTTP-Referer": "http://localhost:3001", "X-Title": "CutTrack"},
    )
    return {
        "answer": resp.choices[0].message.content,
        "model": resp.model,
        "chunks": [{"topic": c["topic"], "heading": c.get("heading"), "score": c.get("score")} for c in chunks],
    }
