# XionMetrical

*Precision bio-telemetry for deep space missions.*

> **Educational prototype · simulated data · not a medical device.**
> Built by **Team Space Mercedes** for the **2026 NASA Space Apps Challenge** — challenge *Create Health Monitoring Software for Astronauts on Space Missions*.
> Code and texts were produced **with AI assistance** (declared below, in [AI usage](#ai-usage-si)).

- **Website and interactive demo:** https://mauroag22.github.io/XionMetrical/ · demo: https://mauroag22.github.io/XionMetrical/demo/
- **Video (≤ 30 s):** link added with the submission.

## What it is

Halfway to Mars, a message to Earth takes up to 20 minutes each way, so astronauts carry much of the responsibility for spotting changes in their own health. XionMetrical gathers **10 health indicators** that cover NASA's **5 hazards of human spaceflight**, compares every value with the **astronaut's own baseline**, flags drift early and shows **what to do — with a source for every line**.

The website has a landing page and an **interactive demo**: one example astronaut, 180 simulated days of a Mars transit, a clickable 2D body map, a traffic light, trend charts, 4-layer guidance and an Emergency guide.

## How it works

1. **Your baseline.** Days 1–30 build a personal band for each indicator: mean ± 1.5 standard deviations (with a small minimum width per indicator, at the measurement's resolution).
2. **Drift flagged early.** The traffic light (shape + word, never color alone):
   - **Normal** (green circle ✓) — inside your band and inside published limits.
   - **Drifting** (yellow triangle !) — outside your band **2+ days in a row**, or within 10% of a published limit / in a published "above normal" category, or a 14-day trend that would cross the limit within 30 days.
   - **Act now** (red octagon !) — beyond a published limit (NASA or general health).
   A value can be *inside* the general adult range and still be yellow because it moved away from **your** baseline — that is the core idea.
3. **Sourced guidance in 4 layers:** (a) status and why it matters, (b) what to do now, (c) when to escalate, (d) how to measure. Texts are fixed, written from the cited sources, and never generated inside the app. Where no countermeasure was published, the app says so and refers to the Crew Medical Officer. **No diagnosis, no medication, no doses.**
4. **Emergency guide** (chest pain or collapse, the challenge video's scenario): 8 steps — act on board first, message Earth store-and-forward without waiting.

## The 10 indicators

| # | Indicator | Hazard | Reference used | Source |
|---|---|---|---|---|
| 1 | Resting heart rate | Gravity fields | 60–100 bpm at rest (healthy adults on Earth); personal baseline first | MedlinePlus |
| 2 | Blood pressure | Gravity fields | CDC categories: normal < 120/80 · stage 2 ≥ 140/90 · > 180/120 severe | CDC |
| 3 | Body temperature | Closed environment | Normal 36.1–37.2 °C; fever > 38 °C; < 35 °C hypothermia | MedlinePlus; NASA-STD-3001 |
| 4 | Sleep | Isolation and confinement | NASA plans an 8.5 h sleep period per day [V1 6001]; alert from personal baseline | NASA-STD-3001 Vol. 1 Rev C |
| 5 | Mood (self-rated 1–5) | Isolation and confinement | Personal baseline only (team-made scale, not a clinical instrument) | NASA-STD-3001 [V1 4011] |
| 6 | Fasting blood glucose | Gravity fields (indirect) | < 100 mg/dL normal · 100–125 prediabetes range · ≥ 126 diabetes range | ADA Standards of Care |
| 7 | Cumulative radiation dose | Space radiation | Career < 600 mSv [V1 4030]; < 250 mSv per solar particle event [V1 4031] | NASA-STD-3001; OCHMO-TB-020 |
| 8 | CO₂ near you | Closed environment | 1-h average ≤ 3 mmHg; 7-day average < 2.5 mmHg | NASA OCHMO-TB-004 |
| 9 | Strength and fitness | Gravity fields | ≥ 80% of pre-flight baseline [V1 4024], [V1 4003] | NASA-STD-3001 |
| 10 | Food intake and body mass | Distance from Earth | 3,035 kcal/day average (+200 kcal per EVA hour); 100% of needs [V1 4020] | NASA-STD-3001; OCHMO-TB-013 |

General-health ranges are for healthy adults on Earth and are declared as such; in flight the personal baseline comes first.

## Simulated data

The demo uses **simulated data only** for one example astronaut — no real astronaut data. `web/src/lib/simulate.ts` is a pure, deterministic generator (fixed seed, hash-based noise; same day → same values), calibrated with published values:

| Indicator | Simulated baseline (approx.) |
|---|---|
| Resting heart rate | ≈ 62 bpm |
| Blood pressure | ≈ 112/72 mmHg |
| Body temperature | ≈ 36.6 °C |
| Sleep | ≈ 7 h |
| Mood | ≈ 4 / 5 |
| Fasting glucose | ≈ 88 mg/dL |
| Radiation | ≈ 1.5 mSv/day, cumulative (NASA's Mars-transit example in OCHMO-TB-020) |
| CO₂ (highest 1-h average) | ≈ 2.2 mmHg, with three short night-time pockets near the limit (days 41, 88, 152) |
| Strength | 100% → ≈ 92% of pre-flight by day 118 |
| Food intake | ≈ 2,960 kcal/day (reference 3,035) |

**Scenario (also used in the video):** normal until day 112; on days **113–118** resting heart rate rises ≈ +12–15 bpm, systolic pressure ≈ +7–12 mmHg, sleep falls to ≈ 4.8–5.2 h and mood ≈ −1 point; recovery from day 119. On **day 115** the app shows *"Resting heart rate above your baseline · 3 days"* (yellow for heart rate, blood pressure, sleep and mood) while the heart rate is still inside the 60–100 bpm range. Tests in `web/src/lib/assess.test.ts` check this scenario and that there are no false alarms on other days.

## Run it locally

Requirements: Node.js 24 and npm.

```bash
cd web
npm install
npm test        # simulation + traffic-light tests (node --test)
npm run dev     # http://localhost:3000
npm run build   # static export to web/out
```

Deployment: `.github/workflows/pages.yml` builds `web/` with `NEXT_PUBLIC_BASE_PATH=/XionMetrical` and publishes `web/out` to GitHub Pages on every push to `master`.

## Repository layout

| Path | What |
|---|---|
| `web/` | Next.js (App Router, TypeScript, Tailwind) static site: landing `/` and demo `/demo` |
| `web/src/lib/` | Indicator catalogue, simulation, traffic-light rule, guidance texts and sources (pure TypeScript) |
| `web/src/components/demo/` | Pure demo components (also reused by the video renderer) |
| `video/` | 30-second video pipeline: vector animation rendered frame by frame with Playwright + Chrome, Piper narration, synthesized sound, ffmpeg |

## NASA data and references

**NASA**
- NASA-STD-3001 Volume 1, Crew Health, Rev C (2023) — reference limits for sleep, radiation, fitness, nutrition: https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf
- OCHMO-TB-004 Carbon Dioxide: https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2/
- OCHMO-TB-013 Food and Nutrition: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-013-food-and-nutrition.pdf
- OCHMO-TB-020 Design for Ionizing Radiation Protection (Rev E): https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf
- Human Research Program — 5 Hazards: https://www.nasa.gov/hrp/hazards/ · Risks: https://www.nasa.gov/hrp/risks/ (risk pages on cardiovascular adaptations, behavioral conditions, sleep, radiation-induced cancers, food and nutrition, fitness and bone) · Ongoing research: https://www.nasa.gov/hrp/ongoing-hrp-research/
- The Human Body in Space: https://www.nasa.gov/humans-in-space/the-human-body-in-space/
- Spaceflight Standard Measures: https://www.nasa.gov/humans-in-space/spaceflight-standard-measures-characterizing-how-humans-adapt-in-space/
- Wearable Tech for Space Station Research: https://www.nasa.gov/missions/station/iss-research/wearable-tech-for-space-station-research/
- Space Radiation (JSC SRAG): https://www.nasa.gov/directorates/esdmd/hhp/space-radiation/

**Space agency partner and other references**
- Canadian Space Agency — Monitoring radiation for astronaut health (2026); Why do we conduct science experiments in space?
- MedlinePlus (NIH) — Pulse; Body temperature; Adult CPR; Heart attack first aid
- CDC — About High Blood Pressure
- American Diabetes Association — Standards of Care: Diagnosis and Classification
- European Society of Cardiology — 2025 press release on CPR in microgravity (preliminary manikin study)
- NASA Space Apps Challenge 2026 — challenge page and video (challenge by the Brazilian Space Agency)

Every source cited by the app, with its ID and URL, is listed in `web/src/lib/sources.ts`.

## AI usage (SI)

- **Planning and research support:** Claude Code (Anthropic) with Claude Sonnet 5.5 read and paraphrased the NASA, CSA and health-agency sources into a knowledge base and proposed options; the team accepted or rejected each one (each proposal and its outcome is logged in the team's internal declarations registry).
- **Code:** the website, the demo, the tests and the video pipeline were written with Claude Code (Claude Opus 5.5) and reviewed by the team. Commits carry a `Co-Authored-By` trailer.
- **Guidance texts:** drafted with AI from the cited sources — every line shows its source — and reviewed by the team.
- **Video:** vector animation built with code with AI assistance (on-screen label "AI-assisted animation"); narration generated locally with **Piper TTS** (voice `en_US-joe-medium`, CC0 dataset); sound effects synthesized by code. No AI-generated images or video clips. Declared in the video metadata too.
- **Team decisions:** the idea (an early warning against each astronaut's own baseline on a Mars transit), the name and the slogan are the team's. **The app contains no AI**: guidance is fixed, sourced text.
- **NASA branding:** none was generated, drawn or modified with AI. The official NASA and NASA Space Apps logos appear only in the video's closing card, as the unmodified official files placed by the render script.

## Open-source software

| Package | Version | License |
|---|---|---|
| Next.js | 16.4.6 | MIT |
| React / React DOM | 19.3.1 | MIT |
| Tailwind CSS (+ @tailwindcss/postcss) | 4.3.5 | MIT |
| TypeScript | 5.9.3 | Apache-2.0 |
| Playwright (playwright-core) | 1.65.1 | Apache-2.0 |
| Piper TTS (piper-tts) — local tool, not distributed | 1.8.0 | GPL-3.0-or-later |
| ONNX Runtime — local tool | 1.32.0 | MIT |
| FFmpeg (Gyan essentials build) — local tool, not distributed | 9.0.1 | GPL-3.0 |
| Piper voice `en_US-joe-medium` | — | CC0 dataset and base model |

No external fonts, images or chart libraries are used: charts and the body map are hand-written SVG.

## Team — Space Mercedes

Universidad Nacional de Villa Mercedes (UNViMe) · Villa Mercedes, San Luis, Argentina.

- Ezequiel Adrián Vilchez Baigorria
- Mauro Agustín Lucero
- Alejandro Héctor Rodriguez
- Esteban David Torres
- Cristian Emanuel Cáceres
