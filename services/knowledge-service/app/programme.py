"""Programme spec + pattern-based injury engine.

Cut starts 2026-05-04 (Mon = wk 1 day 1). 12 weeks. 4-day split.

Architecture (changed from name-match to pattern-match):
- EXERCISE_PATTERN_RULES tag every exercise by movement pattern(s)
- INJURY_CATALOG declares which patterns each injury aggravates + severity
- apply_injury_filter() scores per exercise: drop > swap > reduce > cue
- Rest days flip to Rehab Day when any injury active
- Warmup blocks injected pre-session when no injury active
"""
from __future__ import annotations

from datetime import date

START_DATE = date(2026, 5, 4)            # Mon, week 1 day 1
END_DATE = date(2026, 7, 26)             # 12 weeks later (Sun)
TRAIN_DOWS = {0, 1, 3, 4}                # Mon Tue Thu Fri
REST_DOWS = {2, 5, 6}                    # Wed Sat Sun

PHASES = [
    {"phase": 1, "weeks": (1, 4), "train_kcal": 2400, "rest_kcal": 1800, "protein_g": 170},
    {"phase": 2, "weeks": (5, 8), "train_kcal": 2650, "rest_kcal": 2000, "protein_g": 178},
    {"phase": 3, "weeks": (9, 12), "train_kcal": 2900, "rest_kcal": 2300, "protein_g": 188},
]

# ── Pattern tags ──────────────────────────────────────────────────────
PATTERN_LABELS = {
    "grip_load":                 "heavy grip",
    "tricep_extension_extreme":  "tricep extension under load (extreme)",
    "tricep_extension_moderate": "tricep extension (moderate)",
    "valgus_elbow":              "valgus elbow stress",
    "wrist_extension_load":      "bodyweight on extended wrist",
    "barbell_fixed_wrist":       "fixed-bar wrist position",
    "pronation_supination_load": "loaded pronation/supination",
    "deep_bicep_stretch":        "deep biceps stretch under load",
    "overhead_load":             "overhead loading",
    "internal_rotation_load":    "internal rotation under load",
    "arm_above_shoulder":        "arm above shoulder height",
    "shoulder_extension_capsule":"shoulder extension / anterior capsule",
    "pressing_arm_flared":       "pressing with elbows flared",
    "axial_spinal_load":         "axial spinal loading",
    "hip_hinge_load":            "loaded hip hinge",
    "unsupported_standing_press":"unsupported standing press",
    "loaded_trunk_brace":        "loaded trunk bracing",
    "loaded_trunk_flexion":      "loaded spinal flexion",
    "deep_knee_flexion_load":    "deep knee flexion under load",
    "moderate_knee_flexion":     "moderate knee flexion under load",
    "single_leg_knee_load":      "single-leg knee loading",
    "patellar_shear_extension":  "patellar shear at extension",
    "knee_impact":               "knee impact / plyo",
    "cycling_resistance":        "high-resistance cycling",
    "kb_rack_position":          "kettlebell rack position",
}

# Substring → pattern set. Unioned across all matching rules.
EXERCISE_PATTERN_RULES: list[tuple[list[str], set[str]]] = [
    # Tricep — extreme (HIGH-stress patterns)
    (["skull crusher", "skullcrusher"], {"tricep_extension_extreme", "valgus_elbow"}),
    (["overhead tricep extension", "overhead cable tri", "overhead tri ext"],
     {"tricep_extension_extreme", "overhead_load"}),
    (["close-grip bench", "close grip bench"],
     {"tricep_extension_extreme", "grip_load", "barbell_fixed_wrist"}),
    # Tricep — moderate (rehabbable)
    (["tricep pushdown", "rope pushdown", "cable pushdown", "single-arm cable pushdown"],
     {"tricep_extension_moderate"}),
    (["tricep kickback"], {"tricep_extension_moderate"}),

    # Chest / pressing
    (["barbell bench", "bench (smith)", "smith bench", "flat barbell bench"],
     {"barbell_fixed_wrist", "grip_load", "pressing_arm_flared"}),
    (["machine chest press", "hammer chest press"], {"grip_load"}),
    (["incline machine press", "incline smith"], {"grip_load", "arm_above_shoulder"}),
    (["incline db press", "incline dumbbell press"],
     {"grip_load", "arm_above_shoulder"}),
    (["flat db press", "flat dumbbell press"], {"grip_load"}),
    (["pec deck"], set()),
    (["cable fly", "cable crossover"], set()),
    (["dip", "dips"],
     {"tricep_extension_extreme", "wrist_extension_load", "shoulder_extension_capsule"}),
    (["push-up", "pushup", "push up"],
     {"wrist_extension_load", "tricep_extension_moderate", "grip_load"}),
    (["plank"], {"wrist_extension_load"}),
    (["handstand", "planche"], {"wrist_extension_load", "overhead_load"}),

    # Bicep
    (["incline db curl", "incline dumbbell curl"], {"deep_bicep_stretch"}),
    (["preacher curl"], set()),
    (["hammer curl"], set()),
    (["barbell curl", "straight-bar curl", "straight bar cable curl",
      "straight-bar cable curl"],
     {"grip_load", "pronation_supination_load", "barbell_fixed_wrist"}),
    (["ez-bar curl", "ez bar curl"], {"pronation_supination_load"}),
    (["rope hammer curl", "rope curl"], set()),

    # Shoulder
    (["overhead press", "ohp"], {"overhead_load"}),
    (["shoulder press", "military press"], {"overhead_load"}),
    (["standing overhead press", "standing ohp", "standing military"],
     {"overhead_load", "unsupported_standing_press", "axial_spinal_load"}),
    (["seated machine shoulder press"], {"overhead_load"}),
    (["behind neck", "behind-neck"], {"overhead_load", "internal_rotation_load"}),
    (["upright row"], {"internal_rotation_load", "arm_above_shoulder"}),
    (["arnold press"], {"overhead_load", "internal_rotation_load"}),
    (["lateral raise"], set()),
    (["front raise"], {"arm_above_shoulder"}),
    (["snatch"], {"overhead_load", "internal_rotation_load", "knee_impact"}),
    (["clean"], {"overhead_load", "hip_hinge_load"}),
    (["jerk"], {"overhead_load"}),
    (["landmine press"], set()),

    # Back
    (["chest-supported row", "chest supported row"], set()),
    (["seated cable row", "freemotion seated row"], set()),
    (["lat pulldown", "pulldown"], {"grip_load"}),
    (["pull-up", "pullup", "pull up"], {"grip_load", "shoulder_extension_capsule"}),
    (["chin-up", "chinup", "chin up"], {"grip_load", "shoulder_extension_capsule"}),
    (["face pull"], set()),
    (["bent-over row", "bent over row", "barbell row", "pendlay"],
     {"hip_hinge_load", "loaded_trunk_brace", "grip_load"}),
    (["t-bar row"], {"hip_hinge_load", "loaded_trunk_brace"}),
    (["straight-arm pulldown"], set()),
    (["reverse pec deck", "reverse fly"], set()),
    (["deadlift"], {"hip_hinge_load", "axial_spinal_load", "grip_load"}),
    (["rdl", "stiff-leg", "stiff leg", "romanian deadlift"],
     {"hip_hinge_load", "grip_load"}),
    (["good morning"], {"hip_hinge_load", "axial_spinal_load"}),

    # Legs
    (["barbell squat", "back squat"],
     {"axial_spinal_load", "deep_knee_flexion_load"}),
    (["front squat"],
     {"axial_spinal_load", "deep_knee_flexion_load", "wrist_extension_load"}),
    (["hack squat"], {"axial_spinal_load", "deep_knee_flexion_load"}),
    (["leg press"], {"moderate_knee_flexion"}),
    (["pistol squat"],
     {"deep_knee_flexion_load", "single_leg_knee_load", "knee_impact"}),
    (["bulgarian split", "split squat"],
     {"deep_knee_flexion_load", "single_leg_knee_load"}),
    (["walking lunge"],
     {"single_leg_knee_load", "axial_spinal_load", "loaded_trunk_brace"}),
    (["lunge"], {"single_leg_knee_load"}),
    (["step-up", "step up"], {"single_leg_knee_load", "knee_impact"}),
    (["jump squat", "box jump", "plyo"],
     {"knee_impact", "deep_knee_flexion_load"}),
    (["leg extension"], {"patellar_shear_extension", "moderate_knee_flexion"}),
    (["sissy squat"], {"patellar_shear_extension", "deep_knee_flexion_load"}),
    (["seated leg curl", "lying leg curl", "leg curl"], set()),
    (["hip thrust"], set()),
    (["calf raise"], set()),
    (["hip adductor", "hip abductor", "adductor", "abductor"], set()),
    (["glute bridge"], set()),
    (["glute kickback"], set()),
    (["spanish squat"], set()),

    # Core
    (["cable crunch"], {"loaded_trunk_flexion"}),
    (["hanging leg raise"], {"loaded_trunk_flexion", "grip_load"}),
    (["lying leg raise", "reverse crunch"], set()),
    (["dead bug", "bird-dog", "bird dog", "side plank", "curl-up", "curl up"], set()),
    (["ab roller", "ab wheel"], {"wrist_extension_load"}),

    # Carries / shrugs
    (["farmer", "farmer's carry", "carry"], {"grip_load", "axial_spinal_load"}),
    (["shrug"], {"grip_load"}),

    # KB
    (["kb front squat", "kettlebell front squat"],
     {"deep_knee_flexion_load", "kb_rack_position"}),
    (["kb rack carry", "kettlebell rack"], {"kb_rack_position", "axial_spinal_load"}),
]


def _matches(name: str, patterns: list[str]) -> bool:
    n = name.lower()
    return any(p.lower() in n for p in patterns)


def get_exercise_patterns(name: str) -> set[str]:
    out: set[str] = set()
    n = name.lower()
    for patterns, tags in EXERCISE_PATTERN_RULES:
        if any(p in n for p in patterns):
            out |= tags
    return out


# ── Injury catalog (pattern-based) ────────────────────────────────────
# Severity:
#   HIGH = swap to swap_alts[pattern]
#   MED  = reduce (sets-1, RIR+1) + cue from cues[pattern] or generic
#   LOW  = cue only (chip on the exercise row, load unchanged)
# force_drop substrings override everything → DROP that movement.
INJURY_CATALOG = {
    "medial_elbow": {
        "label": "Medial elbow (golfer's / medial epicondylitis)",
        "anatomy": "medial epicondyle — flexor-pronator tendon origin",
        "rule": "tricep extension under load + grip + valgus stress aggravate the flexor mass; biceps work is unaffected",
        "patterns": {
            "tricep_extension_extreme":  "HIGH",
            "wrist_extension_load":      "HIGH",
            "valgus_elbow":              "HIGH",
            "barbell_fixed_wrist":       "MED",
            "tricep_extension_moderate": "MED",
            "grip_load":                 "MED",
            "pronation_supination_load": "LOW",
        },
        "swap_alts": {
            "tricep_extension_extreme":  "Rope pushdown (neutral grip, elbow tucked)",
            "wrist_extension_load":      "Machine chest press (neutral handles)",
            "valgus_elbow":              "Single-arm cable pushdown",
            "barbell_fixed_wrist":       "DB / cable equivalent (neutral grip)",
        },
        "cues": {
            "tricep_extension_moderate": "lighter load, neutral rope, elbows tucked",
            "grip_load":                 "loose grip — no death-grip; consider straps for pulls",
            "pronation_supination_load": "neutral or hammer grip preferred",
        },
        "force_drop": ["dip"],
        "rehab": [
            "Wrist flexor stretch — 3 × 30s",
            "Wrist extensor stretch — 3 × 30s",
            "Tyler twist (FlexBar red) — 3 × 15 eccentric",
            "Light wrist curl + reverse curl — 2 × 15",
        ],
    },
    "shoulder_impingement": {
        "label": "Shoulder (anterior impingement / subacromial)",
        "anatomy": "supraspinatus + long head of biceps under acromion",
        "rule": "overhead loading and internal rotation under load pinch the subacromial space",
        "patterns": {
            "overhead_load":              "HIGH",
            "internal_rotation_load":     "HIGH",
            "shoulder_extension_capsule": "HIGH",
            "arm_above_shoulder":         "MED",
            "pressing_arm_flared":        "MED",
            "deep_bicep_stretch":         "LOW",
        },
        "swap_alts": {
            "overhead_load":              "Landmine press (scapular plane)",
            "internal_rotation_load":     "Cable lateral raise (1-arm, to shoulder height)",
            "shoulder_extension_capsule": "Chest-supported row",
        },
        "cues": {
            "arm_above_shoulder":         "cap at shoulder height — no thumb-down",
            "pressing_arm_flared":        "elbows tucked ~45°, not 90°",
            "deep_bicep_stretch":         "stop short of full bottom stretch",
        },
        "force_drop": ["dip", "snatch", "clean", "behind neck", "behind-neck"],
        "rehab": [
            "Wall slides — 2 × 10",
            "Banded external rotation at side — 3 × 15",
            "Face pull (light) — 3 × 20",
            "Sleeper stretch — 2 × 30s",
        ],
    },
    "lower_back": {
        "label": "Lumbar / lower back",
        "anatomy": "lumbar erectors + L4-L5 / L5-S1 discs",
        "rule": "axial load + unsupported hip-hinging are the aggravators; supported hip-dominant work is fine",
        "patterns": {
            "axial_spinal_load":           "HIGH",
            "hip_hinge_load":              "HIGH",
            "unsupported_standing_press":  "HIGH",
            "loaded_trunk_brace":          "MED",
            "loaded_trunk_flexion":        "MED",
        },
        "swap_alts": {
            "axial_spinal_load":           "Leg press (or seated machine equivalent)",
            "hip_hinge_load":              "Hip thrust (machine, supported)",
            "unsupported_standing_press":  "Seated machine shoulder press (back supported)",
            "loaded_trunk_brace":          "Chest-supported row",
            "loaded_trunk_flexion":        "Dead bug / bird-dog",
        },
        "cues": {},
        "force_drop": ["good morning", "jefferson", "zercher"],
        "rehab": [
            "McGill curl-up — 3 sets, 8s holds × 5 reps",
            "Side plank — 3 × 8s/side × 5 reps",
            "Bird-dog — 3 × 8s/side × 5 reps",
            "Cat-camel — 2 × 10",
            "Hip flexor stretch — 2 × 30s/side",
        ],
    },
    "knee": {
        "label": "Knee (patellofemoral / anterior knee pain)",
        "anatomy": "patellar tendon + retropatellar cartilage",
        "rule": "deep flexion under load + impact aggravate; hip-dominant + hamstring work are safe",
        "patterns": {
            "deep_knee_flexion_load":   "HIGH",
            "single_leg_knee_load":     "HIGH",
            "patellar_shear_extension": "HIGH",
            "knee_impact":              "HIGH",
            "moderate_knee_flexion":    "MED",
            "cycling_resistance":       "MED",
        },
        "swap_alts": {
            "deep_knee_flexion_load":   "Leg press (depth ~90° only)",
            "single_leg_knee_load":     "Hip thrust",
            "patellar_shear_extension": "Seated leg curl",
        },
        "cues": {
            "moderate_knee_flexion":    "limit to ~90° depth, no deep lockout pause",
            "cycling_resistance":       "low resistance only",
        },
        "force_drop": ["pistol squat", "jump squat", "box jump", "plyo"],
        "rehab": [
            "Spanish squat (band) — 3 × 12 with 5s isometric hold",
            "Terminal-knee-extension band — 3 × 15",
            "Quad stretch — 2 × 30s/side",
            "IT-band foam roll — 2 min/side",
        ],
    },
    "wrist": {
        "label": "Wrist",
        "anatomy": "carpal joint + flexor/extensor tendons",
        "rule": "fixed straight-bar grips and weight-bearing on extended wrist aggravate; neutral grip + machines are fine",
        "patterns": {
            "wrist_extension_load":  "HIGH",
            "barbell_fixed_wrist":   "HIGH",
            "kb_rack_position":      "HIGH",
            "grip_load":             "MED",
            "pronation_supination_load": "LOW",
        },
        "swap_alts": {
            "wrist_extension_load":  "Machine chest press (no wrist load)",
            "barbell_fixed_wrist":   "DB / cable / machine equivalent (neutral)",
            "kb_rack_position":      "Goblet hold (DB) or machine equivalent",
        },
        "cues": {
            "grip_load":             "use lifting straps; RIR +1",
            "pronation_supination_load": "rope handle preferred over straight bar",
        },
        "force_drop": ["dip", "handstand", "planche"],
        "rehab": [
            "Wrist flexor + extensor stretch — 3 × 30s pre-workout",
            "Light wrist curl + reverse curl — 2 × 15",
            "Hand-putty squeeze — 3 × 20",
        ],
    },
}

INJURY_NAMES = list(INJURY_CATALOG.keys())


# ── Workout split (Mon Tue Wed Thu Fri Sat Sun) ───────────────────────
SPEC_PLAN = [
    {"dow": 0, "label": "Mon", "workout": "Chest + Shoulders",
     "exercises": [
        {"name": "Hammer chest press", "sets": 4, "reps": "6–8", "rir": 1, "rest_sec": 180,
         "cue": "blades pinched into pad"},
        {"name": "Incline machine press", "sets": 3, "reps": "10–12", "rir": 1,
         "cue": "30–45° incline"},
        {"name": "Pec deck", "sets": 3, "reps": "12–15", "rir": 0,
         "cue": "elbow pads, elbows trying to touch"},
        {"name": "Cable lateral raise (1-arm)", "sets": 4, "reps": "15–20", "rir": 0,
         "cue": "lead with elbow, not hand"},
        {"name": "FST-7 cable lateral raise", "sets": 7, "reps": "12", "rir": 0, "rest_sec": 45},
     ],
     "notes": "no shoulder press needed — anterior delt covered by pressing volume"},
    {"dow": 1, "label": "Tue", "workout": "Back + Rear Delts",
     "exercises": [
        {"name": "Plate-loaded chest-supported row", "sets": 4, "reps": "6–8", "rir": 1, "rest_sec": 180,
         "cue": "blade retraction first, then elbow pull"},
        {"name": "Freemotion seated row (HIGH ELBOW)", "sets": 3, "reps": "10–12", "rir": 1,
         "cue": "rhomboids/mid-trap, NOT lats"},
        {"name": "Lat pulldown", "sets": 3, "reps": "10–12", "rir": 1,
         "cue": "elbows to back pockets"},
        {"name": "Face pull (rope)", "sets": 4, "reps": "15–20", "rir": 0,
         "cue": "eye level, elbows high, thumbs behind head"},
        {"name": "Straight-arm pulldown (rope)", "sets": 2, "reps": "12–15", "rir": 0},
        {"name": "FST-7 reverse pec deck", "sets": 7, "reps": "12–15", "rir": 0},
     ],
     "notes": "two row types mandatory — low elbow for lats, high elbow for thickness"},
    {"dow": 2, "label": "Wed", "workout": "Rest", "exercises": [], "notes": "rest day · low carb"},
    {"dow": 3, "label": "Thu", "workout": "Arms (antagonist supersets)",
     "exercises": [
        {"name": "Incline DB curl", "sets": 3, "reps": "10–12", "rir": 1, "rest_sec": 90,
         "superset": "A", "cue": "supinated, controlled negative"},
        {"name": "Overhead cable tricep extension", "sets": 3, "reps": "10–12", "rir": 1, "rest_sec": 90,
         "superset": "A"},
        {"name": "Preacher curl", "sets": 3, "reps": "10–12", "rir": 1, "rest_sec": 90,
         "superset": "B"},
        {"name": "Skull crusher", "sets": 3, "reps": "10–12", "rir": 1, "rest_sec": 90,
         "superset": "B", "cue": "🚫 dropped per spec — needs replacement"},
        {"name": "Hammer curl", "sets": 2, "reps": "12–15", "rir": 0, "rest_sec": 60,
         "superset": "C"},
        {"name": "Rope pushdown", "sets": 2, "reps": "12–15", "rir": 0, "rest_sec": 60,
         "superset": "C"},
        {"name": "FST-7 straight-bar cable curl", "sets": 7, "reps": "10–12", "rir": 0},
     ],
     "notes": "antagonist supersets · pair labels: SS-A / SS-B / SS-C"},
    {"dow": 4, "label": "Fri", "workout": "Legs + Abs",
     "exercises": [
        {"name": "Leg press", "sets": 4, "reps": "8–10", "rir": 1, "rest_sec": 150,
         "cue": "full depth mandatory"},
        {"name": "Seated/lying leg curl", "sets": 4, "reps": "10–12", "rir": 1},
        {"name": "Leg extension", "sets": 3, "reps": "12–15", "rir": 0,
         "cue": "1-sec pause at top"},
        {"name": "Hip adductor", "sets": 2, "reps": "15–20", "rir": 0},
        {"name": "FST-7 leg extension", "sets": 7, "reps": "12–15", "rir": 0},
        {"name": "Cable crunch", "sets": 4, "reps": "12–15", "rir": 0,
         "cue": "rib cage to pelvis, arms do nothing"},
        {"name": "Hanging leg raise", "sets": 3, "reps": "12–15", "rir": 0,
         "cue": "posterior pelvic tilt before raising"},
     ],
     "notes": "legs spike T/GH systemically — non-negotiable on a cut"},
    {"dow": 5, "label": "Sat", "workout": "Rest", "exercises": [], "notes": "rest day · low carb"},
    {"dow": 6, "label": "Sun", "workout": "Rest", "exercises": [], "notes": "rest day · low carb"},
]


# ── Warmup blocks ─────────────────────────────────────────────────────
# Sectioned RAMP protocol (Raise · Activate · Mobilize · Potentiate)
# Sources blended: Behm 2016 (dynamic > static pre-lift), Bishop 2003
# (warm-up physiology), Wilson 2013 (PAP), Reinold/Cools (scap rehab),
# Bret Contreras (glute activation), Andreo Spina (FRC/CARs),
# Kelly Starrett (mobility), Jeff Nippard + Mike Israetel (RP) on ramp
# sets, Chris Bumstead's documented session warm-up cadence.
WARMUP_BLOCKS = {
    "Chest + Shoulders": [
        {"section": "General",
         "duration": "3–5 min",
         "rationale": "raise core temp ~1°C → capillary perfusion (Bishop 2003)",
         "items": ["Easy incline-treadmill walk @ 3.5 mph / 5% incline OR arm bike"]},
        {"section": "Mobility (dynamic only)",
         "duration": "2–3 min",
         "rationale": "static stretching pre-lift cuts force output 5–8% (Behm 2016 meta); dynamic doesn't",
         "items": [
             "Shoulder CARs — 2 × 5/arm slow (FRC, Andreo Spina)",
             "T-spine extension over foam roller — 2 × 10 deep breaths",
             "Cross-body shoulder stretch — 2 × 20s/side (acute, <30s safe)",
         ]},
        {"section": "Activation",
         "duration": "2–3 min",
         "rationale": "primes scap stabilizers + posterior delts (Cools/Reinold scap rehab protocol)",
         "items": [
             "Banded pull-aparts — 2 × 15",
             "Banded face pull — 2 × 15",
             "Scapular wall slides — 2 × 10",
             "Serratus push-up (knees) — 2 × 10",
         ]},
        {"section": "Specific ramp — Hammer chest press",
         "duration": "4–5 min",
         "rationale": "ramp to 90%×1, never to failure; PAP improves output (Wilson 2013 meta) — Israetel/Nippard standard",
         "items": [
             "40% × 8 — groove the path",
             "60% × 5 — practice tension",
             "80% × 3 — neural primer",
             "90% × 1 — last warmup",
             "→ Working set #1",
         ]},
    ],
    "Back + Rear Delts": [
        {"section": "General",
         "duration": "5 min",
         "rationale": "rower warms lats + posterior chain in same plane (Nippard pull-day prep)",
         "items": ["5 min rower (low resistance) OR arm bike"]},
        {"section": "Mobility",
         "duration": "2–3 min",
         "rationale": "thoracic mobility limits pull pattern; cat-camel = McGill standard",
         "items": [
             "Cat-camel — 2 × 10",
             "T-spine extension foam roller — 2 × 10 breaths",
             "Open-book stretch — 2 × 8/side",
             "Dead hang — 2 × 20s (decompresses spine, lengthens lats)",
         ]},
        {"section": "Activation",
         "duration": "2–3 min",
         "rationale": "lats + scap retractors + rear delts are chronically underactive (Cools 2013)",
         "items": [
             "Prone Y-T-W (no weight, on bench) — 2 × 8 each",
             "Banded straight-arm pulldown (light) — 2 × 15",
             "Banded pull-apart — 2 × 15",
             "Hollow body hold — 2 × 20s (anti-extension brace)",
         ]},
        {"section": "Specific ramp — Plate-loaded chest-supported row",
         "duration": "4–5 min",
         "rationale": "slow eccentric on early sets to find the lat (CBum cue)",
         "items": [
             "40% × 10 — slow 3s eccentric",
             "60% × 6",
             "80% × 3",
             "90% × 1",
             "→ Working set #1",
         ]},
    ],
    "Arms (antagonist supersets)": [
        {"section": "General",
         "duration": "5 min",
         "rationale": "small-muscle days need less general prep but elbow + wrist are non-negotiable",
         "items": ["5 min easy bike"]},
        {"section": "Mobility — elbow + wrist focus",
         "duration": "2 min",
         "rationale": "load through compromised joints kills tendons; FRC CARs maintain capsule health",
         "items": [
             "Elbow CARs — 2 × 5/arm slow",
             "Wrist circles + wrist flexion/extension — 30s each direction",
             "Shoulder pass-throughs (band) — 2 × 10",
         ]},
        {"section": "Activation",
         "duration": "1–2 min",
         "rationale": "neural primer, not fatigue — keeps working sets crisp",
         "items": [
             "Light band pushdown — 2 × 15",
             "Light band curl — 2 × 15",
             "Banded face pull — 1 × 15 (rear delt always — Nippard rule)",
         ]},
        {"section": "Specific ramp — first SS-A pair",
         "duration": "2–3 min",
         "rationale": "isolations need only 1–2 ramp sets (RP guidance)",
         "items": [
             "Light DB curl × 10 + light cable tri × 12 (paired feel set)",
             "Working weight − 1 plate × 8 (one ramp-working blend set)",
             "→ Working SS-A round #1",
         ]},
    ],
    "Legs + Abs": [
        {"section": "General",
         "duration": "8–10 min",
         "rationale": "big joints need longer to perfuse synovium (Bishop 2003); CBum: ‘5 min minimum or you’re cooked’",
         "items": ["Bike — 3 min easy → 4 min moderate → 1–2 min near sweat"]},
        {"section": "Mobility — hip + ankle priority",
         "duration": "3–4 min",
         "rationale": "ankle dorsiflexion + hip capsule are the #1 limiters of squat depth without lumbar tuck",
         "items": [
             "90/90 hip rotations — 2 × 8/side",
             "Couch stretch — 2 × 30s/side (Kelly Starrett)",
             "Ankle dorsiflexion (knee-to-wall) — 2 × 30s/side",
             "Leg swings front/back + side/side — 2 × 10/leg",
             "Deep goblet-squat hold (light DB) — 2 × 30s",
         ]},
        {"section": "Activation — glute + core",
         "duration": "2–3 min",
         "rationale": "underactive glutes = knee valgus collapse (Bret Contreras); braced core protects lumbar (McGill)",
         "items": [
             "Glute bridge — 2 × 15",
             "Banded monster walk forward + lateral — 2 × 10/side (gluteus medius)",
             "Bird-dog — 2 × 5/side",
             "Bodyweight squat — 1 × 10 (final pattern check)",
         ]},
        {"section": "Specific ramp — Leg press",
         "duration": "5–6 min",
         "rationale": "compound legs need 4–5 ramp sets — neural progressive loading (Nippard)",
         "items": [
             "Sled empty × 10",
             "1 plate/side × 8",
             "2 plates/side × 5",
             "3 plates/side × 3",
             "4 plates/side × 1 (only if ≤ working weight)",
             "→ Working set #1",
         ]},
    ],
}

Z2_REST_NOTE = [
    "Optional Z2 cardio — 30–40 min incline walk OR easy bike (≤65% HRmax)",
    "Pure recovery: mitochondrial work without competing with hypertrophy",
]


# ── Phase / day-type helpers ──────────────────────────────────────────
def week_of_cut(today: date) -> int:
    if today < START_DATE:
        return 0
    return (today - START_DATE).days // 7 + 1


def current_phase(today: date) -> dict:
    w = max(1, min(12, week_of_cut(today)))
    for p in PHASES:
        lo, hi = p["weeks"]
        if lo <= w <= hi:
            return {**p, "current_week": w}
    return {**PHASES[-1], "current_week": w}


def is_training_day(today: date) -> bool:
    return today.weekday() in TRAIN_DOWS


def macros_for_today(today: date) -> dict:
    phase = current_phase(today)
    train = is_training_day(today)
    kcal = phase["train_kcal"] if train else phase["rest_kcal"]
    protein_g = phase["protein_g"]
    p_kcal = protein_g * 4
    fat_g = round(kcal * 0.25 / 9)
    f_kcal = fat_g * 9
    carb_g = max(0, round((kcal - p_kcal - f_kcal) / 4))
    return {
        "kcal": kcal, "protein_g": protein_g, "carb_g": carb_g, "fat_g": fat_g,
        "phase": phase["phase"], "week": phase["current_week"],
        "is_training_day": train,
        "day_type": "training" if train else "rest",
    }


def todays_workout(today: date) -> dict:
    dow = today.weekday()
    for d in SPEC_PLAN:
        if d["dow"] == dow:
            return d
    return SPEC_PLAN[-1]


# ── Pattern-based filter ──────────────────────────────────────────────
_TIER_PRIORITY = {"drop": 4, "swap": 3, "reduce": 2, "cue": 1, "none": 0}


def _evaluate(ex: dict, active: list[dict]):
    """Return (kind, by, payload, pattern, severity) — highest priority wins."""
    name = ex["name"]
    # 1. force_drop wins outright
    for inj in active:
        cat = INJURY_CATALOG.get(inj["name"], {})
        for sub in cat.get("force_drop", []):
            if sub.lower() in name.lower():
                return ("drop", inj["name"], None, None, "FORCE")

    patterns = get_exercise_patterns(name)
    if not patterns:
        return ("none", None, None, None, None)

    best = None  # (priority, kind, by, payload, pattern, severity)
    for inj in active:
        cat = INJURY_CATALOG.get(inj["name"], {})
        cat_patterns = cat.get("patterns", {})
        for p in patterns:
            sev = cat_patterns.get(p)
            if not sev:
                continue
            if sev == "HIGH":
                kind = "swap"
                payload = cat.get("swap_alts", {}).get(p, "Lower-stress alternative")
            elif sev == "MED":
                kind = "reduce"
                payload = cat.get("cues", {}).get(p) or "lower load, RIR +1"
            else:  # LOW
                kind = "cue"
                payload = cat.get("cues", {}).get(p) or "be mindful"
            pri = _TIER_PRIORITY[kind]
            if best is None or pri > best[0]:
                best = (pri, kind, inj["name"], payload, p, sev)
    if best is None:
        return ("none", None, None, None, None)
    return (best[1], best[2], best[3], best[4], best[5])


def apply_injury_filter(exercises: list[dict], active: list[dict]) -> list[dict]:
    if not active:
        return exercises
    out: list[dict] = []
    for ex in exercises:
        kind, by, payload, pattern, sev = _evaluate(ex, active)
        if kind == "none":
            out.append(ex)
        elif kind == "drop":
            out.append({**ex, "_dropped": True, "_dropped_by": by})
        elif kind == "swap":
            out.append({**ex, "name": payload,
                        "_swapped_from": ex["name"], "_swapped_by": by,
                        "_pattern": PATTERN_LABELS.get(pattern, pattern)})
        elif kind == "reduce":
            new_sets = max(1, int(ex.get("sets", 1)) - 1)
            new_rir = (ex.get("rir") if ex.get("rir") is not None else 0) + 1
            out.append({**ex, "sets": new_sets, "rir": new_rir,
                        "_reduced": True, "_reduce_note": payload, "_reduced_by": by,
                        "_pattern": PATTERN_LABELS.get(pattern, pattern)})
        elif kind == "cue":
            out.append({**ex, "_cued": True, "_cue_note": payload, "_cued_by": by,
                        "_pattern": PATTERN_LABELS.get(pattern, pattern)})
    return out


# ── Pre-session block (rehab vs warmup vs z2) ─────────────────────────
def _build_warmup_block(workout: dict) -> dict | None:
    """Sectioned RAMP warmup for a training day. None on rest days."""
    if workout.get("workout") == "Rest":
        return None
    sections = WARMUP_BLOCKS.get(workout.get("workout", ""), [])
    if not sections:
        return None
    flat = [f"{s['section']}: {it}" for s in sections for it in s.get("items", [])]
    return {
        "kind": "warmup",
        "title": "Warmup — RAMP protocol",
        "subtitle": workout.get("workout", ""),
        "items": flat,
        "sections": sections,
    }


def build_pre_session(workout: dict, active_injuries: list[dict]) -> dict | None:
    """The RED box ONLY: rehab / rehab_day / z2. Warmup is a separate block.

    - injury active + training day → rehab card (rehab items only)
    - injury active + rest day     → rehab_day card (rehab IS the session)
    - clean + rest day             → z2 card
    - clean + training day         → None (warmup card handles it separately)
    """
    is_rest = workout.get("workout") == "Rest"
    rehab_items: list[str] = []
    seen = set()
    sources: list[str] = []
    for inj in active_injuries:
        cat = INJURY_CATALOG.get(inj["name"], {})
        sources.append(cat.get("label", inj["name"]))
        for item in cat.get("rehab", []):
            if item not in seen:
                rehab_items.append(item)
                seen.add(item)

    if rehab_items:
        kind = "rehab_day" if is_rest else "rehab"
        title = "Rehab Day — rest from lifts" if is_rest else "Pre-session rehab"
        section_label = "Rehab block (do this today)" if is_rest else "Rehab — do this BEFORE the warmup"
        duration = "20–30 min" if is_rest else "5–8 min"
        return {
            "kind": kind,
            "title": title,
            "subtitle": " · ".join(sources),
            "items": rehab_items,
            "sections": [{
                "section": section_label,
                "duration": duration,
                "rationale": " · ".join(sources),
                "items": rehab_items,
            }],
        }

    if is_rest:
        return {"kind": "z2",
                "title": "Optional Z2 cardio",
                "subtitle": "no injury active — recovery day",
                "items": Z2_REST_NOTE}

    return None  # clean training day → warmup card alone


def hydrate_injuries(active_rows: list[dict]) -> list[dict]:
    """Lightweight summary of active injuries for context."""
    out = []
    for r in active_rows:
        cat = INJURY_CATALOG.get(r["name"], {})
        out.append({
            "name": r["name"],
            "label": cat.get("label", r["name"]),
            "anatomy": cat.get("anatomy", ""),
            "rule": cat.get("rule", ""),
            "since": r.get("since"),
            "notes": r.get("notes"),
            "rehab": cat.get("rehab", []),
        })
    return out


def programme_today(today: date, active_injury_rows: list[dict] | None = None) -> dict:
    macros = macros_for_today(today)
    workout = dict(todays_workout(today))
    workout["exercises"] = list(workout.get("exercises", []))
    injuries = hydrate_injuries(active_injury_rows or [])
    workout["exercises"] = apply_injury_filter(workout["exercises"], injuries)
    pre_session = build_pre_session(workout, injuries)
    warmup = _build_warmup_block(workout)
    return {
        "date": today.isoformat(),
        "week_of_cut": week_of_cut(today),
        "weeks_remaining": max(0, (END_DATE - today).days // 7),
        "phase": macros["phase"],
        "day_type": macros["day_type"],
        "is_training_day": macros["is_training_day"],
        "targets": {k: macros[k] for k in ("kcal", "protein_g", "carb_g", "fat_g")},
        "pre_session": pre_session,
        "warmup": warmup,
        "workout": workout,
        "injuries": injuries,
    }


def programme_for_dow(dow: int, today: date,
                      active_injury_rows: list[dict] | None = None) -> dict:
    """View of any day-of-week with active-injury filter applied.
    Macros use today's phase. Used by /programme/week."""
    macros = macros_for_today(today)  # phase context
    is_train = dow in TRAIN_DOWS
    phase = current_phase(today)
    kcal = phase["train_kcal"] if is_train else phase["rest_kcal"]
    protein_g = phase["protein_g"]
    fat_g = round(kcal * 0.25 / 9)
    carb_g = max(0, round((kcal - protein_g * 4 - fat_g * 9) / 4))

    workout = dict(next((d for d in SPEC_PLAN if d["dow"] == dow), SPEC_PLAN[-1]))
    workout["exercises"] = list(workout.get("exercises", []))
    injuries = hydrate_injuries(active_injury_rows or [])
    workout["exercises"] = apply_injury_filter(workout["exercises"], injuries)
    pre_session = build_pre_session(workout, injuries)
    warmup = _build_warmup_block(workout)
    return {
        "dow": dow,
        "label": workout.get("label", ""),
        "is_training_day": is_train,
        "day_type": "training" if is_train else "rest",
        "is_today": dow == today.weekday(),
        "targets": {"kcal": kcal, "protein_g": protein_g,
                    "carb_g": carb_g, "fat_g": fat_g},
        "pre_session": pre_session,
        "warmup": warmup,
        "workout": workout,
    }


def programme_week(today: date,
                   active_injury_rows: list[dict] | None = None) -> dict:
    days = [programme_for_dow(d, today, active_injury_rows) for d in range(7)]
    return {
        "today_dow": today.weekday(),
        "phase": current_phase(today)["phase"],
        "week_of_cut": week_of_cut(today),
        "injuries": hydrate_injuries(active_injury_rows or []),
        "days": days,
    }


def catalog_summary() -> list[dict]:
    return [
        {"name": k, "label": v["label"], "anatomy": v.get("anatomy", ""),
         "rule": v.get("rule", "")}
        for k, v in INJURY_CATALOG.items()
    ]


def catalog_actions(name: str) -> dict:
    """Return swap/reduce/cue/drop lists for the Injuries screen."""
    cat = INJURY_CATALOG.get(name, {})
    swaps, reduces, cues = [], [], []
    for pattern, sev in cat.get("patterns", {}).items():
        plabel = PATTERN_LABELS.get(pattern, pattern)
        if sev == "HIGH":
            swaps.append({"pattern": plabel,
                          "to": cat.get("swap_alts", {}).get(pattern, "Lower-stress alternative")})
        elif sev == "MED":
            reduces.append({"pattern": plabel,
                            "note": cat.get("cues", {}).get(pattern, "lower load, RIR +1")})
        else:
            cues.append({"pattern": plabel,
                         "note": cat.get("cues", {}).get(pattern, "be mindful")})
    return {
        "swaps": swaps,
        "reduces": reduces,
        "cues": cues,
        "drops": cat.get("force_drop", []),
        "rehab": cat.get("rehab", []),
    }


# ── Spec foods (override generic seed) ────────────────────────────────
SPEC_FOODS = [
    {"name": "Chicken breast (raw)", "serving_g": 350, "kcal": 578, "protein_g": 108, "carb_g": 0, "fat_g": 6.5, "source": "spec_staple", "favorite": 1},
    {"name": "Whole egg, large", "serving_g": 50, "kcal": 70, "protein_g": 6, "carb_g": 0.4, "fat_g": 5, "source": "spec_staple", "favorite": 1},
    {"name": "Canned tuna (drained)", "serving_g": 170, "kcal": 197, "protein_g": 43, "carb_g": 0, "fat_g": 2, "source": "spec_staple", "favorite": 1},
    {"name": "Canned salmon (drained)", "serving_g": 215, "kcal": 437, "protein_g": 51, "carb_g": 0, "fat_g": 25, "source": "spec_staple", "favorite": 1},
    {"name": "Basmati rice (dry)", "serving_g": 130, "kcal": 468, "protein_g": 9, "carb_g": 102, "fat_g": 1, "source": "spec_staple", "favorite": 1},
    {"name": "Boiled potato", "serving_g": 300, "kcal": 231, "protein_g": 6, "carb_g": 51, "fat_g": 0.3, "source": "spec_staple", "favorite": 1},
    {"name": "Apple, medium", "serving_g": 182, "kcal": 95, "protein_g": 0.5, "carb_g": 25, "fat_g": 0.3, "source": "spec_staple", "favorite": 1},
    {"name": "Olive oil (1 tbsp)", "serving_g": 14, "kcal": 120, "protein_g": 0, "carb_g": 0, "fat_g": 14, "source": "spec_staple", "favorite": 1},
    {"name": "Creatine monohydrate (5g)", "serving_g": 5, "kcal": 0, "protein_g": 0, "carb_g": 0, "fat_g": 0, "source": "supplement", "favorite": 1},
    {"name": "Vitamin D3 (2000 IU)", "serving_g": 1, "kcal": 0, "protein_g": 0, "carb_g": 0, "fat_g": 0, "source": "supplement", "favorite": 0},
    {"name": "Magnesium glycinate (300mg)", "serving_g": 1, "kcal": 0, "protein_g": 0, "carb_g": 0, "fat_g": 0, "source": "supplement", "favorite": 0},
]
