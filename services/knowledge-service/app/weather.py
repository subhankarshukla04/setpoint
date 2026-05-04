"""Weather + outdoor cycling window scorer.

Pulls 7-day hourly forecast from Open-Meteo (free, no API key) and finds
the best contiguous blocks for outdoor cycling — based on temp, precip
probability, wind, and daylight. Calorie estimate uses ~9 kcal/min for
~95 kg easy ride (~16–20 km/h, MET ≈ 6) per Compendium of Physical
Activities (Ainsworth 2011).
"""
from __future__ import annotations

import time
import urllib.request
import urllib.parse
import json
from datetime import datetime

# Toronto (Hart House)
DEFAULT_LAT = 43.6629
DEFAULT_LON = -79.3957

# Bike Share Toronto bikes: ~18–19 kg (heavy steel-frame upright, internal hub)
# vs ~10 kg hybrid. ~10–15% extra energy cost at same speed (Wilson "Bicycling
# Science", 3rd ed). For ~95 kg rider on a Bikeshare bike at easy commute pace
# (~14–16 km/h, upright posture), MET ≈ 7.0; moderate (~18 km/h) ≈ 8.5.
# kcal/min ≈ MET × bodyweight_kg × 3.5 / 200 (ACSM standard).
BODY_KG = 95
MET_EASY = 7.0
MET_MOD = 8.5
KCAL_PER_MIN_EASY = round(MET_EASY * BODY_KG * 3.5 / 200, 1)   # ≈ 11.6
KCAL_PER_MIN_MOD = round(MET_MOD * BODY_KG * 3.5 / 200, 1)     # ≈ 14.1

WINDOW_MAX_HOURS = 4                  # cap label length to a realistic ride
RIDE_MIN_DEFAULT = 60                 # default ride length we estimate kcal for

_CACHE: dict[str, tuple[float, dict]] = {}
_CACHE_TTL_S = 60 * 30  # 30 min — forecasts barely move within 30 min


def fetch_forecast(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON) -> dict:
    """Hit Open-Meteo, cache 30 min."""
    key = f"{lat},{lon}"
    now = time.time()
    cached = _CACHE.get(key)
    if cached and now - cached[0] < _CACHE_TTL_S:
        return cached[1]
    qs = urllib.parse.urlencode({
        "latitude": lat, "longitude": lon,
        "hourly": "temperature_2m,precipitation_probability,wind_speed_10m,is_day,weathercode",
        "timezone": "America/Toronto",
        "forecast_days": 7,
    })
    url = f"https://api.open-meteo.com/v1/forecast?{qs}"
    with urllib.request.urlopen(url, timeout=8) as r:
        data = json.loads(r.read().decode())
    _CACHE[key] = (now, data)
    return data


def _wcode_label(c: int) -> str:
    if c == 0: return "clear"
    if c in (1, 2): return "mostly clear"
    if c == 3: return "overcast"
    if c in (45, 48): return "fog"
    if 51 <= c <= 67: return "rain"
    if 71 <= c <= 77: return "snow"
    if 80 <= c <= 99: return "showers/storm"
    return "—"


def _score_hour(temp: float, precip: float, wind: float, is_day: int) -> float:
    """0..100 cycling friendliness."""
    if not is_day:
        return 0
    if temp is None or precip is None or wind is None:
        return 0
    if precip >= 60 or wind >= 35 or temp <= 0 or temp >= 32:
        return 0
    score = 100.0
    # temperature: peak at 18°C, fall off
    score -= abs(temp - 18) * 3
    # precipitation
    score -= max(0, precip - 10) * 1.2
    # wind
    score -= max(0, wind - 12) * 1.5
    return max(0.0, score)


def find_windows(forecast: dict, *, top_k: int = 5) -> list[dict]:
    """Per calendar day, find the best WINDOW_MAX_HOURS contiguous block by
    average hour-score. Skip days where no daylight hour scores ≥ 60.
    """
    h = forecast.get("hourly", {})
    times = h.get("time", [])
    if not times:
        return []
    temps = h.get("temperature_2m", [])
    precip = h.get("precipitation_probability", [])
    wind = h.get("wind_speed_10m", [])
    is_day = h.get("is_day", [])
    wcode = h.get("weathercode", [])

    # Group hour indexes by date
    by_date: dict[str, list[int]] = {}
    for i, ts in enumerate(times):
        d = ts.split("T")[0]
        by_date.setdefault(d, []).append(i)

    out: list[dict] = []
    for d, idxs in by_date.items():
        scores = [
            _score_hour(temps[i] if i < len(temps) else None,
                        precip[i] if i < len(precip) else None,
                        wind[i] if i < len(wind) else None,
                        is_day[i] if i < len(is_day) else 0)
            for i in idxs
        ]
        # Sliding window: max sum of WINDOW_MAX_HOURS consecutive scores
        best_avg = 0.0
        best_start = -1
        n = len(idxs)
        win = WINDOW_MAX_HOURS
        if n < 1:
            continue
        for start in range(n - win + 1):
            s = sum(scores[start:start + win])
            if s == 0:
                continue
            avg = s / win
            if avg > best_avg:
                best_avg = avg
                best_start = start
        # also try shorter blocks if a 4-hour window doesn't qualify
        if best_avg < 60:
            for start in range(n - 1):
                for w in (3, 2):
                    if start + w > n: continue
                    s = sum(scores[start:start + w])
                    if s == 0: continue
                    avg = s / w
                    if avg > best_avg:
                        best_avg = avg
                        best_start = start
                        win = w
        if best_avg < 60 or best_start < 0:
            continue
        block = idxs[best_start:best_start + win]
        out.append(_window_summary(times, temps, precip, wind, wcode, block))

    out.sort(key=lambda x: -x["score"])
    return out[:top_k]


def _window_summary(times, temps, precip, wind, wcode, idx_list: list[int]) -> dict:
    start_iso = times[idx_list[0]]
    end_iso = times[idx_list[-1]]
    start = datetime.fromisoformat(start_iso)
    end = datetime.fromisoformat(end_iso)
    hours = len(idx_list)
    avg_temp = sum(temps[i] for i in idx_list) / hours
    max_precip = max(precip[i] for i in idx_list)
    max_wind = max(wind[i] for i in idx_list)
    mode_code = max(set(wcode[i] for i in idx_list),
                    key=lambda c: sum(1 for i in idx_list if wcode[i] == c))
    score = sum(_score_hour(temps[i], precip[i], wind[i], 1) for i in idx_list) / hours
    # Calorie estimate: realistic 45–90 min Bike Share Toronto ride at easy pace
    ride_min = max(45, min(90, hours * 60))
    kcal_easy = round(KCAL_PER_MIN_EASY * ride_min)
    kcal_mod = round(KCAL_PER_MIN_MOD * ride_min)

    weekday = start.strftime("%a")
    start_label = start.strftime("%-I %p").lstrip("0").lower()
    end_label = (end.strftime("%-I %p")).lstrip("0").lower()

    return {
        "date": start.strftime("%Y-%m-%d"),
        "weekday": weekday,
        "start": start_iso, "end": end_iso,
        "label": f"{weekday} {start_label}–{end_label}",
        "hours": hours,
        "avg_temp_c": round(avg_temp, 1),
        "max_precip_pct": int(max_precip),
        "max_wind_kmh": round(max_wind, 1),
        "conditions": _wcode_label(int(mode_code)),
        "score": round(score, 1),
        "kcal_estimate": kcal_easy,
        "kcal_easy": kcal_easy,
        "kcal_moderate": kcal_mod,
        "ride_minutes": ride_min,
        "bike": "Bike Share Toronto (~18 kg)",
    }


def cycling_suggestions(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON) -> dict:
    try:
        forecast = fetch_forecast(lat, lon)
        windows = find_windows(forecast, top_k=5)
        return {
            "available": True,
            "location": "Toronto",
            "rationale": "Top Bike Share Toronto windows · best 4 hrs/day · kcal calibrated for ~18 kg bikeshare bike + 95 kg rider (MET 7 easy / 8.5 moderate)",
            "windows": windows,
        }
    except Exception as e:
        return {"available": False, "error": str(e), "windows": []}
