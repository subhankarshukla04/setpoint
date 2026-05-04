const API_BASE =
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `http://${window.location.hostname}:8003`
    : "http://127.0.0.1:8003";

export const apiBase = API_BASE;

async function jget<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`);
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}

async function jpost<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}

async function jput<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}

export const search = (query: string, k = 5) =>
  jpost<{ results: KBChunk[] }>("/search", { query, k });

export const coach = (question: string, k = 3) =>
  jpost<{ answer: string; model: string | null; chunks: KBChunk[] }>("/coach", { question, k });

export const health = () => jget<HealthResp>("/health");

export const logSet = (s: SetIn) => jpost<{ id: number }>("/sets", s);
export const lastSets = (exercise: string) =>
  jget<{ results: SetRow[] }>(`/sets/last/${encodeURIComponent(exercise)}`);

export const logWeight = (weight_kg: number) =>
  jpost<{ ema: WeightEma }>("/weights", { weight_kg });
export const getWeights = () =>
  jget<{ results: WeightRow[]; ema: WeightEma }>(`/weights`);

export const searchFoods = (q: string, favoritesOnly = false) =>
  jget<{ results: Food[] }>(
    `/foods?${favoritesOnly ? "favorites_only=true" : `q=${encodeURIComponent(q)}`}`,
  );
export const logMeal = (food_id: number, grams: number) =>
  jpost<{ id: number; macros: Macros }>("/meals", { food_id, grams });
export const deleteMeal = (id: number) =>
  fetch(`${API_BASE}/meals/${id}`, { method: "DELETE" }).then((r) => r.ok);

export const getToday = () => jget<DaySummary>(`/today`);

export const getPlan = () => jget<{ days: PlanDay[] }>(`/plan`);
export const savePlanDay = (dow: number, day: PlanDay) =>
  jput<{ ok: boolean }>(`/plan/${dow}`, day);

export const logReadiness = (r: ReadinessIn) =>
  jpost<{ score: ReadinessScore }>("/readiness", r);
export const getReadiness = () =>
  jget<{ today: ReadinessRow | null; score: ReadinessScore; recent: ReadinessRow[] }>("/readiness");

export const getReview = () => jget<WeeklyReview>("/review");

export const getProgrammeToday = () => jget<ProgrammeToday>("/programme/today");
export const getProgrammeWeek = () => jget<ProgrammeWeek>("/programme/week");

export const getInjuries = () => jget<{ injuries: InjuryEntry[] }>("/injuries");
export const toggleInjury = (name: string, active: boolean, notes?: string) =>
  jpost<{ ok: boolean; name: string; active: boolean }>(`/injuries/${name}`, { active, notes });

// types
export type KBChunk = {
  chunk_id?: number; topic: string; heading?: string | null;
  text?: string; cite_ids?: string[]; title?: string;
  pillar?: string; summary?: string; score?: number;
};
export type SetIn = { exercise: string; weight_kg: number; reps: number; rir?: number | null; notes?: string; day?: string };
export type SetRow = SetIn & { id: number; logged_at: string; day: string };
export type WeightRow = { id: number; day: string; weight_kg: number; logged_at: string };
export type WeightEma = { current: number | null; ema: number | null; n: number; last_day?: string };
export type Food = {
  id: number; name: string; serving_g: number;
  kcal: number; protein_g: number; carb_g: number; fat_g: number;
  source?: string | null; favorite: number;
};
export type Macros = { kcal: number; protein_g: number; carb_g: number; fat_g: number; items: number };
export type MealRow = {
  id: number; logged_at: string; day: string; grams: number;
  name: string; kcal_total: number; protein_total: number; carb_total: number; fat_total: number;
};
export type DaySummary = { day: string; sets: SetRow[]; meals: MealRow[]; macros: Macros };
export type PlanExercise = { name: string; sets: number; reps: string; rir: number };
export type PlanDay = {
  dow: number; label: string; workout: string;
  exercises: PlanExercise[];
  kcal: number; protein_g: number; carb_g: number; fat_g: number; notes: string | null;
};
export type HealthResp = {
  status: string; articles?: number; chunks?: number;
  foods?: number; sets_today?: number; today?: string;
};
export type ReadinessIn = {
  sleep_hours?: number | null; soreness?: number | null;
  hrv_rmssd?: number | null; notes?: string | null; day?: string;
};
export type ReadinessRow = {
  day: string; sleep_hours: number | null; soreness: number | null;
  hrv_rmssd: number | null; notes: string | null; logged_at: string;
};
export type ReadinessScore = {
  level: "green" | "amber" | "red";
  reason: string;
  median_sleep?: number;
  rule?: string;
};
export type LiftSeries = {
  exercise: string; n: number; latest_e1rm: number;
  trend: "up" | "flat" | "down";
  history: { day: string; e1rm: number; weight: number; reps: number }[];
};
export type ProgrammeWorkoutEx = {
  name: string; sets: number; reps: string; rir: number;
  rest_sec?: number; cue?: string; superset?: string;
  _swapped_from?: string; _swapped_by?: string; _pattern?: string;
  _dropped?: boolean; _dropped_by?: string;
  _reduced?: boolean; _reduce_note?: string; _reduced_by?: string;
  _cued?: boolean; _cue_note?: string; _cued_by?: string;
};
export type WarmupSection = {
  section: string; duration?: string; rationale?: string; items: string[];
};
export type PreSession = {
  kind: "rehab" | "rehab_day" | "warmup" | "z2";
  title: string; subtitle?: string; items: string[];
  sections?: WarmupSection[];
};
export type InjuryEntry = {
  name: string; label: string; anatomy: string; rule: string;
  active: boolean; since: string | null; notes: string | null;
  swaps: { pattern: string; to: string }[];
  reduces: { pattern: string; note: string }[];
  cues: { pattern: string; note: string }[];
  drops: string[];
  rehab: string[];
};
export type ProgrammeWorkout = {
  dow: number; label: string; workout: string;
  exercises: ProgrammeWorkoutEx[]; notes?: string;
};
export type ProgrammeInjury = {
  name: string; label: string; anatomy?: string; rule: string;
  since?: string | null; notes?: string | null; rehab: string[];
};
export type ProgrammeDay = {
  dow: number; label: string;
  is_training_day: boolean; day_type: "training" | "rest"; is_today: boolean;
  targets: { kcal: number; protein_g: number; carb_g: number; fat_g: number };
  pre_session: PreSession | null;
  warmup: PreSession | null;
  workout: ProgrammeWorkout;
};
export type CyclingWindow = {
  date: string; weekday: string; label: string;
  hours: number; avg_temp_c: number; max_precip_pct: number;
  max_wind_kmh: number; conditions: string; score: number;
  kcal_estimate: number; kcal_easy: number; kcal_moderate: number;
  ride_minutes: number; bike?: string;
};
export type CyclingForecast = {
  available: boolean; location?: string; rationale?: string;
  windows: CyclingWindow[]; error?: string;
};
export type ProgrammeWeek = {
  today_dow: number; phase: number; week_of_cut: number;
  injuries: ProgrammeInjury[];
  days: ProgrammeDay[];
  cardio?: CyclingForecast;
};

export type ProgrammeToday = {
  date: string; week_of_cut: number; weeks_remaining: number;
  phase: number; day_type: "training" | "rest"; is_training_day: boolean;
  targets: { kcal: number; protein_g: number; carb_g: number; fat_g: number };
  pre_session: PreSession | null;
  warmup: PreSession | null;
  workout: ProgrammeWorkout;
  injuries: ProgrammeInjury[];
  cardio?: {
    available: boolean;
    today_window: CyclingWindow | null;
    next_best: CyclingWindow[];
  };
};

export type WeeklyReview = {
  lifts: LiftSeries[];
  weight_slope_pct_per_week: number | null;
  readiness: ReadinessScore;
  deload_recommended: boolean;
  deload_reasons: string[];
};
