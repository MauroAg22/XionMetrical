import Link from "next/link";
import type { ReactNode } from "react";
import { DemoPreview, HeroPreview } from "@/components/landing/DemoPreview";
import { MissionHud } from "@/components/space/MissionHud";
import { SpaceBackdrop } from "@/components/space/SpaceBackdrop";
import { StaticEarth, StaticMars } from "@/components/space/StaticBackdrop";
import { HAZARDS, INDICATORS } from "@/lib/model";
import type { HazardId } from "@/lib/model";
import { SOURCE_LIST } from "@/lib/sources";

const REPO_URL = "https://github.com/MauroAg22/XionMetrical";

const TEAM = [
  { name: "Ezequiel Adrián Vilchez Baigorria", url: "https://ezequiel-vilchez-portafolio.vercel.app/", label: "Portfolio", email: "vilchezezequiel9@gmail.com" },
  { name: "Mauro Agustín Lucero", url: "https://maurolucero.com.ar/", label: "Website", email: "mauroaglucero@gmail.com" },
  { name: "Alejandro Héctor Rodriguez", url: "https://github.com/alerodriguezh910", label: "GitHub", email: "alerodriguezh910@gmail.com" },
  { name: "Esteban David Torres", url: "https://github.com/Estebandtorres", label: "GitHub", email: "et45343@gmail.com" },
  { name: "Cristian Emanuel Cáceres", url: "https://github.com/Cristian-EM-Caceres", label: "GitHub", email: "cacerescristianemanuel@gmail.com" },
];

const HAZARD_TEXT: Record<HazardId, string> = {
  radiation: "Outside Earth's magnetic field and atmosphere, cosmic rays and solar storms raise long-term health risks — and you can't see or feel them.",
  isolation: "Months in a small space with a small crew: sleep loss, a shifted body clock and workload weigh on mood and performance.",
  distance: "No quick return, no resupply and delayed messages: the crew has to assess and decide on board.",
  gravity: "Weightlessness shifts body fluids and deconditions the heart, muscles and bones.",
  environment: "Air, CO₂ and temperature inside a sealed vehicle are engineered systems that need constant watch.",
};

const NAV = [
  ["#problem", "Problem"],
  ["#how", "How it works"],
  ["#inside", "Inside"],
  ["#demo", "Demo"],
  ["#references", "NASA data"],
  ["#ai", "Use of AI"],
  ["#team", "Team"],
] as const;

// Each section is a waypoint of the journey: the heading sits on the scene (tall gap on wide screens, where
// the camera travels), the content sits on opaque instrument panels so it always has AA contrast.
function Section({ id, eyebrow, title, children, decor }: { id: string; eyebrow: string; title: string; children: ReactNode; decor?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="relative isolate scroll-mt-24">
      {decor}
      <div className="mx-auto max-w-6xl px-4 pb-4 pt-24 sm:pt-32 lg:pt-[26vh]">
        <div className="scene-text scene-text--boxed max-w-3xl">
          <p className="label">{eyebrow}</p>
          <h2 id={`${id}-title`} className="mt-2 font-display text-[2rem] font-semibold leading-[1.06] text-ink sm:text-[2.6rem]">
            {title}
          </h2>
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

const CELL = "p-5 sm:p-6";
const H3 = "font-display text-lg font-semibold text-ink";
const LINK = "text-accent-soft underline-offset-2 hover:text-ink hover:underline";

export default function Home() {
  const nasaSources = SOURCE_LIST.filter((s) => s.nasa);
  const otherSources = SOURCE_LIST.filter((s) => !s.nasa && s.url);

  return (
    <div className="min-h-screen overflow-x-clip">
      <a href="#top" className="skip-link">
        Skip to content
      </a>
      <SpaceBackdrop />
      <header className="sticky top-0 z-40 border-b border-hairline bg-space-950/90">
        <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pb-2 pt-2.5">
          <a href="#top" className="font-display text-xl font-semibold tracking-tight text-ink">
            XionMetrical
          </a>
          <ul className="hidden items-center gap-5 text-sm text-muted lg:flex">
            {NAV.map(([href, label]) => (
              <li key={href}>
                <a href={href} className="hover:text-ink">
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <Link href="/demo/" className="btn-primary px-4 py-2 text-sm">
            Try the demo
          </Link>
        </nav>
        <div className="mx-auto max-w-6xl px-4 pb-2.5">
          <MissionHud />
        </div>
      </header>

      <main id="top" tabIndex={-1} className="outline-none">
        {/* 1. Hero: the journey starts at Earth (the 3D scene shows its limb at the bottom). */}
        <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
          <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl items-center gap-10 px-4 pb-32 pt-12 sm:pt-16 lg:grid-cols-[1.12fr_0.88fr] lg:pb-40">
            <div className="scene-text">
              <p className="label">2026 NASA Space Apps Challenge · Astronaut health monitoring</p>
              <h1 id="hero-title" className="mt-4 font-display text-[clamp(3.25rem,10.5vw,7.25rem)] font-bold leading-[0.92] tracking-[-0.01em] text-ink">
                XionMetrical
              </h1>
              <p className="mt-4 font-display text-xl text-accent-soft sm:text-[1.7rem]">Precision bio-telemetry for deep space missions.</p>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                Halfway to Mars, Earth is up to 20 minutes away. XionMetrical compares each astronaut with their own baseline, flags drift early
                and shows what to do — with a source for every line of guidance.
              </p>
              <p className="mt-6 inline-flex items-center gap-2 rounded-[2px] border border-space-600 bg-space-950/80 px-3 py-1.5 text-xs font-medium text-muted [text-shadow:none]">
                <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
                  <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="7.25" y="6.8" width="1.5" height="5" rx="0.75" fill="currentColor" />
                  <circle cx="8" cy="4.6" r="0.95" fill="currentColor" />
                </svg>
                Prototype · simulated data · not a medical device
              </p>
              <div className="mt-8 flex flex-wrap gap-3 [text-shadow:none]">
                <Link href="/demo/" className="btn-primary px-6 py-3">
                  Try the demo
                </Link>
                <a href="#how" className="btn-ghost px-6 py-3">
                  How it works
                </a>
              </div>
            </div>
            <HeroPreview />
          </div>
          <StaticEarth />
        </section>

        {/* 2. Problem */}
        <Section id="problem" eyebrow="The problem" title="On the way to Mars, you are your own first responder">
          <div className="panel ticks">
            <p className={`${CELL} max-w-4xl text-lg leading-relaxed text-muted`}>
              On a Mars transit a message to Earth takes up to 20 minutes each way, so astronauts carry much of the responsibility for spotting
              changes in their own health. NASA&apos;s Human Research Program groups what drives those changes into five hazards — and XionMetrical
              watches at least one indicator for each.
            </p>
            <ul className="panel-grid sm:grid-cols-2 lg:grid-cols-5">
              {(Object.keys(HAZARDS) as HazardId[]).map((h) => (
                <li key={h} className="p-5 sm:last:col-span-2 lg:last:col-span-1">
                  <span className="mb-3 block h-1 w-10 rounded-full" style={{ background: HAZARDS[h].color }} aria-hidden />
                  <h3 className={H3}>{HAZARDS[h].name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{HAZARD_TEXT[h]}</p>
                  <p className="mt-3 text-xs text-accent-soft">
                    {INDICATORS.filter((d) => d.hazard === h)
                      .map((d) => d.short)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
            <p className="px-5 py-3 text-xs text-faint sm:px-6">
              Hazards: NASA Human Research Program,{" "}
              <a className="underline hover:text-ink" href="https://www.nasa.gov/hrp/hazards/" target="_blank" rel="noreferrer">
                5 Hazards of Human Spaceflight
              </a>{" "}
              (paraphrased).
            </p>
          </div>
        </Section>

        {/* 3. How it works */}
        <Section id="how" eyebrow="How it works" title="Your baseline → drift flagged early → sourced guidance">
          <div className="panel ticks">
            <ol className="panel-grid md:grid-cols-3">
              {[
                {
                  n: "1",
                  t: "Your baseline",
                  d: "The first 30 days of the mission build a personal band for each indicator (your mean ± 1.5 standard deviations). From then on you are compared with yourself, not with an average person.",
                },
                {
                  n: "2",
                  t: "Drift flagged early",
                  d: "Two days in a row outside your band turns an indicator yellow — even if it is still “normal” for adults on Earth. Crossing a published NASA or health-agency limit turns it red.",
                },
                {
                  n: "3",
                  t: "Sourced guidance",
                  d: "Four short layers: status and why, what to do now, when to escalate, how to measure. Every line cites NASA or a health agency; where nothing was published, the app says so.",
                },
              ].map((s) => (
                <li key={s.n} className={CELL}>
                  <span className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] border border-accent-soft font-display text-lg font-semibold text-accent-soft">
                      {s.n}
                    </span>
                    <span className="h-px flex-1 bg-space-600" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold text-ink">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
                </li>
              ))}
            </ol>
            <p className={`${CELL} max-w-4xl text-sm text-muted`}>
              Why it matters: a resting heart rate of 76 bpm is inside the 60–100 bpm range for healthy adults — but for an astronaut whose baseline is
              61 bpm, three days at that level is a change worth acting on, on board, without waiting for Earth.
            </p>
          </div>
        </Section>

        {/* 4. What's inside */}
        <Section id="inside" eyebrow="What's inside" title="10 indicators · 5 hazards · every tip cites its source">
          <div className="panel ticks">
            <ul className="panel-grid sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["10 indicators", "The six the challenge names (heart rate, blood pressure, temperature, sleep, mood, blood sugar) plus radiation dose, CO₂, strength and nutrition, so all five hazards are covered."],
                ["A traffic light that isn't only color", "Normal (circle ✓), Drifting (triangle !) and Act now (octagon !) — a shape and a word for every state."],
                ["Clickable body map", "Each zone shows the worst status of its indicators: tap the heart, the brain or the lungs to open the details."],
                ["Trends with your band", "A day-by-day chart with your personal baseline band and the published limit, so you see where you are heading."],
                ["Guidance in 4 layers", "Status and why · what to do now · when to escalate · how to measure. Written from NASA and health-agency sources, never generated on the fly."],
                ["Emergency guide", "Chest pain or collapse: 8 steps to act on board first and message Earth without waiting. No medication advice."],
                ["Measurement reminders", "A daily routine — on waking, before sleep, weekly — with how to measure each indicator and its source. Dosimeter and CO₂ monitor readings are automatic."],
                ["Log today's measurements", "Type your heart rate, sleep and mood: the same rule checks them against your baseline right away. Nothing is stored or sent."],
              ].map(([t, d]) => (
                <li key={t} className={CELL}>
                  <h3 className={H3}>{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel ticks mt-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <caption className="sr-only">The 10 indicators, their hazard and reference values</caption>
                <thead className="bg-space-850 font-display text-[13px] tracking-[0.02em] text-accent-soft">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Indicator</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Hazard</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Reference used</th>
                  </tr>
                </thead>
                <tbody>
                  {INDICATORS.map((d) => (
                    <tr key={d.id} className="border-t border-hairline align-top">
                      <th scope="row" className="px-5 py-3 font-medium text-ink">
                        {d.name}
                      </th>
                      <td className="px-5 py-3 text-muted">{HAZARDS[d.hazard].name}</td>
                      <td className="px-5 py-3 text-muted">
                        <span className="mr-1 rounded-[2px] bg-space-800 px-1.5 py-0.5 text-[11px] text-accent-soft">
                          {d.referenceKind === "nasa" ? "NASA" : d.referenceKind === "general" ? "General health" : "Baseline only"}
                        </span>
                        {d.reference.text}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-xs text-faint sm:px-6">
              Runs entirely in the browser: no account, no server, no AI inside the app. General-health ranges are for healthy adults on Earth; in flight
              the personal baseline comes first. Nothing here is a diagnosis.
            </p>
          </div>
        </Section>

        {/* 5. Demo */}
        <Section id="demo" eyebrow="Demo" title="See the drift on mission day 115">
          <DemoPreview />
          <div className="panel mt-4">
            <p className="px-5 py-4 text-sm text-muted sm:px-6">
              In the demo: slide through a simulated 1,080-day mission (to Mars, 720 days on the surface and back), press play, tap the heart, read the four guidance layers, log today's measurements and open the Emergency guide.
            </p>
          </div>
        </Section>

        {/* 6. NASA data & references */}
        <Section id="references" eyebrow="NASA data & references" title="Where every number and every tip comes from">
          <div className="panel ticks">
            <p className={`${CELL} max-w-4xl text-muted`}>
              The demo uses <strong className="text-ink">simulated data</strong> for one example astronaut on a 1,080-day Mars mission (180 days out, 720 on the surface, 180 back),
              calibrated with values published by NASA (for example, about 1.5 mSv per day of radiation in NASA&apos;s Mars-transit example, about
              0.67 mSv per day measured by Curiosity on the surface of Mars, 3,035 kcal per day of food and a
              CO₂ limit of 3 mmHg as a 1-hour average). No real astronaut data is used.
            </p>
            <div className="panel-grid lg:grid-cols-2">
              <div className={CELL}>
                <h3 className={H3}>NASA data & resources</h3>
                <ul className="mt-3 space-y-2">
                  {nasaSources.map((s) => (
                    <li key={s.id} className="text-sm">
                      <a href={s.url} target="_blank" rel="noreferrer" className={LINK}>
                        {s.title}
                      </a>
                      <span className="text-faint"> — {s.org}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={CELL}>
                <h3 className={H3}>Space agency partner & other references</h3>
                <ul className="mt-3 space-y-2">
                  {otherSources.map((s) => (
                    <li key={s.id} className="text-sm">
                      <a href={s.url} target="_blank" rel="noreferrer" className={LINK}>
                        {s.title}
                      </a>
                      <span className="text-faint"> — {s.org}</span>
                    </li>
                  ))}
                  <li className="text-sm">
                    <a href="https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/" target="_blank" rel="noreferrer" className={LINK}>
                      Create Health Monitoring Software for Astronauts on Space Missions
                    </a>
                    <span className="text-faint"> — NASA Space Apps Challenge 2026 (challenge by the Brazilian Space Agency)</span>
                  </li>
                </ul>
                <p className="mt-4 text-xs text-faint">
                  Open-source software: Next.js, React, Tailwind CSS, TypeScript, three.js, React Three Fiber (MIT / Apache-2.0); video tools: Piper TTS, ffmpeg, Playwright. Full list
                  with licenses in the repository README.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* 7. Use of AI */}
        <Section id="ai" eyebrow="Use of AI (SI)" title="What AI did — and what the team decided">
          <div className="panel ticks">
            <div className="panel-grid md:grid-cols-2">
              <div className={CELL}>
                <h3 className={H3}>AI-assisted work (declared)</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
                  <li>
                    <strong className="text-ink">Research and planning support:</strong> Claude Code (Anthropic; Claude Sonnet 5.5) read and paraphrased
                    the NASA, CSA and health-agency sources and proposed options that the team accepted or rejected.
                  </li>
                  <li>
                    <strong className="text-ink">Code:</strong> this website and the demo were written with Claude Code (Claude Opus 5.5) and reviewed by
                    the team. That includes the space scene behind this page: Earth, Mars, the stars and the Milky Way are drawn in real time by
                    shaders written with AI (procedural, no images or textures).
                  </li>
                  <li>
                    <strong className="text-ink">Guidance texts:</strong> drafted with AI from the cited sources — every line shows its source — and
                    reviewed by the team before submission.
                  </li>
                  <li>
                    <strong className="text-ink">Video:</strong> vector animation built with code with AI assistance (labeled “AI-assisted animation” on
                    screen), narration generated with Piper TTS (local AI voice, CC0 voice model) and sound effects synthesized by code. No AI-generated
                    images or video clips.
                  </li>
                </ul>
              </div>
              <div className={CELL}>
                <h3 className={H3}>Team decisions</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
                  <li>The idea — an early warning against each astronaut&apos;s own baseline on a Mars mission — the name and the slogan are the team&apos;s.</li>
                  <li>The team chose the scenario, the 10 indicators, the simulated-data approach, the 4-layer guidance and the video concept; every AI proposal and its outcome is logged in our declarations registry.</li>
                  <li>The app contains no AI: guidance is fixed, sourced text that works offline.</li>
                  <li>No NASA branding was generated or modified with AI.</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* 8. Future plan: arrival at Mars */}
        <Section id="future" eyebrow="Future plan" title="Next: wearables and an Earth link" decor={<StaticMars />}>
          <div className="panel ticks">
            <div className="panel-grid md:grid-cols-2">
              <div className={CELL}>
                <h3 className={H3}>Wearables</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Feed the same baseline engine with sensors instead of typing, like the wearables NASA and partner agencies already test on the space
                  station.
                </p>
              </div>
              <div className={CELL}>
                <h3 className={H3}>Earth link</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Send a delayed (store-and-forward) summary to flight surgeons on Earth, so the crew acts on board first and the ground team follows up.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* 9. Team */}
        <Section id="team" eyebrow="Team" title="Space Mercedes">
          <div className="panel ticks">
            <p className={`${CELL} text-muted`}>Universidad Nacional de Villa Mercedes (UNViMe) · Villa Mercedes, San Luis, Argentina · Local event: San Luis.</p>
            <ul className="panel-grid sm:grid-cols-2 lg:grid-cols-5">
              {TEAM.map((m) => {
                const [user, domain] = m.email.split("@");
                return (
                  <li key={m.name} className="flex flex-col p-5 text-sm sm:last:col-span-2 lg:last:col-span-1">
                    <span className="font-medium text-ink">{m.name}</span>
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${m.label}: ${m.name} (opens in a new tab)`}
                      className={`mt-3 w-fit ${LINK}`}
                    >
                      {m.label} <span aria-hidden>↗</span>
                    </a>
                    <a href={`mailto:${m.email}`} className="mt-1 w-fit text-xs text-muted underline-offset-2 [overflow-wrap:anywhere] hover:text-ink hover:underline">
                      {user}
                      <wbr />@{domain}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </Section>
        <div aria-hidden="true" className="h-[18vh] lg:h-[30vh]" />
      </main>

      {/* 10. Footer */}
      <footer className="border-t border-hairline bg-space-950 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Prototype · simulated data · not a medical device</p>
          <p>
            Created for the 2026 NASA Space Apps Challenge ·{" "}
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-accent-soft hover:text-ink">
              Source code
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
