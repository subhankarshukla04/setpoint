# Setpoint

> *The weight your body defends. The target state of a control system. The thing a 12-week cut is trying to relocate.*
> Personal AI training, nutrition & recovery system. Built for one user, anatomically grounded, research-cited, runs on a laptop and a phone.

[![Built with Claude](https://img.shields.io/badge/Built%20with-Claude%20Opus-D97757?logo=anthropic&logoColor=white)](https://www.anthropic.com)
[![Stack](https://img.shields.io/badge/stack-FastAPI%20·%20Next.js%2014%20·%20SQLite-0a0a0a)](#stack)
[![Hosting](https://img.shields.io/badge/hosting-laptop%20%2B%20phone%20over%20WiFi-22c55e)](#architecture)
[![Cost](https://img.shields.io/badge/cost-%240%2Fmo-22c55e)](#architecture)
[![Status](https://img.shields.io/badge/status-actively%20used-22c55e)](#)

---

## TL;DR

Off-the-shelf fitness apps treat every user identically. They don't know my macros are carb-cycled by training day, can't tell my golfer's elbow means tricep extensions need to swap to rope pushdowns but biceps stay untouched, have no concept of a 12-week phased deficit, and certainly don't know that today is the day to swap Bulgarian split squats for hip thrusts because my knee is angry.

So I built the system that knows me.

**Setpoint** is a single FastAPI process serving a Next.js PWA over LAN that combines:

- A **pattern-based injury filter** — 25 anatomy-aware movement-pattern tags drive automatic swap / reduce / drop / cue decisions across the entire week's plan when an injury is toggled on
- A **RAG-grounded coach** — Claude / Gemini via OpenRouter, retrieving from a curated 27-article wiki using hybrid BM25 + cosine over local MiniLM embeddings, every answer cited
- **Day-specific RAMP warmups** — built on Behm 2016, Bishop 2003, Wilson 2013 (PAP), Cools/Reinold (scap rehab), Bret Contreras (glute activation), Andreo Spina (FRC), Israetel/Nippard RP, plus CBum's documented session prep
- **Phase-aware carb-cycled macros** — 3 nutrition phases × 2 day-types = 6 macro targets, computed live from today's date and weekday
- A **weather-driven outdoor cardio scheduler** — Open-Meteo hourly forecast, scored for the best 4-hour cycling window per day, calibrated for Toronto's 18 kg Bike Share bikes
- **Local-first, single-user, $0 hosting** — laptop is the server, phone is a thin client over WiFi. No cloud database, no auth, no monthly bill. The network is the perimeter.

Currently tracking a real 96 → 82 kg cut, real lifts at Hart House, real macros from real Toronto FreshCo SKUs, with an active medial-elbow injury the system actively works around in real time.

---

## Why this exists

Three intertwined personalisation problems that no consumer app solves at once:

**1. Anatomy-aware substitution.** When the elbow flares, *which* movements actually load the medial epicondyle? Not "all arm exercises" — only those that hit the flexor-pronator origin: tricep extensions, gripping under load, valgus stress. Biceps curls don't insert there and should be left alone. This requires tagging exercises by movement *pattern*, not name, then scoring each pattern against an injury's severity.

**2. Plan dynamism.** Toggle "knee" on → the entire week's plan recomputes. The Plan tab, the Today tab, the Coach's prompt context — all of it, instantly, and reverts just as instantly when you toggle off.

**3. Grounded reasoning.** When the coach answers "should I deload?", it should cite specific passages from a curated wiki of training/nutrition/recovery research, not hallucinate from training-data memory.

Every consumer app I tried solves zero of these. Setpoint solves all three.

---

## How I used Claude

A 5-sprint build (KB → app shell → logging → coach + plan → readiness/review) compressed into a few sessions. Claude was the architect, the implementer, and the second brain on every design call:

- **Architectural iteration.** I started wanting Supabase + cloud hosting; Claude pushed back ("$0 cost + can't keep laptop on 24/7 = host nothing") and we landed on the laptop-as-server / phone-as-client design that's now the system's spine.
- **Anatomy review.** The first injury catalog over-generalised and swapped my biceps when only triceps needed swapping. I told Claude "biceps stay alone" and it rewrote the catalog from anatomy first: medial epicondyle = flexor-pronator origin, biceps brachii inserts at radial tuberosity, therefore curls are unaffected. That conversation produced the 25 movement-pattern tags that now drive the whole filter.
- **Research synthesis.** The warmup blocks aren't generic — Claude pulled the references (Behm, Bishop, Wilson, Cools/Reinold, Contreras, Spina, Israetel/Nippard); I made the call on what to include.
- **Recovery from a sandbox catastrophe.** Mid-build, work was being silently written to a shell sandbox overlay that didn't persist. We caught it, salvaged 27 wiki articles by HTTP-dumping the running backend, rebuilt on the real disk, shipped.

This is what AI-assisted engineering actually looks like in 2026: not "AI writes my code," but a tight loop of architectural conversations, anatomically correct constraints, cited rationale, and fast iteration — with me staying the decision-maker.

---

## Architecture

```
┌─────────────────────┐      ┌─────────────────────────────────────────────────┐
│  Phone (PWA)        │      │  FastAPI single process · :8003                 │
│  Today / Log / Plan │ WiFi │                                                 │
│  Injury toggles     │ ───▶ │  ┌─ KB SQLite ──────────────────────────────┐   │
│  localStorage queue │      │  │ FTS5 BM25 · numpy cosine                 │   │
│  PWA: Add to Home   │      │  │ MiniLM embeddings (384-dim, on-device)   │   │
└─────────────────────┘      │  └──────────────────────────────────────────┘   │
                             │  ┌─ App SQLite ─────────────────────────────┐   │
┌─────────────────────┐      │  │ sets · meals · weights · readiness ·     │   │
│  Laptop             │      │  │ injuries · plan_days                     │   │
│  Today / Log / Plan │ ───▶ │  └──────────────────────────────────────────┘   │
│  Coach / Review /   │      │  ┌─ Programme engine ───────────────────────┐   │
│  Injuries / KB      │      │  │ phase × day-type × injury filter ×       │   │
└─────────────────────┘      │  │ RAMP warmup × outdoor-cardio scorer      │   │
                             │  └──────────────────────────────────────────┘   │
                             │  ┌─ Coach (RAG) ────────────────────────────┐   │
                             │  │ Hybrid retrieval → OpenRouter →          │   │
                             │  │ Claude / Gemini · cited answers          │   │
                             │  └──────────────────────────────────────────┘   │
                             │  ┌─ Weather ────────────────────────────────┐   │
                             │  │ Open-Meteo (free) → best cycling windows │   │
                             │  └──────────────────────────────────────────┘   │
                             └─────────────────────────────────────────────────┘
```

---

## Stage by stage — explained twice

Each stage is explained for the layperson, then for the engineer.

### 1. Pattern-based injury engine

**User lens.** Tell the app "elbow is bothering me" → every workout in the week recomputes. Tricep extensions get swapped to rope pushdowns. Heavy presses get reduced (a set lighter, one rep further from failure). Dips disappear. Biceps work stays exactly the same because biceps don't load that joint. A red Pre-session card appears with Tyler-twist eccentric rehab + wrist stretches. Toggle off and the plan instantly reverts.

**Engineering lens.** Every exercise is tagged via substring rules into a set of 25 anatomy-aware patterns (`grip_load`, `valgus_elbow`, `tricep_extension_extreme`, `deep_knee_flexion_load`, `axial_spinal_load`, etc.). Each of 5 injuries (`medial_elbow`, `shoulder_impingement`, `lower_back`, `knee`, `wrist`) declares a `{pattern: severity}` map plus per-pattern swap targets, reduction cues, and force-drop overrides. Filter logic scores each plan exercise against the union of active injuries: `drop > swap > reduce > cue` precedence wins. State persists in SQLite, toggles via `POST /injuries/{name}`, filter re-runs on every `/programme/today` and `/programme/week` fetch.

### 2. Sectioned RAMP warmups

**User lens.** Every training day has its own warmup card before the workout: 5 min of cardio, 2–3 min of dynamic mobility (no static stretches — they cut your strength), 2–3 min of activation work for the muscles that protect today's lift, then a specific ramp-up at 40 → 60 → 80 → 90% of working weight on the first compound. Each section has a one-line rationale and a citation, so you know *why* it's there.

**Engineering lens.** `WARMUP_BLOCKS` is a dict keyed by workout name, each value a list of section objects (`section`, `duration`, `rationale`, `items`). The PreSession response carries an optional `sections[]` field; the React `PreSessionCard` renders the structured form when available, flat-list fallback otherwise. Mobility recommendations are dynamic-only per Behm 2016 (static stretching ≥30s pre-lift impairs force 5–8%). Specific ramp uses %-of-working sets per Israetel/Nippard RP guidance — never to failure, because PAP (Wilson 2013 meta) requires sub-maximal effort to potentiate.

### 3. Coach with RAG

**User lens.** Ask the coach a question, get an answer grounded in your own curated training/nutrition/recovery wiki — with citations showing which articles it pulled from. The coach also knows your live state: today's macros, last six sets, weight EMA, readiness traffic light, active injuries. So "should I deload?" is answered against your real numbers, not a generic FAQ.

**Engineering lens.** 27 wiki articles across 4 pillars (injury · nutrition · recovery · training) chunked by heading, embedded with `sentence-transformers/all-MiniLM-L6-v2` (384-dim, on-device, free), stored as `BLOB` in SQLite. Retrieval is hybrid: FTS5 BM25 + numpy cosine over a cached embedding matrix, fused via reciprocal-rank `α/(60+bm25_rank) + (1-α)/(60+vec_rank)`. Originally targeted `sqlite-vec` but Python 3.13's framework build can't load extensions, so I pivoted to numpy — linear scan over ~150 chunks is sub-millisecond. The coach prompt is a single template with `user_context` (live state) + `context` (retrieved chunks), routed through OpenRouter to Claude or Gemini, with `[topic §heading]` citations enforced by the system prompt.

### 4. Phase-aware carb-cycled macros

**User lens.** Three nutrition phases over 12 weeks. Training days higher carbs, rest days lower. Today's macro target is computed live from today's date and weekday — no manual configuration. Phase 1 wks 1–4 = 2400/1800 kcal. Phase 2 wks 5–8 = 2650/2000. Phase 3 wks 9–12 = 2900/2300. Protein scales 170 → 178 → 188 g.

**Engineering lens.** `PHASES` array keyed by `(weeks: tuple, train_kcal, rest_kcal, protein_g)`. `current_phase(today)` returns the right row by week-of-cut. `macros_for_today` does a deterministic 30/25/45 split (protein-locked, fat 25% of kcal, rest as carbs). Today cards render `progress / target` against the phase-correct numbers; the Today summary auto-flips at midnight.

### 5. Weather-driven outdoor cardio

**User lens.** The system knows when it's a good day to ride a Toronto Bike Share. It checks the 7-day forecast, finds the best 4-hour block per day based on temperature, precipitation, wind, and daylight, and estimates calorie burn for *the bike I actually use* — those heavy 18 kg bikeshare bikes burn ~10–15% more than a personal road bike at the same speed.

**Engineering lens.** Open-Meteo's free hourly forecast for Hart House coords, cached 30 min. Each daylight hour scored 0–100 (peak at 18°C, penalised by precip > 10%, wind > 12 km/h, temp drift). For each calendar day, sliding-window finds the best 4-hour contiguous block by avg score. Calorie estimate uses the ACSM formula `MET × kg × 3.5 / 200`, calibrated for 95 kg rider on 18 kg bikeshare hardware: MET 7 easy / 8.5 moderate, yielding 11.6 / 14.1 kcal/min — surfaced as "1044–1269 kcal" for a 90-min ride.

### 6. Local-first, single-user, $0 cost

**User lens.** Whole system runs on my laptop. My phone connects over the same WiFi to log workouts and meals. No cloud, no $20/month database, no app store. If the WiFi works, the gym works.

**Engineering lens.** Single FastAPI process bound `0.0.0.0:8003`, two SQLite databases (KB + app data), Bonjour `macbook.local` for phone discovery, localStorage offline write-queue with auto-flush on `/health` ping every 30s and on `online`/`focus` events. PWA via `manifest.webmanifest` so the phone can "Add to Home Screen" — looks like an app, costs nothing to host.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI · Python 3.13 · single process |
| Frontend | Next.js 14 · React 18 · TypeScript · Tailwind · lucide-react |
| Storage | SQLite × 2 (KB + app data) · FTS5 |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` (384-dim, on-device) |
| Retrieval | Hybrid BM25 + numpy cosine, RRF-fused |
| LLM | OpenRouter → Claude Opus / Gemini 2.0 Flash |
| Weather | Open-Meteo (free, no API key) |
| Hosting | macOS laptop · Bonjour discovery · LAN-only |
| Mobile | PWA (manifest + Add-to-Home-Screen) |

---

## Project structure

```
setpoint/
├── apps/web/                          Next.js 14 PWA — laptop + phone layouts
│   ├── app/                           routes (single-page)
│   ├── components/
│   │   ├── PhoneApp.tsx               4-tab bottom-nav layout
│   │   ├── LaptopApp.tsx              7-tab sidebar layout
│   │   ├── PreSessionCard.tsx         rehab + warmup card (sectioned)
│   │   ├── CyclingCard.tsx            outdoor-cardio windows
│   │   ├── screens/                   Today / Plan / Log / Review / Coach / KB / Injuries
│   │   └── loggers/                   Set / Meal / Weight / Readiness loggers
│   └── lib/{api,queue}.ts             API client + offline queue
├── services/knowledge-service/        FastAPI single process
│   └── app/
│       ├── main.py                    all routes
│       ├── programme.py               injury engine + RAMP warmups + phase logic
│       ├── weather.py                 Open-Meteo + cycling-window scorer
│       ├── coach.py                   prompt template + OpenRouter call
│       ├── db.py                      KB store (FTS5 + numpy cosine)
│       ├── appdb.py                   app data (sets/meals/weights/readiness/injuries)
│       ├── embed.py                   MiniLM wrapper
│       └── ingest.py                  wiki → KB pipeline
├── research/
│   ├── wiki/                          27 .md articles · 4 pillars
│   │   ├── injury/                    7 articles
│   │   ├── nutrition/                 10 articles
│   │   ├── recovery/                  3 articles
│   │   └── training/                  7 articles
│   └── citations.json
└── infra/scripts/                     dev-up · dev-down · dev-bootstrap
```

---

## Running it

```bash
# 1. Bootstrap (first time only)
bash infra/scripts/dev-bootstrap.sh

# 2. Set OpenRouter key (free tier works fine)
echo "OPENROUTER_API_KEY=sk-or-v1-..." >> .env

# 3. Start
bash infra/scripts/dev-up.sh

# 4. Open
#    Laptop:  http://localhost:3001
#    Phone:   http://macbook.local:3001 (or http://<lan-ip>:3001)
#             → Safari → Share → Add to Home Screen
```

Stop with `bash infra/scripts/dev-down.sh`.

---

## What's actually live

- 5 injuries, anatomy-mapped, toggle-driven · 25 movement-pattern tags
- 4 day-specific RAMP warmups · 9 cited research sources
- 27 KB articles · 229 chunks · hybrid retrieval, sub-ms latency
- Phase-aware macros (3 phases × train/rest day-type)
- 7-day weather window scorer for outdoor cycling
- localStorage offline-write queue + auto-flush
- Brzycki e1RM weekly trend with SVG sparklines per lift
- Hacker's Diet 14-day EWMA for weight smoothing
- Readiness traffic light: green / amber / red per sleep+soreness rules
- Multi-injury stacking — toggle elbow + knee + back simultaneously, all aggravators flagged across the week

---

## Citations (the science layer)

The system isn't generic gym advice. Every recommendation has a paper or coach behind it.

- **Behm 2016** — *Acute Effects of Stretching on Muscular Performance* (meta) → static stretching ≥30s pre-lift impairs force 5–8%; dynamic doesn't
- **Bishop 2003** — *Warm Up I: Potential Mechanisms* → core temp ↑1°C improves capillary perfusion
- **Wilson 2013** — *Meta-Analysis of Post-Activation Potentiation* → ramp to 90%×1, never to failure
- **Cools / Reinold** — scapular rehab protocols → activation order for pressing days
- **Bret Contreras** — glute activation precedes leg work
- **Andreo Spina (FRC)** — controlled articular rotations for joint health
- **Stuart McGill** — big-3 (curl-up · side-plank · bird-dog) for lumbar
- **Mike Israetel · Jeff Nippard (RP)** — ramp-set cadence + volume guidance
- **Chris Bumstead** — documented session warmup structure
- **Hacker's Diet (Walker)** — α=0.1 EWMA for weight noise reduction
- **Brzycki** — `e1RM = weight × 36 / (37 − reps)`
- **ACSM Compendium of Physical Activities (Ainsworth 2011)** — `kcal/min = MET × kg × 3.5 / 200`

---

## A note on scope

Setpoint is built **for one user** — me — and that's the point. It encodes my training environment (Hart House), my food sources (Toronto FreshCo + Costco), my body (96 → 82 kg cut), my injury history (medial elbow, with rehab plan), my coach preferences (Israetel/Nippard/CBum methodology), my schedule (Mon/Tue/Thu/Fri training).

This is also why it ships: there are no edge cases I didn't think about, because every edge case is mine.

---

## License

Personal project. Code released for reference and learning. No warranty, no support — this exists to demonstrate the build, the reasoning, and the shape of AI-assisted engineering in 2026.

— Subhankar Shukla · Toronto · 2026
