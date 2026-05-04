---
topic: trend_weighting_scale_weight
pillar: nutrition
confidence: high
last_reviewed: 2026-05-02
applies_to: [hypertrophy, naturals, cutting]
related: [rate_of_loss_lean_retention, refeeds_diet_breaks]
sources: [bodywater, walker, libra, happyscale, sbs]
---

# Trend-Weighting Scale Weight

> Weigh daily under same conditions and act on a 14-day EMA (α ≈ 0.1) of morning weights — daily noise (~1–2 kg) routinely exceeds a true week of fat loss.

## TL;DR
Daily body weight swings **1–2 kg** from water, glycogen, sodium, and GI contents — the noise routinely exceeds a full week of true fat loss. The fix is an **exponentially weighted moving average (EWMA) with α ≈ 0.1**, the canonical *Hacker's Diet* smoothing used by Libra, Happy Scale, and MacroFactor. CutTrack runs a **14-day EMA on daily morning weights** and feeds its slope to the rate-of-loss guardrail.

## Why raw scale weight cannot drive a decision
Daily body weight commonly fluctuates **0.5–2 kg in either direction**, with multi-day swings of 1–2 kg routine [^bodywater]. Total body water alone can shift ±5% per day [^bodywater]. For a 96 kg lifter cutting at 0.7%/wk, true weekly loss is ~0.67 kg — **smaller than typical day-to-day noise**. Acting on raw daily readings is acting on noise.

Sources of the noise:

| Source | Typical impact |
|---|---|
| Glycogen + bound water (3 g water per g glycogen) | 1–3 kg after high-carb day |
| Sodium load | 0.5–1.5 kg for 24–48 h |
| GI contents | 0.3–1 kg variable |
| Training-day glycogen depletion | 0.5–1 kg, refilled next day |
| Refeed / diet break | 1–2 kg, decays 3–5 days |

## The Hacker's Diet smoothing
John Walker's 1991 *Hacker's Diet* introduced the convention every modern tool uses [^walker]. The recurrence:

```
trend_today = α · weight_today + (1 − α) · trend_yesterday
```

Walker's recommended **α = 0.1**, giving a ~10-day half-life and a roughly 14-day effective window. Recent data is weighted more heavily, but no single day can dominate.

**Independent practitioner tools converge on the same value:**
- **Libra** (Android) — `α = 1 / smoothing_days`, default 10 days → α = 0.1 [^libra]
- **Happy Scale** (iOS) — offers exponential smoothing and 7-day moving average among four methods [^happyscale]
- **MacroFactor / Stronger By Science** — EWMA that "weights recent data more, but cares about a fairly long window" [^sbs]

A simple **7-day rolling mean** also works and is easier to explain, but EWMA is smoother (no window-edge jumps) and weights recent data more — better when the underlying mean is moving, which is exactly the cutting case.

## Why ~14 days is the minimum window
Daily SD of body weight is ~0.5–1 kg [^bodywater]. A 14-day window reduces trend SD by √14 ≈ 3.7×, to roughly 0.15–0.3 kg. Two weeks of true loss at 0.7%/wk is ~1.34 kg — clearly above the noise floor. At 7 days, true loss (~0.67 kg) is only marginally above trend noise (~0.4 kg) and the rate estimate is jittery. **Below 14 days, the rate signal is not reliable enough to drive a calorie change.**

## Weigh-in protocol
The math only works if conditions are controlled [^walker][^sbs][^libra]:

1. **Daily.** Skipping days corrupts the EMA.
2. **Same time.** First thing in the morning.
3. **Post-void, pre-meal, pre-drink.**
4. **Same scale, same surface, no clothes.**
5. **Log every reading**, including the obvious spikes — they belong in the mean.

Outliers do not need to be censored; the EWMA absorbs them in a few days [^walker].

## How the engine uses this
CutTrack runs a **14-day EWMA with α = 0.1** on daily morning weights. The trailing 14-day **slope** is the body-weight rate signal that gates the R1 rule (rate of loss) — see [rate_of_loss_lean_retention](../nutrition/rate_of_loss_lean_retention.md):

| Trended rate | Engine response |
|---|---|
| >1.0%/wk × 2 consecutive weeks | Suggest +150 to +250 kcal/day |
| 0.25–1.0%/wk | In-range, no change |
| <0.25%/wk × 2 consecutive weeks | Suggest −150 kcal/day |

### Engine edge cases
- **First 14 days of a tracking window** — EMA is not converged. Suppress R1.
- **Planned refeed / diet break** — expect a 1–2 kg trend bump that decays over 3–5 days. Suppress R1 "stalled cut" trigger during and for 5 days after.
- **Missed days** — if >2 days missed in a 14-day window, mark rate estimate as low-confidence and do not fire R1.
- **Training-day vs rest-day glycogen swings** — absorbed by daily logging plus EMA; no special handling.
- **Female menstrual cycle** — N/A (male user).

## Practical recipe
1. Weigh daily, fasted, post-void, no clothes, same scale.
2. Log every reading.
3. Read the 14-day EMA, not the raw number.
4. Compare the 14-day trend slope against the rate-of-loss bounds — never single days, never week-to-week raw deltas.

## Sources
[^walker]: Walker J. *The Hacker's Diet* (1991). "Signal and Noise" chapter, fourmilab.ch. T3 — canonical source for EWMA-based weight smoothing.
[^libra]: Libra Weight Manager — official support docs. T3.
[^happyscale]: Happy Scale (iOS) — official support documentation. T3.
[^sbs]: Nuckols G. *MacroFactor's Algorithms and Core Philosophy*, Stronger By Science. T2.
[^bodywater]: Bhutani S et al. (2017). Composition of two-week change in body weight under unrestricted free-living conditions. *Obes Sci Pract*, 3(3):255–264. T1.
## Tier counts
T1: 2 — T2: 2 — T3: 3

## Bottom line
- **EMA α = 0.1** (Hacker's Diet / Libra default; ~10-day half-life).
- **Minimum data window: 14 days** of daily morning weights before the rate signal is trustworthy.