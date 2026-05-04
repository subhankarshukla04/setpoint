---
topic: body_fat_estimation_no_dexa
pillar: nutrition
confidence: high
last_reviewed: 2026-05-02
applies_to: [hypertrophy, naturals, cutting]
related: [protein_dosing_high_body_fat, trend_weighting_scale_weight, perceived_progress_without_scale]
sources: [hodgdon, sun, jackson, deurenberg, bia_review, sbs_visual, wang]
---

# Body Fat Estimation Without DEXA

> The Navy circumference formula (neck + waist + height) is the best home method — SEE ~3.5% BF, repeatable enough to drive a cut when paired with monthly photos and the morning-weight EWMA.

## What the evidence says
DEXA itself carries an SEE of ~1.8–2.5% BF against the 4-compartment reference, with 2–3% inter-machine drift [^wang], so even the home gold standard is not exact. For cut management, **repeatability under a fixed protocol matters more than absolute accuracy** — the engine cares about the *slope* of body-fat over weeks, not the level on any given Sunday.

Hodgdon & Beckett (1984) developed the **Navy circumference formula** on ~3,000 US Navy personnel against hydrostatic weighing, reporting an SEE of **3.52% BF for men** [^hodgdon]. Validation against DEXA in mixed civilian samples shows it under-estimates lean men by 2–4% and over-estimates obese men by 3–6%, but within-subject test-retest is ~1% BF when neck and waist are measured identically [^hodgdon][^sun]. **Skinfolds (Jackson-Pollock 3-site or 7-site)** report SEE ~3.5% BF in lab conditions [^jackson] but degrade to ~4% in self-administered home use, since pinch consistency dominates the error.

**Consumer BIA scales** report SEE of 4–8% BF against DEXA with absolute bias up to ±5%, and reading shifts of several percent within a single day from hydration, meals, and skin temperature [^bia_review]. **BMI-based formulas (Deurenberg 1991)** report ~4% SEE in general populations [^deurenberg] but **systematically over-estimate body fat by 5–10% in trained lifters** because they assume population-average lean mass per unit BMI [^sun]. Visual estimation against photo charts runs 5–8% absolute error for self-assessment [^sbs_visual] — bad as a level, useful as a monthly trend with controlled lighting.

## Practical rules
- **Default home method: Navy circumference, weekly.** Men, metric:
  ```
  %BF = 495 / (1.0324 − 0.19077·log10(waist_cm − neck_cm) + 0.15456·log10(height_cm)) − 450
  ```
  Neck just below larynx, waist at navel, end of normal exhale, tape horizontal and snug.
- **Composite protocol**: weekly Navy + monthly progress photos + daily morning weight (EWMA) — see `trend_weighting_scale_weight`.
- **Photo protocol**: same room, same lighting, same time of day, same pose set (relaxed front, side, back), same phone position. Monthly cadence.
- **BIA smart scale**: trend-only, fasted/post-void/same time. Never quote the absolute.
- **Track slope, not level.** Single body-fat estimates are bias-shifted; the derivative over 6–8 weeks is the actionable signal.
- **Visual reference markers (men)**:
  | %BF | Marker |
  |---|---|
  | 10 | 4-pack relaxed, deltoid separation, forearm vascularity |
  | 12 | All 4 abs outlined relaxed, oblique line visible |
  | 15 | Top 2 abs relaxed, full abs flexed, no lower-back fold |
  | 18 | Soft midline, faint abs only flexed, small lower-back fold |
  | 20 | Visible love handles, no flexed ab definition |
  | 25 | Rounded midsection, no muscular separation |

## Worked example
A 96 kg, 6'2" (187.96 cm) lifter with neck 40 cm and waist 90 cm:
```
waist − neck = 50; log10(50) = 1.69897; log10(187.96) = 2.27396
denom = 1.0324 − 0.19077·1.69897 + 0.15456·2.27396 = 1.05977
%BF   = 495 / 1.05977 − 450 = 17.1% BF
```
Fat mass ≈ 16.3 kg, lean ≈ 79.7 kg. Navy SEE band: **true value most likely 13.5–20.5%**. Use the slope, not the level.

## What this does not say
- Navy is **not** more accurate than DEXA — it is more *practical*. SEE 3.5% means single readings can be off by 3–4% in either direction.
- **BMI-based body-fat (Deurenberg, "BMI calculator" online estimators) is invalid for lifters** — systematic 5–10% over-estimate. Block these.
- **BIA absolutes are not credible.** Two readings 30 minutes apart can differ 3% from a glass of water alone.
- A 1–2% week-to-week move in any single method is **inside the noise floor**. Suppress %BF-derived "lean mass loss" alarms under 4 weeks of data.
- The Navy waist site (navel) is **not** the WHO/NHANES site (iliac crest) — the formula is calibrated to navel; do not mix sites.

## Related
- [protein_dosing_high_body_fat](../nutrition/protein_dosing_high_body_fat.md) — protein dose depends on lean mass, which depends on a body-fat estimate; this article supplies the input.
- [trend_weighting_scale_weight](../nutrition/trend_weighting_scale_weight.md) — the daily weight pipeline that pairs with weekly Navy to triangulate fat-vs-lean loss.
- [perceived_progress_without_scale](../nutrition/perceived_progress_without_scale.md) — photo and tape protocols when scale weight stalls.

## Sources
[^hodgdon]: Hodgdon JA, Beckett MB (1984). Prediction of percent body fat from body circumferences and height. *Naval Health Research Center* 84-11. T1.
[^sun]: Sun SS et al. (2003). BIA prediction equations using a multicomponent model. *Am J Clin Nutr* 77(2):331–340. T1.
[^jackson]: Jackson AS, Pollock ML (1978/1985). Generalized equations for predicting body density. *Br J Nutr* 40:497–504. T1.
[^deurenberg]: Deurenberg P, Weststrate JA, Seidell JC (1991). BMI as a measure of body fatness. *Br J Nutr* 65(2):105–114. T1.
[^bia_review]: Dehghan M, Merchant AT (2008). Is BIA accurate for large epidemiological studies? *Nutr J* 7:26. T1.
[^sbs_visual]: Stronger By Science — body composition assessment guides (visual estimation accuracy). T2.
[^wang]: Wang J et al. — DEXA vs 4-compartment validation literature. T1.

## Tier counts
T1: 6 — T2: 1 — T3: 0

## Bottom line
- **Navy circumference, weekly, same protocol** — SEE ~3.5% BF, the home best.
- **Composite trumps any single method**: Navy weekly + photos monthly + morning weight EWMA daily.
- **17.1% BF** for the 96 kg / 6'2" / neck 40 / waist 90 worked example.