---
topic: sleep_performance_elasticity
pillar: recovery
confidence: medium
last_reviewed: 2026-05-02
applies_to: [strength_training, hypertrophy, recovery]
related: [hrv_practical_use, deload_triggers]
sources: [vandongen2003, mah2011, lastella2015, halson2014, lamon2021, saner2020, leproult2011, craven2022, knufinke2018, subjective_objective, hrv_sleep, sbs_sleeploss, sbs_sleep_workouts, terra_hrv]
---

# Sleep Performance Elasticity

> Track per-user deviation from 14-day median sleep — cut top-set load 5–10% after two consecutive nights >1 h short, and pause volume escalation when 7-day average drops below 7 h.

**Sleep performance elasticity** is the responsiveness of next-session lifting performance and longer-run hypertrophy to a marginal hour of sleep. CutTrack treats it as a continuous, per-user signal — not a binary "rested / not rested" flag — and uses it as a primary input to load and volume autoregulation.

## What the literature says

### Acute (1-night) effect: small but real

A meta-analysis of acute sleep loss reports an effect size of −0.24 on maximal strength and a per-hour-of-wakefulness elasticity of roughly **0.4% performance decrement per additional hour awake** before training[^craven2022][^sbs_sleeploss]. One night of total deprivation produces ~2–3% strength loss on average, with multi-joint compounds more affected than single-joint isolation work[^craven2022]. Power, sprint speed, and skill-execution tasks are hit harder than 1RM, and evening sessions after poor sleep suffer more than morning sessions[^sbs_sleep_workouts].

### Cumulative restriction: the unreliable narrator problem

Van Dongen 2003, the canonical dose-response paper, ran 14 nights of 4 h, 6 h, or 8 h time-in-bed[^vandongen2003]. After two weeks, the **6-hour group was as impaired as people who had not slept for 2 nights** — and they reported feeling fine. Subjective sleepiness ratings did not track the deficit. Translation: an athlete chronically sleeping 6 h is meaningfully impaired, even if they swear they are not.

### Chronic restriction: hypertrophy and the hormonal axis

- **MPS:** A single night of total deprivation reduced postprandial myofibrillar protein synthesis by **18%**, raised cortisol 21%, and dropped testosterone 24%[^lamon2021]. Five nights of 4 h TIB lowered myofibrillar MPS in healthy young men; HIIT *partially* rescued the suppression but did not abolish it[^saner2020].
- **Endocrine:** One week of 5 h sleep cut daytime testosterone by **10–15%** in healthy young men — equivalent to aging the endocrine profile by 10–15 years[^leproult2011].
- **Net effect:** chronic restriction shifts the testosterone/cortisol balance toward catabolism, downregulates GH and IGF-1 secretion in slow-wave sleep, and creates anabolic resistance[^lamon2021].

### Sleep extension upside (Mah)

Mah 2011 had Stanford men's varsity basketball players target 10 h TIB for 5–7 weeks after a 6–9 h baseline. Result: 282-foot sprint time **−4.3%**, free-throw % **+9 pp**, three-point % **+9.2 pp**, plus better reaction time and mood[^mah2011]. Most athletes are sub-clinically restricted (elite baseline ~6.7 h actigraphy; PSQI ≥ 5 in ~52%[^lastella2015][^halson2014]) — meaning the extension upside is real and often untapped.

### Subjective quality is partially independent of objective duration

Self-reported sleep over-estimates actigraphy (especially in male athletes)[^knufinke2018]. Subjective *quality* before competition is rated higher even when objective measures are unchanged[^subjective_objective]. Light hygiene interventions (dim PM / bright AM) improve subjective ratings without changing actigraphy[^knufinke2018]. CutTrack should track quality and duration separately — they are correlated but not redundant.

### HRV is correlated with sleep but not redundant

Pre-sleep HRV predicts sleep continuity, and HF-HRV couples with slow-wave sleep during recovery[^hrv_sleep]. But day-to-day correlation between sleep and HRV is **weak** — r ≈ 0.12 over 3-day windows[^terra_hrv]. HRV reflects whole-system autonomic state; stress, alcohol, illness, heat, and travel often dominate the sleep signal. Both belong in the recovery score; neither subsumes the other.

## CutTrack defaults

- **Per-user baseline:** rolling 14-day median sleep duration is the user's "normal". All elasticity calculations are computed against this median, not a population norm. Chronotype varies; absolute clock-time is a worse anchor than personal deviation.
- **Acute trigger (recommendation engine):** if `nightly_sleep < user_median − 1h` for **≥ 2 consecutive nights** → suggest top-set load **−5% to −10%** OR drop the last working set on compound lifts. Keep isolations at planned RIR.
- **Cumulative trigger:** if 7-day rolling average < 7 h AND user is in a hypertrophy phase → flag impaired-MPS risk. Pause volume escalation; suggest sleep prioritisation before progressing. Feeds [deload_triggers](../training/deload_triggers.md).
- **Quality vs duration:** capture both — objective duration (wearable preferred, self-report discounted ~30 min) and subjective quality (1–5 scale). Do not collapse into a single number.
- **HRV blending:** combine with HRV per [hrv_practical_use](hrv_practical_use.md) using partial-redundancy weighting, not full overlap. A bad HRV *and* a bad sleep night is a stronger signal than either alone, and should weight the load reduction toward the upper end of the 5–10% range.
- **Sleep-extension nudge:** if user's median sleep < 7 h for > 14 days, suggest 30–60 min earlier bedtime for the 2 weeks preceding any strength peaking block. Mah-style upside is most accessible to chronically restricted users.

## Practical thresholds (quick reference)

| Sleep pattern | Expected impact | CutTrack action |
|---|---|---|
| 1 bad night after ≥ 7 h baseline | Minimal on 1RM; reaction time noticeable | Train as planned; optionally shave 5% off top set |
| < 6 h × 2+ consecutive nights | ~5–10% strength decrement on compounds; larger on power/endurance | Top-set load −5% to −10%, drop last working set on compounds |
| < 7 h chronic (7-day rolling) | MPS impaired, anabolic environment compromised | Hold volume, prioritise sleep before progressing; flag for deload review |
| Sleep extension to 8.5–10 h × 2–4 weeks | 2–5% performance gain in restricted athletes | Recommend before peaking blocks if user median < 7 h |

## What to ignore

- **"I feel fine on 6 hours."** Van Dongen showed this is the modal report from already-impaired subjects[^vandongen2003]. Self-rated alertness is not a valid recovery metric on its own.
- **A single heroic night.** One night of 9 h sleep does not undo 5 nights of 5 h sleep. Recovery sleep is partial; the deficit attenuates over multiple nights.
- **HRV alone.** A clean HRV after a bad sleep night is not permission to push. Treat them as complementary signals.

## Citations

[^vandongen2003]: Van Dongen HPA et al. (2003). The cumulative cost of additional wakefulness. *Sleep* 26(2):117–126. https://pubmed.ncbi.nlm.nih.gov/12683469/
[^mah2011]: Mah CD et al. (2011). The effects of sleep extension on the athletic performance of collegiate basketball players. *Sleep* 34(7):943–950. https://pubmed.ncbi.nlm.nih.gov/21731144/
[^lastella2015]: Lastella M et al. (2015). Sleep/wake behaviours of elite athletes. *Eur J Sport Sci*. https://pubmed.ncbi.nlm.nih.gov/24993935/
[^halson2014]: Halson SL. (2014). Sleep in elite athletes and nutritional interventions to enhance sleep. *Sports Medicine*. https://pubmed.ncbi.nlm.nih.gov/24791913/
[^lamon2021]: Lamon S et al. (2021). Acute sleep deprivation, skeletal muscle protein synthesis and the hormonal environment. *Physiol Rep*. https://pubmed.ncbi.nlm.nih.gov/33400856/
[^saner2020]: Saner NJ et al. (2020). Sleep restriction with or without HIIT and myofibrillar protein synthesis. *J Physiol*. https://pubmed.ncbi.nlm.nih.gov/32078168/
[^leproult2011]: Leproult R, Van Cauter E. (2011). One week of sleep restriction and testosterone levels in young men. *JAMA*. https://pmc.ncbi.nlm.nih.gov/articles/PMC4445839/
[^craven2022]: Craven J et al. (2022). Acute sleep loss and physical performance: meta-analysis. *Sports Medicine*. https://pmc.ncbi.nlm.nih.gov/articles/PMC9584849/
[^knufinke2018]: Knufinke M et al. (2018). Self-reported sleep quantity, quality, and hygiene in elite athletes. *J Sleep Res*. https://pubmed.ncbi.nlm.nih.gov/28271579/
[^subjective_objective]: Sleep duration and performance among competitive athletes: systematic review. https://pubmed.ncbi.nlm.nih.gov/29944513/
[^hrv_sleep]: Pre-sleep HRV predicts sleep continuity. *Frontiers in Physiology* 2025. https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2025.1627287/full
[^sbs_sleeploss]: Stronger By Science. Sleep loss and strength performance. https://www.strongerbyscience.com/research-spotlight-sleep-loss/
[^sbs_sleep_workouts]: Stronger By Science. How does sleep deprivation affect your workouts? https://www.strongerbyscience.com/sleep-deprivation-affect-workouts/
[^terra_hrv]: Terra Research. Weak HRV–sleep correlation. https://tryterra.co/research/think-a-good-hrv-score-follows-a-good-night-sleep