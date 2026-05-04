---
topic: satiety_high_volume_palatable_meals
pillar: nutrition
confidence: high
last_reviewed: 2026-05-02
applies_to: [cutting, naturals, hypertrophy]
related: [protein_requirements_deficit, binge_eating_psychology_defense, toronto_freshco_meal_economics]
sources: [holt1995, rolls2009, simpson2005, hall2019, stubbs2000, rebello2016]
---

# Satiety, High-Volume & Palatable Meals

> Build every meal around protein + fibre + vegetable volume, season aggressively with zero-kcal flavour, and avoid ultra-processed soft-textured foods that bypass fullness signals.

## What the evidence says

Satiety is a measurable property of foods, not a function of willpower.
Holt's 1995 satiety index fed 38 isocaloric (240 kcal) test foods and
indexed 2-hour fullness against white bread = 100 [^holt1995]. Boiled
potatoes scored **323** — more than 3× white bread and 7× a croissant.
The pattern repeats: whole, water-rich, protein- or fibre-dense foods
dominate; refined fat-sugar combos collapse.

Four mechanisms drive the ranking. **Protein** has the strongest per-gram
effect via TEF (~20–30%), slow gastric emptying, and CCK/GLP-1/PYY
release; the protein leverage hypothesis predicts humans overeat
carbs/fat until absolute protein needs are met [^simpson2005]. **Energy
density** (kcal/g) is Rolls' dominant predictor of total intake — low-ED
foods produce equivalent fullness at far fewer kcal [^rolls2009].
**Viscous fibre** (oats, psyllium, beans) outperforms insoluble for
hunger suppression [^rebello2016]. **Palatability** has an inverse effect
when engineered: Hall's 2019 metabolic-ward RCT had subjects eat
**+508 kcal/day** on ultra-processed vs unprocessed diets matched for
macros, fibre, sugar, sodium, and rated palatability [^hall2019].
Soft-textured calorie-dense foods bypass fullness signals [^stubbs2000].

The actionable implication: well-prepared whole foods can be both
delicious and satiating. The trap is ultra-processed "diet" foods that
sacrifice both.

## Practical rules

- **Satiety hierarchy:** protein > viscous fibre > volume/water > viscosity > (inverse) palatability.
- **Highest-satiety foods per kcal** (Holt-ranked): boiled potatoes, white fish, oatmeal, oranges, apples, wholemeal pasta, lean beef, beans, eggs, brown rice.
- **Lowest-satiety foods:** croissants, cake, doughnuts, candy bars, peanuts.
- **Vegetable bulk rule:** 200–400 g low-ED vegetables in every main meal (broccoli, peppers, mushrooms, leafy greens, zucchini, cabbage).
- **Fibre target:** 30–40 g/day for a 96 kg male cutter; bias toward viscous (oats, psyllium 5–10 g, beans).
- **Flavour palette (free kcal):** hot sauce, mustard, vinegar, lemon, herbs, spices, soy/tamari, kimchi, sauerkraut, salsa, pickles, garlic, ginger.
- **Avoid:** soft ultra-processed foods (chips, cookies, ice cream, pastries) for daily volume; allocate to a small discretionary band if at all.
- **Reject "diet" swaps:** smaller portions of real food beat fat-free / sugar-free reformulations on both palatability and satiety.

## Engine rules

- `R-satiety-score`: rank logged foods by Holt-style satiety-per-kcal index; surface swaps when 24 h adherence < 80%.
- `R-veg-bulk`: flag main meals with < 150 g vegetables; suggest a low-ED side.
- `R-fibre-floor`: minimum 25 g/day; target 30–40 g.
- Pairs with `protein_requirements_deficit` (which sets the protein floor that satiety leans on).

## What this does not say

- Satiety rankings are population averages; individual variance is real.
- Holt 1995 used isocaloric 240 kcal portions — extrapolation to large meals is approximate.
- "Volume eating" can be taken too far: 800 g of broccoli in one sitting causes GI distress without improving outcomes.
- Ultra-processed avoidance is a heuristic, not a moral rule — a single ultra-processed item inside a high-protein, high-fibre day rarely matters.
- The palatability inverse effect applies to **engineered** hyper-palatability (the bliss-point fat+sugar+salt+soft-texture combo), not to delicious whole-food cooking.

## Meal templates (96 kg cutter, ~2,200 kcal/day)

| # | Template | kcal | P (g) | C (g) | F (g) |
|---|---|---|---|---|---|
| 1 | Bowl: 200 g jasmine rice + 200 g chicken thigh + 250 g roasted veg + 20 g tahini-lemon | 720 | 55 | 70 | 24 |
| 2 | Plate: 350 g 90/10 ground beef + 400 g boiled potatoes + 200 g salad + 15 g vinaigrette | 780 | 75 | 70 | 23 |
| 3 | Wrap: low-carb tortilla + 200 g chicken breast + 80 g Greek yoghurt sauce + 200 g crunch veg | 480 | 60 | 30 | 12 |
| 4 | Stir-fry: 250 g chicken breast + 300 g frozen Asian veg + soy/ginger/garlic + 150 g rice + 10 g sesame oil | 620 | 65 | 60 | 14 |

## Source tier counts

- **T1 (peer-reviewed):** 6 — Holt 1995, Rolls 2009, Simpson 2005, Hall 2019, Stubbs 2000, Rebello 2016
- **T2 (evidence-based practitioner):** 4 — SBS, MASS, Examine, Lyle McDonald
- **T3 (practitioner):** 2 — RP Strength, MacroFactor blog

## Related

- [protein_requirements_deficit](../nutrition/protein_requirements_deficit.md) — sets the protein floor that drives the dominant satiety lever.
- [binge_eating_psychology_defense](../nutrition/binge_eating_psychology_defense.md) — high-satiety meal design is the first defence against deficit-driven binges.
- [toronto_freshco_meal_economics](../nutrition/toronto_freshco_meal_economics.md) — sourcing the high-satiety staples (potatoes, oats, chicken, beans, frozen veg) cheaply.

## Sources

[^holt1995]: Holt SH et al. A satiety index of common foods. *Eur J Clin Nutr.* 1995;49(9):675–90.
[^rolls2009]: Rolls BJ. The relationship between dietary energy density and energy intake. *Physiol Behav.* 2009;97(5):609–15.
[^simpson2005]: Simpson SJ, Raubenheimer D. Obesity: the protein leverage hypothesis. *Obes Rev.* 2005;6(2):133–42.
[^hall2019]: Hall KD et al. Ultra-processed diets cause excess calorie intake and weight gain. *Cell Metab.* 2019;30(1):67–77.
[^stubbs2000]: Stubbs RJ, Whybrow S. Energy density, diet composition and palatability. *Physiol Behav.* 2004;81(5):755–64.
[^rebello2016]: Rebello CJ et al. Dietary fiber and satiety: the effects of oats on satiety. *Nutr Rev.* 2016;74(2):131–47.