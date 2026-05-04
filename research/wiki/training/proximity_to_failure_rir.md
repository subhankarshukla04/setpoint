---
topic: proximity_to_failure_rir
pillar: training
confidence: medium
last_reviewed: 2026-05-02
applies_to: [hypertrophy, naturals]
related: [volume_landmarks_naturals, mechanical_tension_hypertrophy, deload_triggers]
sources: [robinson2024, refalo-2023-rir, santanielo2024, zourdos2016, helms2016, sbs_rir, sbs_effective]
---

# Proximity to Failure / Reps in Reserve (RIR)

> Keep most working sets at RIR 1–3 (cap compounds at RIR 1, allow isolations to RIR 0) — closer-to-failure work plateaus past RIR 3 and failure on compounds costs more than it adds.

**Reps in reserve (RIR)** is the number of additional reps a lifter believes they could complete with good form before momentary muscular failure. It is the cleanest available proxy for set effort and the operational unit CutTrack uses to classify whether a logged set "counts" toward hypertrophy volume.

## What the literature says

### Hypertrophy: failure not required

When weekly volume is equated, training to momentary failure is **not superior** to training with reps in reserve. Refalo et al. (2023), in a meta-analysis of 15 studies, found only a "trivial advantage" for failure over non-failure on hypertrophy[^refalo2023]. Robinson et al. (2024), the largest dose-response meta-regression to date, reports that hypertrophy *does* improve as sets approach failure, but the relationship is **non-linear** — once you are within roughly 3 RIR, additional closeness adds little[^robinson2024]. An 8-week RCT in trained lifters confirmed similar hypertrophy between failure and 2-RIR groups[^santanielo2024].

Practical read: working sets at **RIR 0 to 3** all sit on the productive plateau. Most volume should live at RIR 1 to 3.

### Strength: closer-to-failure mildly favoured, with caveats

Robinson 2024 found the slope of the RIR–strength relationship had confidence intervals overlapping zero — strength gains were comparable across a wide RIR range[^robinson2024]. The signal that exists slightly favours closer-to-failure work, but **load specificity dominates**: heavy loads at RIR 1–3 outperform light loads at RIR 0 for strength.

### RIR estimation accuracy improves with experience

Self-reported RIR is noisy. Trained lifters mis-predict by ~1–2 reps; novices systematically **over-estimate RIR** — they call a set "RIR 3" when it is really 0–1[^zourdos2016]. Stronger By Science notes calibration takes roughly 6 to 12 weeks of consistent training and is better on isolations than free-weight compounds[^sbs_rir]. Helms framed RIR/RPE as a tool best used by **intermediates and above**[^helms2016].

### Compound vs isolation: failure is not free

Failure on heavy compounds (squat, deadlift, bench, row) imposes substantially higher fatigue cost — longer neuromuscular recovery, more central contribution, larger drop in subsequent set quality. Failure on isolation/machine work recovers faster and the RIR estimate is more trustworthy[^sbs_rir]. Sensible default: **cap compounds at RIR 1**, allow isolations to **RIR 0** on the final set.

### The "effective reps" framing

The popular claim that only the last 3–5 reps before failure stimulate growth ("effective reps") is intuitive but **not well supported**. EMG data show near-maximal motor-unit recruitment well before failure, and meta-analyses do not show a step-function at any specific rep distance[^sbs_effective]. Treat proximity to failure as a smooth, plateauing curve — not as a binary on/off switch at "5 reps left".

## CutTrack defaults

- **Hard-set classifier:** a logged set counts toward weekly hypertrophy volume iff `RIR <= 3` AND `load >= ~30% 1RM`. Sets at RIR 4+ are flagged as warm-ups or back-off work and excluded from the volume tally.
- **Prescription default:** working sets at RIR 1–3. Last set of an exercise may go to RIR 0 on isolations. Compounds capped at RIR 1.
- **Novice penalty:** if user has < 6 months consistent training history, assume reported RIR is over-estimated by ~2. Reclassify their reported "RIR 3" as effectively RIR 1 for volume accounting until session-to-session load progression confirms calibration.
- **Failure-frequency guard:** if > 25% of weekly working sets are logged at RIR 0, raise the [deload_triggers](deload_triggers.md) probability — this is a fatigue accumulation signal, not a stimulus signal.

## When to push to true failure

- Final set of an isolation lift on a microcycle's last working session for that muscle.
- Single-joint accessories where load is small and joint stress is low (curls, lateral raises, leg curls).
- Diagnostic AMRAPs to recalibrate the user's RIR estimate (every 4–6 weeks).
- **Avoid:** failure on compounds, on the first exercise of a session, in the final week before a deload, or in cuts where recovery is already compromised.

## Citations

[^robinson2024]: Robinson ZP et al. (2024). Dose-response meta-regression: proximity to failure, strength, hypertrophy. *Sports Medicine*. https://pubmed.ncbi.nlm.nih.gov/38970765/
[^refalo2023]: Refalo MC et al. (2023). Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy: Meta-analysis. *Sports Medicine*. https://pubmed.ncbi.nlm.nih.gov/36334240/
[^santanielo2024]: Karsten B et al. (2024). Similar muscle hypertrophy: failure vs RIR over 8 weeks. *J Sports Sci*. https://pubmed.ncbi.nlm.nih.gov/38393985/
[^zourdos2016]: Zourdos MC et al. (2016). RIR-based RPE scale validation. *J Strength Cond Res*. https://pmc.ncbi.nlm.nih.gov/articles/PMC4961270/
[^helms2016]: Helms ER et al. (2016). Application of the RIR-Based RPE Scale. *Strength Cond J*. https://pmc.ncbi.nlm.nih.gov/articles/PMC4961270/
[^sbs_rir]: Stronger By Science. Reps in Reserve accuracy. https://www.strongerbyscience.com/reps-in-reserve/
[^sbs_effective]: Stronger By Science. The Evidence is Lacking for "Effective Reps". https://www.strongerbyscience.com/effective-reps/