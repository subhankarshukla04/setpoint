"""User-data SQLite: workouts, sets, meals, weights, plans."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    muscle TEXT, notes TEXT
);
CREATE TABLE IF NOT EXISTS sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    logged_at TEXT NOT NULL, day TEXT NOT NULL,
    exercise TEXT NOT NULL, weight_kg REAL NOT NULL,
    reps INTEGER NOT NULL, rir INTEGER, notes TEXT
);
CREATE INDEX IF NOT EXISTS sets_by_day ON sets(day);
CREATE INDEX IF NOT EXISTS sets_by_ex  ON sets(exercise);

CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE, serving_g REAL NOT NULL,
    kcal REAL NOT NULL, protein_g REAL NOT NULL,
    carb_g REAL NOT NULL, fat_g REAL NOT NULL,
    source TEXT, favorite INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    logged_at TEXT NOT NULL, day TEXT NOT NULL,
    food_id INTEGER NOT NULL REFERENCES foods(id), grams REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS meals_by_day ON meals(day);

CREATE TABLE IF NOT EXISTS weights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT NOT NULL UNIQUE,
    weight_kg REAL NOT NULL, logged_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plan_days (
    dow INTEGER PRIMARY KEY,
    label TEXT NOT NULL, workout TEXT NOT NULL,
    exercises TEXT NOT NULL,
    kcal INTEGER NOT NULL, protein_g INTEGER NOT NULL,
    carb_g INTEGER NOT NULL, fat_g INTEGER NOT NULL, notes TEXT
);

CREATE TABLE IF NOT EXISTS injuries (
    name TEXT PRIMARY KEY,
    active INTEGER NOT NULL DEFAULT 0,
    since TEXT,
    notes TEXT,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS readiness (
    day TEXT PRIMARY KEY,
    sleep_hours REAL,
    soreness INTEGER,         -- 1 (none) … 10 (severe)
    hrv_rmssd REAL,           -- optional
    notes TEXT,
    logged_at TEXT NOT NULL
);
"""


class AppStore:
    def __init__(self, db_path: Path):
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA)
        self.conn.commit()

    def get_plan(self):
        rows = self.conn.execute("SELECT * FROM plan_days ORDER BY dow").fetchall()
        out = []
        for r in rows:
            d = dict(r)
            d["exercises"] = json.loads(d["exercises"]) if d["exercises"] else []
            out.append(d)
        return out

    def upsert_plan_day(self, day):
        self.conn.execute(
            """INSERT INTO plan_days (dow, label, workout, exercises, kcal, protein_g, carb_g, fat_g, notes)
               VALUES (:dow, :label, :workout, :exercises, :kcal, :protein_g, :carb_g, :fat_g, :notes)
               ON CONFLICT(dow) DO UPDATE SET
                  label=excluded.label, workout=excluded.workout, exercises=excluded.exercises,
                  kcal=excluded.kcal, protein_g=excluded.protein_g,
                  carb_g=excluded.carb_g, fat_g=excluded.fat_g, notes=excluded.notes""",
            {**day, "exercises": json.dumps(day.get("exercises", []))},
        )
        self.conn.commit()

    def log_set(self, day, logged_at, exercise, weight_kg, reps, rir, notes=None):
        c = self.conn.cursor()
        c.execute(
            """INSERT INTO sets (logged_at, day, exercise, weight_kg, reps, rir, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (logged_at, day, exercise, weight_kg, reps, rir, notes),
        )
        self.conn.commit()
        return c.lastrowid

    def sets_for_day(self, day):
        return [dict(r) for r in self.conn.execute(
            "SELECT * FROM sets WHERE day = ? ORDER BY id", (day,)).fetchall()]

    def last_for_exercise(self, exercise, limit=12):
        return [dict(r) for r in self.conn.execute(
            "SELECT * FROM sets WHERE exercise = ? ORDER BY id DESC LIMIT ?",
            (exercise, limit)).fetchall()]

    def exercise_names(self):
        return [r["exercise"] for r in self.conn.execute(
            "SELECT DISTINCT exercise FROM sets ORDER BY exercise").fetchall()]

    def upsert_food(self, f):
        c = self.conn.cursor()
        c.execute(
            """INSERT INTO foods (name, serving_g, kcal, protein_g, carb_g, fat_g, source, favorite)
               VALUES (:name, :serving_g, :kcal, :protein_g, :carb_g, :fat_g, :source, :favorite)
               ON CONFLICT(name) DO UPDATE SET
                  serving_g=excluded.serving_g, kcal=excluded.kcal,
                  protein_g=excluded.protein_g, carb_g=excluded.carb_g,
                  fat_g=excluded.fat_g, source=excluded.source, favorite=excluded.favorite""",
            {**{"favorite": 0, "source": None}, **f},
        )
        self.conn.commit()
        return c.lastrowid or self.conn.execute(
            "SELECT id FROM foods WHERE name = ?", (f["name"],)).fetchone()["id"]

    def search_foods(self, q, limit=20):
        like = f"%{q.lower()}%"
        return [dict(r) for r in self.conn.execute(
            """SELECT * FROM foods WHERE lower(name) LIKE ?
               ORDER BY favorite DESC, name LIMIT ?""", (like, limit)).fetchall()]

    def favorite_foods(self, limit=12):
        return [dict(r) for r in self.conn.execute(
            "SELECT * FROM foods WHERE favorite = 1 ORDER BY name LIMIT ?", (limit,)).fetchall()]

    def log_meal(self, day, logged_at, food_id, grams):
        c = self.conn.cursor()
        c.execute("INSERT INTO meals (logged_at, day, food_id, grams) VALUES (?, ?, ?, ?)",
                  (logged_at, day, food_id, grams))
        self.conn.commit()
        return c.lastrowid

    def meals_for_day(self, day):
        rows = self.conn.execute(
            """SELECT m.id, m.logged_at, m.day, m.grams,
                      f.name, f.kcal, f.protein_g, f.carb_g, f.fat_g, f.serving_g
               FROM meals m JOIN foods f ON f.id = m.food_id
               WHERE m.day = ? ORDER BY m.id""", (day,)).fetchall()
        out = []
        for r in rows:
            d = dict(r)
            ratio = d["grams"] / d["serving_g"] if d["serving_g"] else 0
            d["kcal_total"] = round(d["kcal"] * ratio, 1)
            d["protein_total"] = round(d["protein_g"] * ratio, 1)
            d["carb_total"] = round(d["carb_g"] * ratio, 1)
            d["fat_total"] = round(d["fat_g"] * ratio, 1)
            out.append(d)
        return out

    def macros_for_day(self, day):
        meals = self.meals_for_day(day)
        return {
            "kcal": round(sum(m["kcal_total"] for m in meals), 1),
            "protein_g": round(sum(m["protein_total"] for m in meals), 1),
            "carb_g": round(sum(m["carb_total"] for m in meals), 1),
            "fat_g": round(sum(m["fat_total"] for m in meals), 1),
            "items": len(meals),
        }

    def delete_meal(self, meal_id):
        self.conn.execute("DELETE FROM meals WHERE id = ?", (meal_id,))
        self.conn.commit()

    def log_weight(self, day, weight_kg, logged_at):
        c = self.conn.cursor()
        c.execute(
            """INSERT INTO weights (day, weight_kg, logged_at) VALUES (?, ?, ?)
               ON CONFLICT(day) DO UPDATE SET
                 weight_kg=excluded.weight_kg, logged_at=excluded.logged_at""",
            (day, weight_kg, logged_at),
        )
        self.conn.commit()
        return c.lastrowid or 0

    def weights(self, limit=60):
        return [dict(r) for r in self.conn.execute(
            "SELECT * FROM weights ORDER BY day DESC LIMIT ?", (limit,)).fetchall()]

    def weight_ewma(self, alpha=0.1):
        rows = self.conn.execute("SELECT day, weight_kg FROM weights ORDER BY day ASC").fetchall()
        if not rows:
            return {"current": None, "ema": None, "n": 0}
        ema = rows[0]["weight_kg"]
        for r in rows[1:]:
            ema = alpha * r["weight_kg"] + (1 - alpha) * ema
        return {"current": rows[-1]["weight_kg"], "ema": round(ema, 2),
                "n": len(rows), "last_day": rows[-1]["day"]}

    # ── injuries ──────────────────────────────────────────────────────
    def list_injuries(self):
        return [dict(r) for r in self.conn.execute(
            "SELECT * FROM injuries ORDER BY name").fetchall()]

    def active_injuries(self):
        return [dict(r) for r in self.conn.execute(
            "SELECT * FROM injuries WHERE active = 1 ORDER BY name").fetchall()]

    def set_injury(self, name, active, since=None, notes=None, now=None):
        from datetime import datetime, timezone
        ts = now or datetime.now(timezone.utc).isoformat()
        self.conn.execute(
            """INSERT INTO injuries (name, active, since, notes, updated_at)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(name) DO UPDATE SET
                 active=excluded.active,
                 since=COALESCE(excluded.since, injuries.since),
                 notes=COALESCE(excluded.notes, injuries.notes),
                 updated_at=excluded.updated_at""",
            (name, 1 if active else 0, since, notes, ts),
        )
        self.conn.commit()

    # ── readiness ─────────────────────────────────────────────────────
    def log_readiness(self, day, sleep_hours, soreness, hrv_rmssd, notes, logged_at):
        self.conn.execute(
            """INSERT INTO readiness (day, sleep_hours, soreness, hrv_rmssd, notes, logged_at)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(day) DO UPDATE SET
                  sleep_hours=excluded.sleep_hours, soreness=excluded.soreness,
                  hrv_rmssd=excluded.hrv_rmssd, notes=excluded.notes,
                  logged_at=excluded.logged_at""",
            (day, sleep_hours, soreness, hrv_rmssd, notes, logged_at),
        )
        self.conn.commit()

    def readiness_recent(self, limit=14):
        return [dict(r) for r in self.conn.execute(
            "SELECT * FROM readiness ORDER BY day DESC LIMIT ?", (limit,)).fetchall()]

    def readiness_for_day(self, day):
        r = self.conn.execute("SELECT * FROM readiness WHERE day = ?", (day,)).fetchone()
        return dict(r) if r else None

    def readiness_score(self):
        """Green/amber/red per sleep_performance_elasticity rules.
        - red:   2+ consecutive nights >1h below 14d median, OR soreness >=8
        - amber: any night >1h below 14d median in last 2d, OR soreness 6-7
        - green: otherwise (or no data)"""
        rows = self.readiness_recent(limit=14)
        if not rows:
            return {"level": "green", "reason": "no readiness logged"}
        rows = list(reversed(rows))  # ascending by day
        sleeps = [r["sleep_hours"] for r in rows if r["sleep_hours"] is not None]
        if not sleeps:
            return {"level": "green", "reason": "no sleep data"}
        sorted_s = sorted(sleeps)
        median = sorted_s[len(sorted_s) // 2]
        last2 = rows[-2:]
        below_count = sum(
            1 for r in last2
            if r["sleep_hours"] is not None and r["sleep_hours"] < median - 1
        )
        max_sore = max((r["soreness"] for r in rows[-3:] if r["soreness"] is not None), default=0)

        if below_count >= 2 or max_sore >= 8:
            return {"level": "red", "reason": f"sleep <median−1h ×{below_count}; max soreness {max_sore}",
                    "median_sleep": median, "rule": "drop top set 5–10% per sleep_performance_elasticity"}
        if below_count >= 1 or max_sore >= 6:
            return {"level": "amber", "reason": f"sleep below median or soreness {max_sore}",
                    "median_sleep": median, "rule": "shave 5% off top set; drop last working set"}
        return {"level": "green", "reason": "all in range",
                "median_sleep": median, "rule": "train as planned"}

    # ── weekly review (e1RM per exercise + EMA slope + deload flag) ──
    def weekly_review(self):
        # e1RM: Brzycki = weight * (36 / (37 - reps)); take best per session per exercise
        rows = self.conn.execute(
            """SELECT exercise, day, weight_kg, reps
               FROM sets WHERE reps BETWEEN 1 AND 20
               ORDER BY exercise, day"""
        ).fetchall()
        from collections import defaultdict
        by_ex = defaultdict(list)
        for r in rows:
            e1rm = r["weight_kg"] * (36 / (37 - r["reps"])) if r["reps"] < 37 else 0
            by_ex[r["exercise"]].append({"day": r["day"], "e1rm": round(e1rm, 1), "weight": r["weight_kg"], "reps": r["reps"]})

        out = []
        for ex, hist in by_ex.items():
            best = {}
            for h in hist:
                if h["day"] not in best or h["e1rm"] > best[h["day"]]["e1rm"]:
                    best[h["day"]] = h
            days = sorted(best.keys())
            series = [best[d] for d in days]
            recent = series[-6:]
            trend = "flat"
            if len(recent) >= 3:
                first_avg = sum(s["e1rm"] for s in recent[:len(recent)//2]) / max(1, len(recent)//2)
                last_avg = sum(s["e1rm"] for s in recent[len(recent)//2:]) / max(1, len(recent) - len(recent)//2)
                pct = (last_avg - first_avg) / first_avg * 100 if first_avg else 0
                trend = "up" if pct > 1.5 else "down" if pct < -1.5 else "flat"
            out.append({"exercise": ex, "n": len(series), "latest_e1rm": series[-1]["e1rm"],
                        "trend": trend, "history": series[-12:]})
        out.sort(key=lambda x: -x["n"])

        # weight EMA slope: difference between last 7d EMA vs 7d before
        wrows = self.conn.execute("SELECT day, weight_kg FROM weights ORDER BY day ASC").fetchall()
        weight_slope = None
        if len(wrows) >= 14:
            half = len(wrows) // 2
            old = wrows[max(0, half-7):half]
            new = wrows[-7:]
            old_avg = sum(r["weight_kg"] for r in old) / len(old)
            new_avg = sum(r["weight_kg"] for r in new) / len(new)
            pct_per_week = (new_avg - old_avg) / old_avg * 100
            weight_slope = round(pct_per_week, 2)

        # deload flag per deload_triggers.md (simplified)
        deload = False
        deload_reasons = []
        flat_exercises = sum(1 for x in out if x["trend"] == "flat" and x["n"] >= 4)
        if flat_exercises >= 2:
            deload = True
            deload_reasons.append(f"{flat_exercises} compound lifts flat ≥4 sessions")
        readiness = self.readiness_score()
        if readiness["level"] == "red":
            deload = True
            deload_reasons.append("readiness red")
        if weight_slope is not None and weight_slope < -1.2:
            deload_reasons.append(f"weight loss {weight_slope}%/wk exceeds 1.2% guardrail")

        return {
            "lifts": out, "weight_slope_pct_per_week": weight_slope,
            "readiness": readiness, "deload_recommended": deload,
            "deload_reasons": deload_reasons,
        }

    def close(self):
        self.conn.close()


SEED_FOODS = [
    {"name": "Bone-in chicken thigh (cooked)", "serving_g": 100, "kcal": 215, "protein_g": 27, "carb_g": 0, "fat_g": 12, "source": "freshco_bathurst", "favorite": 1},
    {"name": "Whole egg, large", "serving_g": 50, "kcal": 72, "protein_g": 6.3, "carb_g": 0.4, "fat_g": 5, "source": "freshco_bathurst", "favorite": 1},
    {"name": "Greek yogurt 0% (Oikos)", "serving_g": 100, "kcal": 59, "protein_g": 10.3, "carb_g": 3.6, "fat_g": 0.4, "source": "freshco_bathurst", "favorite": 1},
    {"name": "Cottage cheese 2%", "serving_g": 100, "kcal": 84, "protein_g": 11, "carb_g": 4.5, "fat_g": 2.3, "source": "freshco_bathurst"},
    {"name": "Whey protein (Costco)", "serving_g": 30, "kcal": 120, "protein_g": 24, "carb_g": 3, "fat_g": 1.5, "source": "costco_downsview", "favorite": 1},
    {"name": "Rolled oats (dry)", "serving_g": 50, "kcal": 190, "protein_g": 6.5, "carb_g": 33, "fat_g": 3.5, "source": "bulk_barn", "favorite": 1},
    {"name": "Jasmine rice (cooked)", "serving_g": 100, "kcal": 130, "protein_g": 2.7, "carb_g": 28, "fat_g": 0.3, "source": "costco_downsview", "favorite": 1},
    {"name": "Russet potato (cooked)", "serving_g": 100, "kcal": 87, "protein_g": 1.9, "carb_g": 20, "fat_g": 0.1, "source": "freshco_bathurst"},
    {"name": "Dried lentils (cooked)", "serving_g": 100, "kcal": 116, "protein_g": 9, "carb_g": 20, "fat_g": 0.4, "source": "bulk_barn"},
    {"name": "Frozen broccoli", "serving_g": 100, "kcal": 28, "protein_g": 2.6, "carb_g": 5, "fat_g": 0.3, "source": "freshco_bathurst", "favorite": 1},
    {"name": "Frozen spinach", "serving_g": 100, "kcal": 23, "protein_g": 3, "carb_g": 3.6, "fat_g": 0.4, "source": "freshco_bathurst"},
    {"name": "Frozen mixed berries", "serving_g": 100, "kcal": 50, "protein_g": 0.7, "carb_g": 12, "fat_g": 0.3, "source": "freshco_bathurst"},
    {"name": "Banana, medium", "serving_g": 118, "kcal": 105, "protein_g": 1.3, "carb_g": 27, "fat_g": 0.4, "source": "freshco_bathurst"},
    {"name": "Olive oil", "serving_g": 14, "kcal": 124, "protein_g": 0, "carb_g": 0, "fat_g": 14, "source": "freshco_bathurst"},
    {"name": "Almonds", "serving_g": 28, "kcal": 164, "protein_g": 6, "carb_g": 6, "fat_g": 14, "source": "costco_downsview"},
    {"name": "Canned tuna in water", "serving_g": 85, "kcal": 90, "protein_g": 20, "carb_g": 0, "fat_g": 1, "source": "freshco_bathurst"},
    {"name": "Whole-wheat bread, slice", "serving_g": 32, "kcal": 80, "protein_g": 4, "carb_g": 14, "fat_g": 1, "source": "freshco_bathurst"},
    {"name": "Cabbage", "serving_g": 100, "kcal": 25, "protein_g": 1.3, "carb_g": 5.8, "fat_g": 0.1, "source": "freshco_bathurst"},
    {"name": "Carrot", "serving_g": 100, "kcal": 41, "protein_g": 0.9, "carb_g": 9.6, "fat_g": 0.2, "source": "freshco_bathurst"},
    {"name": "Apple, medium", "serving_g": 182, "kcal": 95, "protein_g": 0.5, "carb_g": 25, "fat_g": 0.3, "source": "freshco_bathurst"},
]

SEED_PLAN = [
    {"dow": 0, "label": "Mon", "workout": "Push A",
     "exercises": [{"name": "Bench (smith)", "sets": 3, "reps": "6–8", "rir": 1},
                   {"name": "Incline DB press", "sets": 3, "reps": "8–10", "rir": 1},
                   {"name": "Cable fly", "sets": 3, "reps": "10–12", "rir": 0},
                   {"name": "Tricep pushdown", "sets": 3, "reps": "10–12", "rir": 0},
                   {"name": "Lateral raise", "sets": 4, "reps": "12–15", "rir": 0}],
     "kcal": 2400, "protein_g": 200, "carb_g": 240, "fat_g": 55, "notes": ""},
    {"dow": 1, "label": "Tue", "workout": "Pull A",
     "exercises": [{"name": "Lat pulldown", "sets": 3, "reps": "8–10", "rir": 1},
                   {"name": "Chest-supp row", "sets": 3, "reps": "8–10", "rir": 1},
                   {"name": "Cable curl", "sets": 3, "reps": "10–12", "rir": 0},
                   {"name": "Face pull", "sets": 3, "reps": "12–15", "rir": 0}],
     "kcal": 2400, "protein_g": 200, "carb_g": 240, "fat_g": 55, "notes": ""},
    {"dow": 2, "label": "Wed", "workout": "Legs A",
     "exercises": [{"name": "Hack squat", "sets": 3, "reps": "6–8", "rir": 1},
                   {"name": "RDL", "sets": 3, "reps": "8–10", "rir": 1},
                   {"name": "Leg curl", "sets": 3, "reps": "10–12", "rir": 0},
                   {"name": "Calf raise", "sets": 4, "reps": "10–12", "rir": 0}],
     "kcal": 2400, "protein_g": 200, "carb_g": 260, "fat_g": 55, "notes": "carb-led day"},
    {"dow": 3, "label": "Thu", "workout": "Rest", "exercises": [],
     "kcal": 2200, "protein_g": 200, "carb_g": 200, "fat_g": 60, "notes": "low day"},
    {"dow": 4, "label": "Fri", "workout": "Push B",
     "exercises": [{"name": "Incline smith", "sets": 3, "reps": "6–8", "rir": 1},
                   {"name": "Flat DB press", "sets": 3, "reps": "8–10", "rir": 1},
                   {"name": "Pec deck", "sets": 3, "reps": "12–15", "rir": 0},
                   {"name": "Overhead tri extension", "sets": 3, "reps": "10–12", "rir": 0}],
     "kcal": 2400, "protein_g": 200, "carb_g": 240, "fat_g": 55, "notes": ""},
    {"dow": 5, "label": "Sat", "workout": "Pull B",
     "exercises": [{"name": "Pull-up (assisted ok)", "sets": 3, "reps": "6–10", "rir": 1},
                   {"name": "Cable row", "sets": 3, "reps": "8–12", "rir": 1},
                   {"name": "Hammer curl", "sets": 3, "reps": "10–12", "rir": 0},
                   {"name": "Reverse fly", "sets": 3, "reps": "12–15", "rir": 0}],
     "kcal": 2400, "protein_g": 200, "carb_g": 240, "fat_g": 55, "notes": ""},
    {"dow": 6, "label": "Sun", "workout": "Legs B",
     "exercises": [{"name": "Bulgarian split", "sets": 3, "reps": "8–10", "rir": 1},
                   {"name": "Leg press", "sets": 3, "reps": "10–12", "rir": 1},
                   {"name": "Seated leg curl", "sets": 3, "reps": "10–12", "rir": 0},
                   {"name": "Standing calf", "sets": 4, "reps": "8–10", "rir": 0}],
     "kcal": 2400, "protein_g": 200, "carb_g": 260, "fat_g": 55, "notes": "carb-led day"},
]


def seed_if_empty(store: AppStore) -> int:
    n = store.conn.execute("SELECT count(*) FROM foods").fetchone()[0]
    if n == 0:
        for f in SEED_FOODS:
            store.upsert_food(f)
    p = store.conn.execute("SELECT count(*) FROM plan_days").fetchone()[0]
    if p == 0:
        for day in SEED_PLAN:
            store.upsert_plan_day(day)
    return len(SEED_FOODS) if n == 0 else 0


def seed_injuries_if_empty(store: AppStore) -> int:
    n = store.conn.execute("SELECT count(*) FROM injuries").fetchone()[0]
    if n > 0:
        return 0
    # bootstrap medial_elbow ON (active per spec); other catalog entries OFF
    from .programme import INJURY_CATALOG
    for name in INJURY_CATALOG.keys():
        store.set_injury(name, active=(name == "medial_elbow"),
                         since="2026-04-?" if name == "medial_elbow" else None,
                         notes="bootstrapped from spec" if name == "medial_elbow" else None)
    return len(INJURY_CATALOG)


def seed_programme(store: AppStore) -> dict:
    """Force-upsert programme spec foods + plan. Idempotent."""
    from datetime import date
    from .programme import SPEC_FOODS, SPEC_PLAN, macros_for_today
    for f in SPEC_FOODS:
        store.upsert_food(f)
    today = date.today()
    macros = macros_for_today(today)
    for d in SPEC_PLAN:
        # Use today's phase macros as the plan-day defaults; individual days
        # can be overridden in the Plan editor.
        is_train = d["dow"] in {0, 1, 3, 4}
        from .programme import current_phase, PHASES
        phase = current_phase(today)
        kcal = phase["train_kcal"] if is_train else phase["rest_kcal"]
        # Reuse macro split from programme.macros_for_today (recompute here
        # so plan rows reflect day-type, not "today's" day-type).
        protein_g = phase["protein_g"]
        fat_g = round(kcal * 0.25 / 9)
        carb_g = max(0, round((kcal - protein_g * 4 - fat_g * 9) / 4))
        store.upsert_plan_day({
            **d, "kcal": kcal, "protein_g": protein_g,
            "carb_g": carb_g, "fat_g": fat_g,
        })
    return {"foods": len(SPEC_FOODS), "plan_days": len(SPEC_PLAN)}
