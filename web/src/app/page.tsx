import Link from "next/link";
import type { ReactNode } from "react";
import { DemoPreview, HeroPreview } from "@/components/landing/DemoPreview";
import { HAZARDS, INDICATORS } from "@/lib/model";
import type { HazardId } from "@/lib/model";
import { SOURCE_LIST } from "@/lib/sources";

const REPO_URL = "https://github.com/MauroAg22/XionMetrical";

const TEAM = [
  "Ezequiel Adrián Vilchez Baigorria",
  "Mauro Agustín Lucero",
  "Alejandro Héctor Rodriguez",
  "Esteban David Torres",
  "Cristian Emanuel Cáceres",
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
  ["#video", "Video"],
  ["#references", "NASA data"],
  ["#ai", "Use of AI"],
  ["#team", "Team"],
] as const;

function Section({ id, eyebrow, title, children, className = "" }: { id: string; eyebrow: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-20 py-14 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">{eyebrow}</p>
        <h2 id={`${id}-title`} className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {title}
        </h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

export default function Home() {
  const nasaSources = SOURCE_LIST.filter((s) => s.nasa);
  const otherSources = SOURCE_LIST.filter((s) => !s.nasa && s.url);

  return (
    <div className="starfield min-h-screen">
      <header className="sticky top-0 z-40 border-b border-space-800 bg-space-950/85 backdrop-blur">
        <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <a href="#top" className="text-lg font-bold tracking-tight text-ink">
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
          <Link href="/demo/" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-space-950 hover:brightness-110">
            Try the demo
          </Link>
        </nav>
      </header>

      <main id="top">
        {/* 1. Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-12 sm:pt-16 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">2026 NASA Space Apps Challenge · Astronaut health monitoring</p>
            <h1 className="mt-3 text-5xl font-extrabold tracking-tight text-ink sm:text-6xl">XionMetrical</h1>
            <p className="mt-3 text-xl text-accent-soft sm:text-2xl">Precision bio-telemetry for deep space missions.</p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Halfway to Mars, Earth is up to 20 minutes away. XionMetrical compares each astronaut with their own baseline, flags drift early
              and shows what to do — with a source for every line of guidance.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-space-600 bg-space-900 px-3 py-1 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              Prototype · simulated data · not a medical device
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/demo/" className="rounded-xl bg-accent px-6 py-3 font-semibold text-space-950 hover:brightness-110">
                Try the demo
              </Link>
              <a href="#video" className="rounded-xl border border-space-600 px-6 py-3 font-semibold text-ink hover:bg-space-850">
                Watch the video
              </a>
            </div>
          </div>
          <HeroPreview />
        </section>

        {/* 2. Problem */}
        <Section id="problem" eyebrow="The problem" title="On the way to Mars, you are your own first responder">
          <p className="max-w-3xl text-lg leading-relaxed text-muted">
            On a Mars transit a message to Earth takes up to 20 minutes each way, so astronauts carry much of the responsibility for spotting
            changes in their own health. NASA&apos;s Human Research Program groups what drives those changes into five hazards — and XionMetrical
            watches at least one indicator for each.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {(Object.keys(HAZARDS) as HazardId[]).map((h) => (
              <li key={h} className="rounded-2xl border border-space-700 bg-space-900/80 p-4">
                <span className="mb-3 block h-1 w-10 rounded-full" style={{ background: HAZARDS[h].color }} aria-hidden />
                <h3 className="font-semibold text-ink">{HAZARDS[h].name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{HAZARD_TEXT[h]}</p>
                <p className="mt-3 text-xs text-accent-soft">
                  {INDICATORS.filter((d) => d.hazard === h)
                    .map((d) => d.short)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-faint">
            Hazards: NASA Human Research Program,{" "}
            <a className="underline hover:text-ink" href="https://www.nasa.gov/hrp/hazards/" target="_blank" rel="noreferrer">
              5 Hazards of Human Spaceflight
            </a>{" "}
            (paraphrased).
          </p>
        </Section>

        {/* 3. How it works */}
        <Section id="how" eyebrow="How it works" title="Your baseline → drift flagged early → sourced guidance" className="bg-space-900/40">
          <ol className="grid gap-4 md:grid-cols-3">
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
              <li key={s.n} className="rounded-2xl border border-space-700 bg-space-900/80 p-5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent font-bold text-space-950">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold text-ink">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-3xl text-sm text-muted">
            Why it matters: a resting heart rate of 76 bpm is inside the 60–100 bpm range for healthy adults — but for an astronaut whose baseline is
            61 bpm, three days at that level is a change worth acting on, on board, without waiting for Earth.
          </p>
        </Section>

        {/* 4. What's inside */}
        <Section id="inside" eyebrow="What's inside" title="10 indicators · 5 hazards · every tip cites its source">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <li key={t} className="rounded-2xl border border-space-700 bg-space-900/80 p-5">
                <h3 className="font-semibold text-ink">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ul>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-space-700">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">The 10 indicators, their hazard and reference values</caption>
              <thead className="bg-space-850 text-xs uppercase tracking-wide text-accent-soft">
                <tr>
                  <th scope="col" className="px-4 py-3">Indicator</th>
                  <th scope="col" className="px-4 py-3">Hazard</th>
                  <th scope="col" className="px-4 py-3">Reference used</th>
                </tr>
              </thead>
              <tbody>
                {INDICATORS.map((d) => (
                  <tr key={d.id} className="border-t border-space-800 align-top">
                    <th scope="row" className="px-4 py-3 font-medium text-ink">
                      {d.name}
                    </th>
                    <td className="px-4 py-3 text-muted">{HAZARDS[d.hazard].name}</td>
                    <td className="px-4 py-3 text-muted">
                      <span className="mr-1 rounded bg-space-800 px-1.5 py-0.5 text-[11px] text-accent-soft">
                        {d.referenceKind === "nasa" ? "NASA" : d.referenceKind === "general" ? "General health" : "Baseline only"}
                      </span>
                      {d.reference.text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-faint">
            Runs entirely in the browser: no account, no server, no AI inside the app. General-health ranges are for healthy adults on Earth; in flight
            the personal baseline comes first. Nothing here is a diagnosis.
          </p>
        </Section>

        {/* 5. Demo */}
        <Section id="demo" eyebrow="Demo" title="See the drift on mission day 115" className="bg-space-900/40">
          <DemoPreview />
          <p className="mt-4 text-sm text-muted">
            In the demo: slide through a simulated 1,080-day mission (to Mars, 720 days on the surface and back), press play, tap the heart, read the four guidance layers, log today's measurements and open the Emergency guide.
          </p>
        </Section>

        {/* 6. Video */}
        <Section id="video" eyebrow="Video" title="30 seconds: what if he'd seen it coming?">
          <div className="flex aspect-video w-full max-w-4xl items-center justify-center rounded-2xl border border-dashed border-space-600 bg-space-900/80 p-6 text-center">
            <div>
              <p className="text-lg font-semibold text-ink">Video coming with our submission</p>
              <p className="mt-2 text-sm text-muted">
                Vector animation built with code (labeled “AI-assisted animation”), AI narration (Piper TTS) and synthesized sound effects.
              </p>
            </div>
          </div>
        </Section>

        {/* 7. NASA data & references */}
        <Section id="references" eyebrow="NASA data & references" title="Where every number and every tip comes from" className="bg-space-900/40">
          <p className="max-w-3xl text-muted">
            The demo uses <strong className="text-ink">simulated data</strong> for one example astronaut on a 1,080-day Mars mission (180 days out, 720 on the surface, 180 back),
            calibrated with values published by NASA (for example, about 1.5 mSv per day of radiation in NASA&apos;s Mars-transit example, about
            0.67 mSv per day measured by Curiosity on the surface of Mars, 3,035 kcal per day of food and a
            CO₂ limit of 3 mmHg as a 1-hour average). No real astronaut data is used.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="font-semibold text-ink">NASA data & resources</h3>
              <ul className="mt-3 space-y-2">
                {nasaSources.map((s) => (
                  <li key={s.id} className="text-sm">
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-accent-soft underline-offset-2 hover:text-ink hover:underline">
                      {s.title}
                    </a>
                    <span className="text-faint"> — {s.org}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-ink">Space agency partner & other references</h3>
              <ul className="mt-3 space-y-2">
                {otherSources.map((s) => (
                  <li key={s.id} className="text-sm">
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-accent-soft underline-offset-2 hover:text-ink hover:underline">
                      {s.title}
                    </a>
                    <span className="text-faint"> — {s.org}</span>
                  </li>
                ))}
                <li className="text-sm">
                  <a
                    href="https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent-soft underline-offset-2 hover:text-ink hover:underline"
                  >
                    Create Health Monitoring Software for Astronauts on Space Missions
                  </a>
                  <span className="text-faint"> — NASA Space Apps Challenge 2026 (challenge by the Brazilian Space Agency)</span>
                </li>
              </ul>
              <p className="mt-4 text-xs text-faint">
                Open-source software: Next.js, React, Tailwind CSS, TypeScript (MIT / Apache-2.0); video tools: Piper TTS, ffmpeg, Playwright. Full list
                with licenses in the repository README.
              </p>
            </div>
          </div>
        </Section>

        {/* 8. Use of AI */}
        <Section id="ai" eyebrow="Use of AI (SI)" title="What AI did — and what the team decided">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-space-700 bg-space-900/80 p-5">
              <h3 className="font-semibold text-ink">AI-assisted work (declared)</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
                <li>
                  <strong className="text-ink">Research and planning support:</strong> Claude Code (Anthropic; Claude Sonnet 5.5) read and paraphrased
                  the NASA, CSA and health-agency sources and proposed options that the team accepted or rejected.
                </li>
                <li>
                  <strong className="text-ink">Code:</strong> this website and the demo were written with Claude Code (Claude Opus 5.5) and reviewed by
                  the team.
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
            <div className="rounded-2xl border border-space-700 bg-space-900/80 p-5">
              <h3 className="font-semibold text-ink">Team decisions</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
                <li>The idea — an early warning against each astronaut&apos;s own baseline on a Mars mission — the name and the slogan are the team&apos;s.</li>
                <li>The team chose the scenario, the 10 indicators, the simulated-data approach, the 4-layer guidance and the video concept; every AI proposal and its outcome is logged in our declarations registry.</li>
                <li>The app contains no AI: guidance is fixed, sourced text that works offline.</li>
                <li>No NASA branding was generated or modified with AI.</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* 9. Future plan */}
        <Section id="future" eyebrow="Future plan" title="Next: wearables and an Earth link" className="bg-space-900/40">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-space-700 bg-space-900/80 p-5">
              <h3 className="font-semibold text-ink">Wearables</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Feed the same baseline engine with sensors instead of typing, like the wearables NASA and partner agencies already test on the space
                station.
              </p>
            </div>
            <div className="rounded-2xl border border-space-700 bg-space-900/80 p-5">
              <h3 className="font-semibold text-ink">Earth link</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Send a delayed (store-and-forward) summary to flight surgeons on Earth, so the crew acts on board first and the ground team follows up.
              </p>
            </div>
          </div>
        </Section>

        {/* 10. Team */}
        <Section id="team" eyebrow="Team" title="Space Mercedes">
          <p className="text-muted">Universidad Nacional de Villa Mercedes (UNViMe) · Villa Mercedes, San Luis, Argentina · Local event: San Luis.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {TEAM.map((n) => (
              <li key={n} className="rounded-2xl border border-space-700 bg-space-900/80 p-4 text-sm font-medium text-ink">
                {n}
              </li>
            ))}
          </ul>
        </Section>
      </main>

      {/* 11. Footer */}
      <footer className="border-t border-space-800 bg-space-950 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Educational prototype · simulated data · not a medical device</p>
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
