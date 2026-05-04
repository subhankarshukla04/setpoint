"""knowledge-service + app-data — single FastAPI process."""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from datetime import date, datetime, timezone
from pathlib import Path

import structlog
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .appdb import AppStore, seed_if_empty, seed_programme, seed_injuries_if_empty
from .coach import coach_answer
from .db import KBStore
from .embed import embed_query
from .ingest import ingest_wiki
from .programme import (
    programme_today, programme_week, current_phase, is_training_day,
    catalog_summary, catalog_actions, INJURY_CATALOG,
)
from .weather import cycling_suggestions

log = structlog.get_logger()

WIKI_DIR = Path(os.environ.get("KB_WIKI_DIR", "./research/wiki")).resolve()
CITATIONS_PATH = Path(os.environ.get("KB_CITATIONS", "./research/citations.json")).resolve()
KB_DB_PATH = Path(os.environ.get("KB_DB_PATH", "./services/knowledge-service/data/kb.sqlite")).resolve()
APP_DB_PATH = Path(os.environ.get("APP_DB_PATH", "./data/cutrack.db")).resolve()

store: KBStore | None = None
app_store: AppStore | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global store, app_store
    KB_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    store = KBStore(KB_DB_PATH)
    store.init_schema()
    app_store = AppStore(APP_DB_PATH)
    seed_if_empty(app_store)
    seed_programme(app_store)  # always upsert spec foods + plan
    seed_injuries_if_empty(app_store)
    log.info("startup", kb=str(KB_DB_PATH), app=str(APP_DB_PATH))
    yield
    if store: store.close()
    if app_store: app_store.close()


app = FastAPI(title="cutrack-services", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def _today() -> str:
    return date.today().isoformat()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── KB ──────────────────────────────────────────────────────────────
class SearchRequest(BaseModel):
    query: str = Field(min_length=1)
    k: int = 5
    alpha: float = 0.5


class CoachRequest(BaseModel):
    question: str = Field(min_length=1)
    k: int = 3
    model: str | None = None


@app.get("/health")
def health():
    if not store or not app_store:
        return {"status": "starting"}
    return {
        "status": "ok",
        "articles": store.article_count(), "chunks": store.chunk_count(),
        "foods": app_store.conn.execute("SELECT count(*) FROM foods").fetchone()[0],
        "sets_today": len(app_store.sets_for_day(_today())),
        "today": _today(),
    }


@app.post("/search")
def search(req: SearchRequest):
    if not store: raise HTTPException(503, "store not ready")
    qvec = embed_query(req.query)
    return {"results": store.hybrid_search(req.query, query_embedding=qvec, k=req.k, alpha=req.alpha)}


@app.get("/article/{topic_slug}")
def article(topic_slug: str):
    if not store: raise HTTPException(503, "store not ready")
    art = store.get_article(topic_slug)
    if not art: raise HTTPException(404, f"no article {topic_slug}")
    return art


@app.get("/citations")
def citations():
    if not CITATIONS_PATH.exists():
        raise HTTPException(404, "citations.json missing")
    return CITATIONS_PATH.read_text()


@app.post("/reindex")
def reindex():
    if not store: raise HTTPException(503, "store not ready")
    stats = ingest_wiki(store, WIKI_DIR, CITATIONS_PATH)
    log.info("kb.reindex", **stats)
    return stats


def _user_context() -> str:
    if not app_store: return ""
    today_str = _today()
    today_d = date.today()
    prog = programme_today(today_d, app_store.active_injuries())
    macros = app_store.macros_for_day(today_str)
    sets = app_store.sets_for_day(today_str)
    ema = app_store.weight_ewma()
    t = prog["targets"]
    lines = [
        f"athlete: 22M, 6'2\", cutting 96→82kg · started 2026-04-04",
        f"today = {today_str} · phase {prog['phase']} · week {prog['week_of_cut']}/12 · {prog['day_type']} day",
        f"target: {t['kcal']} kcal · P {t['protein_g']} · C {t['carb_g']} · F {t['fat_g']}",
        f"workout: {prog['workout']['workout']}" + (f" · {prog['workout'].get('notes','')}" if prog['workout'].get('notes') else ''),
    ]
    lines.append(
        f"weight: current {ema['current']} kg, EMA {ema['ema']} kg, n={ema['n']}"
        if ema.get("ema") is not None else "weight: no entries"
    )
    lines.append(f"macros today: {macros['kcal']} kcal · P {macros['protein_g']} · C {macros['carb_g']} · F {macros['fat_g']}")
    if sets:
        recent = "; ".join(
            f"{s['exercise']} {s['weight_kg']}kg×{s['reps']} RIR{s['rir'] if s['rir'] is not None else '?'}"
            for s in sets[-6:]
        )
        lines.append(f"sets today: {recent}")
    else:
        lines.append("sets today: none")
    score = app_store.readiness_score()
    lines.append(f"readiness: {score['level']} ({score['reason']})")
    for inj in prog["injuries"]:
        lines.append(f"⚠ active injury [{inj['label']}]: {inj['rule']}")
    return "\n".join(lines)


@app.post("/coach")
def coach(req: CoachRequest):
    if not store: raise HTTPException(503, "store not ready")
    qvec = embed_query(req.question)
    chunks = store.hybrid_search(req.question, query_embedding=qvec, k=req.k, alpha=0.5)
    if not chunks:
        return {"answer": "No KB matches for that question.", "model": None, "chunks": []}
    return coach_answer(req.question, chunks, model=req.model, user_context=_user_context())


# ── App data ────────────────────────────────────────────────────────
class SetIn(BaseModel):
    exercise: str = Field(min_length=1)
    weight_kg: float
    reps: int
    rir: int | None = None
    notes: str | None = None
    day: str | None = None


class WeightIn(BaseModel):
    weight_kg: float
    day: str | None = None


class MealIn(BaseModel):
    food_id: int
    grams: float
    day: str | None = None


class FoodIn(BaseModel):
    name: str; serving_g: float; kcal: float
    protein_g: float; carb_g: float; fat_g: float
    source: str | None = None; favorite: int = 0


class PlanDayIn(BaseModel):
    dow: int; label: str; workout: str
    exercises: list[dict]
    kcal: int; protein_g: int; carb_g: int; fat_g: int
    notes: str | None = ""


@app.post("/sets")
def log_set(req: SetIn):
    if not app_store: raise HTTPException(503, "app not ready")
    sid = app_store.log_set(day=req.day or _today(), logged_at=_now(),
        exercise=req.exercise, weight_kg=req.weight_kg, reps=req.reps,
        rir=req.rir, notes=req.notes)
    return {"id": sid}


@app.get("/sets/last/{exercise}")
def last_sets(exercise: str, limit: int = 12):
    if not app_store: raise HTTPException(503, "app not ready")
    return {"results": app_store.last_for_exercise(exercise, limit=limit)}


@app.get("/exercises")
def exercises():
    if not app_store: raise HTTPException(503, "app not ready")
    return {"results": app_store.exercise_names()}


@app.post("/weights")
def log_weight(req: WeightIn):
    if not app_store: raise HTTPException(503, "app not ready")
    app_store.log_weight(day=req.day or _today(), weight_kg=req.weight_kg, logged_at=_now())
    return {"ema": app_store.weight_ewma()}


@app.get("/weights")
def get_weights(limit: int = 60):
    if not app_store: raise HTTPException(503, "app not ready")
    return {"results": app_store.weights(limit=limit), "ema": app_store.weight_ewma()}


@app.get("/foods")
def foods(q: str = "", favorites_only: bool = False, limit: int = 20):
    if not app_store: raise HTTPException(503, "app not ready")
    if favorites_only:
        return {"results": app_store.favorite_foods(limit=limit)}
    if q:
        return {"results": app_store.search_foods(q, limit=limit)}
    return {"results": app_store.favorite_foods(limit=limit)}


@app.post("/foods")
def add_food(req: FoodIn):
    if not app_store: raise HTTPException(503, "app not ready")
    fid = app_store.upsert_food(req.model_dump())
    return {"id": fid}


@app.post("/meals")
def log_meal(req: MealIn):
    if not app_store: raise HTTPException(503, "app not ready")
    mid = app_store.log_meal(day=req.day or _today(), logged_at=_now(),
        food_id=req.food_id, grams=req.grams)
    return {"id": mid, "macros": app_store.macros_for_day(req.day or _today())}


@app.delete("/meals/{meal_id}")
def delete_meal(meal_id: int):
    if not app_store: raise HTTPException(503, "app not ready")
    app_store.delete_meal(meal_id)
    return {"ok": True}


@app.get("/day/{day}")
def day_summary(day: str):
    if not app_store: raise HTTPException(503, "app not ready")
    return {"day": day,
            "sets": app_store.sets_for_day(day),
            "meals": app_store.meals_for_day(day),
            "macros": app_store.macros_for_day(day)}


@app.get("/today")
def today():
    return day_summary(_today())


class ReadinessIn(BaseModel):
    sleep_hours: float | None = None
    soreness: int | None = None
    hrv_rmssd: float | None = None
    notes: str | None = None
    day: str | None = None


@app.post("/readiness")
def log_readiness(req: ReadinessIn):
    if not app_store: raise HTTPException(503, "app not ready")
    app_store.log_readiness(
        day=req.day or _today(),
        sleep_hours=req.sleep_hours, soreness=req.soreness,
        hrv_rmssd=req.hrv_rmssd, notes=req.notes, logged_at=_now(),
    )
    return {"score": app_store.readiness_score()}


@app.get("/readiness")
def readiness_today():
    if not app_store: raise HTTPException(503, "app not ready")
    return {
        "today": app_store.readiness_for_day(_today()),
        "score": app_store.readiness_score(),
        "recent": app_store.readiness_recent(7),
    }


@app.get("/review")
def weekly_review():
    if not app_store: raise HTTPException(503, "app not ready")
    return app_store.weekly_review()


@app.get("/programme/today")
def programme_today_endpoint():
    if not app_store: raise HTTPException(503, "app not ready")
    out = programme_today(date.today(), app_store.active_injuries())
    cyc = cycling_suggestions()
    today_iso = date.today().isoformat()
    out["cardio"] = {
        "available": cyc.get("available", False),
        "today_window": next((w for w in cyc.get("windows", [])
                              if w["date"] == today_iso), None),
        "next_best": [w for w in cyc.get("windows", []) if w["date"] != today_iso][:2],
    }
    return out


@app.get("/programme/week")
def programme_week_endpoint():
    if not app_store: raise HTTPException(503, "app not ready")
    out = programme_week(date.today(), app_store.active_injuries())
    out["cardio"] = cycling_suggestions()
    return out


@app.get("/weather/cycling")
def weather_cycling():
    return cycling_suggestions()


@app.post("/programme/reseed")
def programme_reseed():
    if not app_store: raise HTTPException(503, "app not ready")
    return seed_programme(app_store)


# ── injuries ────────────────────────────────────────────────────────
@app.get("/injuries")
def list_injuries():
    if not app_store: raise HTTPException(503, "app not ready")
    rows = {r["name"]: r for r in app_store.list_injuries()}
    out = []
    for cat in catalog_summary():
        actions = catalog_actions(cat["name"])
        row = rows.get(cat["name"], {})
        out.append({
            **cat,
            "active": bool(row.get("active", 0)),
            "since": row.get("since"),
            "notes": row.get("notes"),
            **actions,
        })
    return {"injuries": out}


class InjuryToggleIn(BaseModel):
    active: bool
    since: str | None = None
    notes: str | None = None


@app.post("/injuries/{name}")
def toggle_injury(name: str, req: InjuryToggleIn):
    if not app_store: raise HTTPException(503, "app not ready")
    if name not in INJURY_CATALOG:
        raise HTTPException(404, f"unknown injury '{name}'. choose from {list(INJURY_CATALOG.keys())}")
    app_store.set_injury(name, active=req.active, since=req.since, notes=req.notes)
    return {"ok": True, "name": name, "active": req.active}


@app.get("/plan")
def get_plan():
    if not app_store: raise HTTPException(503, "app not ready")
    return {"days": app_store.get_plan()}


@app.put("/plan/{dow}")
def upsert_plan_day(dow: int, req: PlanDayIn):
    if not app_store: raise HTTPException(503, "app not ready")
    payload = req.model_dump()
    payload["dow"] = dow
    app_store.upsert_plan_day(payload)
    return {"ok": True}
