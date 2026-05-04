---
topic: protein_dosing_high_body_fat
pillar: nutrition
confidence: medium
last_reviewed: 2026-05-02
applies_to: [cutting, naturals, hypertrophy]
related: [protein_requirements_deficit, body_fat_estimation_no_dexa, rate_of_loss_lean_retention]
sources: [helms2014, phillips2014, longland2016, aragon2017, morton2018, helms]
---

# Protein Dosing at Higher Body Fat

> Above ~25% body fat the total-bodyweight rule over-prescribes protein; switch to 2.2–2.4 g/kg fat-free mass and let the engine take whichever floor is higher.

## What the evidence says

The standard 1.6–2.4 g/kg total body weight (BW) prescription was
derived in resistance-trained, relatively lean cohorts — typically
under 20% BF for men [^phillips2014]. Fat mass scales the denominator
without raising actual amino-acid demand, so as BF climbs, total-BW
dosing increasingly over-prescribes protein relative to the lean
tissue actually being defended [^helms2014].

Helms' 2014 systematic review reframed the ceiling in fat-free mass
(FFM) terms — **2.3–3.1 g/kg FFM** — which holds across leanness
levels [^helms2014]. The lower bound of useful intake in a deficit,
~1.6 g/kg FFM, is where lean-mass retention degrades in trained
lifters even on hard programs [^longland2016][^morton2018]. Helms,
Morgan & Valdez extended this into practice in the *Muscle and
Strength Pyramid*, recommending higher-BF lifters anchor on FFM
rather than scale weight [^helms].

The two rules cross near **~25% BF in men, ~32% in women**. Below the
cross-over the rules agree to within ~10% and total-BW dosing is
fine. Above it, the FFM rule yields a smaller, more defensible
absolute target [^aragon2017][^helms2014].

## Practical rules

- **<20% BF (men):** use total-BW (1.8–2.4 g/kg). FFM rule is redundant.
- **20–25% BF:** compute both, use the higher number (safety floor).
- **>25% BF:** anchor on FFM (2.2–2.4 g/kg FFM); total-BW becomes a
  sanity check.
- **No defensible BF estimate yet:** default to **1.8 g/kg total BW**
  as the safe floor while a body-comp estimate is collected. See
  [body_fat_estimation_no_dexa](../nutrition/body_fat_estimation_no_dexa.md).
- **Floor formula:** `protein_floor = max(1.8 g/kg total BW, 2.0 g/kg FFM)`
  computed from the most recent body-comp estimate. Whichever is
  higher wins.
- **Ceiling formula:** `protein_ceiling = min(2.4 g/kg total BW, 3.1 g/kg FFM)`.
- **Lower bound does not move with BF.** The 1.6–1.8 g/kg lean-retention
  floor [^longland2016] still applies — translating it to FFM at 30% BF
  gives ~2.6 g/kg FFM, still inside Helms' band [^helms2014].

## Worked example — 96 kg lifter

| BF % | FFM | Total-BW (1.8–2.4) | FFM target (2.2 g/kg) | Engine floor `max(1.8 BW, 2.0 FFM)` |
|---|---|---|---|---|
| 15% | 81.6 kg | 173–230 g | 180 g | **173 g** |
| 20% | 76.8 kg | 173–230 g | 169 g | **173 g** |
| 25% | 72.0 kg | 173–230 g | 158 g | **173 g** |
| 30% | 67.2 kg | 173–230 g | 148 g | **173 g** |

The 1.8 g/kg total-BW floor (173 g) dominates across all four BF
levels for this lifter — the lower bound does **not** move with BF.
What moves is the *ceiling*: at 30% BF the upper bound drops from
230 g (2.4 g/kg BW) to ~208 g (3.1 g/kg FFM). At higher BF the FFM
rule prevents over-prescription without cutting into the
lean-retention floor.

## What this does not say

- The 25% cross-over is a working heuristic, not a measured threshold.
  Non-DEXA BF estimates carry ±3–5% error, so the engine should round
  conservatively upward when BF sits within 3% of cross-over.
- It does not lower protein in a deficit. Below ~1.6 g/kg FFM lean-mass
  loss accelerates regardless of BF [^longland2016][^morton2018].
- It does not justify dropping protein to "feel right" if a lifter
  guesses they are higher BF — the rule only kicks in once a defensible
  estimate exists.
- Plant-protein-only lifters likely need ~10–20% higher totals than
  this rule prescribes; not addressed here.

## Related

- [protein_requirements_deficit](../nutrition/protein_requirements_deficit.md) —
  baseline 1.8–2.4 g/kg total-BW rule this article refines.
- [body_fat_estimation_no_dexa](../nutrition/body_fat_estimation_no_dexa.md) —
  how to get the BF estimate that switches dosing rules.
- [rate_of_loss_lean_retention](../nutrition/rate_of_loss_lean_retention.md) —
  rate of loss interacts with protein floor; both protect lean mass.

## Sources

[^helms2014]: Helms ER, Aragon AA, Fitschen PJ. Evidence-based
  recommendations for natural bodybuilding contest preparation:
  nutrition and supplementation. *J Int Soc Sports Nutr.* 2014;11:20.
[^phillips2014]: Phillips SM, Van Loon LJC. Dietary protein for
  athletes. *J Sports Sci.* 2011/2014.
[^longland2016]: Longland TM et al. Higher protein during energy
  deficit with intense exercise promotes greater lean mass gain and
  fat loss. *Am J Clin Nutr.* 2016;103(3):738–46.
[^aragon2017]: Aragon AA, Schoenfeld BJ. Nutrient timing revisited.
  *J Int Soc Sports Nutr.* 2013/2017.
[^morton2018]: Morton RW et al. Meta-analysis of protein supplementation
  effects on resistance-training adaptations. *Br J Sports Med.*
  2018;52:376–384.
[^helms]: Helms E, Morgan A, Valdez A. *The Muscle and Strength
  Pyramid: Nutrition*, 2nd ed. 2019.