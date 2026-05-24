# Pedalwise

A sagittal-plane biomechanics simulator that helps bike fitters narrow in on
an optimal fit for their clients, lets mechanical and biomechanical engineers
interrogate cycling as a system, and gives motivated DIY cyclists the same
tool the fitter has.

> **Heads-up for contributors:** the canonical statement of what we're building
> and why lives in [`CLAUDE.md`](./CLAUDE.md). The full design specification —
> visual language, view modes, motion, component library, accessibility — lives
> in [`Design/Pedalwise_Design.pdf`](./Design/Pedalwise_Design.pdf). If you
> only have time to read one thing, read CLAUDE.md.

---

## What it does

You enter your **anatomy** (height, femur, tibia, foot, mass, fast-twitch %),
your **bike fit** (crank length, saddle height, saddle setback), and your
**goal** (target speed, road grade, cadence). The tool then:

- Animates an articulated rider at the cadence you set, redrawing at 60 fps
- Shows live biomechanical metrics — gross efficiency, joint power share,
  knee flexion at BDC, index of effectiveness, metabolic cost
- Re-renders three companion charts (knee flexion vs crank angle, crank
  torque per leg, efficiency vs cadence) on every parameter change
- Runs an optimizer (in a Web Worker, so the UI keeps animating) that
  proposes an improved fit and gear, presented as a **ghost overlay** that
  the user explicitly applies or dismisses
- Exposes a speed · cadence · gear triangle widget that makes the underlying
  constraint `v = (n/60) · G · π · D` visible — pin any two, solve the third

## Who it's for

The product is designed for three audiences, **in this order of priority**:

1. **Bike fitters** — primary user. The fitter has a client in the room and
   needs to narrow in on an optimal saddle height, crank length, setback, and
   gear without spending an hour on each candidate. Every feature is evaluated
   first against "does this make a fitter faster and more confident in front
   of a paying client?"
2. **Mechanical and biomechanical engineers / researchers** studying cycling
   as a system — people who want to understand *why* a fit produces the
   efficiency it does. They live in the Diagnostic view and will push on the
   model's fidelity, so the biomechanics has to hold up under that scrutiny.
3. **DIY cyclists** building their own fit — motivated end users who want the
   same tool the fitter has without the appointment. There is no human expert
   in the loop, so the optimizer's ghost-overlay dialogue matters most here.

## Three view modes

| Mode | Built for | What's distinct |
|------|-----------|-----------------|
| **Anatomical** (default) | Fitters making decisions; DIY cyclists | Articulated outline limbs, joint dots, angle labels, reach envelope |
| **Diagnostic** | Engineers / researchers; fitters going deep | Pedal force vectors, polar effectiveness, joint power stack, detected-issues list |
| **Realistic** | Screenshots and presentations *(feature, not a target audience)* | Filled silhouette with helmet, motion-blur trail, large HUD; chrome shrinks |

The kinematic model is **identical** across modes — only the rendering layer
changes. Mode preference persists in LocalStorage; new users start in
Anatomical.

## Why we built it

The bike-fit knowledge is real — Holmes range for knee flexion, LeMond's 0.883
inseam multiplier, the optimum-cadence-vs-power relationship — but it's
usually delivered as **static rules of thumb**. A fitter applies one rule at a
time. A researcher reads them in papers. A cyclist copies them from a forum.
Nobody can see how the rules trade off against each other or against a
specific rider's anatomy.

Pedalwise makes those trade-offs **interactive and visible**: drag a slider,
the rider re-renders at 60 fps and every chart and metric updates with it.
The optimizer is delivered as a dialogue (a ghost overlay you Apply or
dismiss), not a silent overwrite — the user always stays in control.

For the full motivation, the five design principles, and the architectural
principles that govern the codebase, see [`CLAUDE.md`](./CLAUDE.md).

---

## Repository layout

```
pedal_power/
├── CLAUDE.md           ← project thesis + design + architecture principles
├── README.md           ← you are here
├── Design/
│   ├── Pedalwise_Design.pdf     ← canonical design spec (16 sections)
│   ├── Pedalwise_Design.docx
│   └── 01..05-*.png             ← reference screenshots
├── pedalwise/          ← the Next.js 16 app (everything that ships)
│   ├── app/
│   │   ├── page.tsx             ← top-level layout switcher
│   │   ├── layout.tsx
│   │   ├── globals.css          ← design tokens (CSS variables)
│   │   └── worker/
│   │       └── optimizer.worker.ts   ← runs off-main-thread
│   ├── components/              ← primitives (SliderRow, StatCard, …) + screens
│   │   └── charts/              ← KneeFlexion, CrankTorque, EfficiencyCadence
│   ├── lib/
│   │   ├── kinematics.ts        ← forward kinematics + biomechanics evaluator
│   │   ├── optimizer.ts         ← hill-climb over fit parameters
│   │   ├── useOptimizer.ts      ← React hook that drives the worker
│   │   ├── presets.ts           ← 5'4", 5'9", 6'2" anatomy presets + drivetrain
│   │   └── types.ts             ← Config, Frame, Metrics, Recommendation
│   ├── AGENTS.md                ← Next.js 16 caveat (read before writing code)
│   ├── CLAUDE.md                ← imports ../CLAUDE.md and ./AGENTS.md
│   └── package.json
└── .claude/
    └── agents/                  ← biomechanics-simulation-expert, math-ui-architect
```

## Running locally

```bash
cd pedalwise
npm install
npm run dev
```

Open <http://localhost:3000>. Drag any slider and watch the rider redraw. Hit
**Find optimal fit** to invoke the optimizer; the recommendation appears as a
ghost overlay you can Apply or dismiss.

The canonical layout is **1280 px+ wide**. Layouts down to 768 px are
supported with deliberate compromises. Below 768 px the app is read-only by
design (see [`CLAUDE.md`](./CLAUDE.md) §4 for why).

### Other scripts

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## How to contribute

1. **Read [`CLAUDE.md`](./CLAUDE.md) before opening a PR.** The five design
   principles and ten architectural principles are non-negotiable; they're how
   we avoid drift.
2. **Read the relevant Next.js 16 doc.** This repo runs Next.js 16; APIs may
   differ from older versions. See
   [`pedalwise/AGENTS.md`](./pedalwise/AGENTS.md).
3. **Build on existing primitives.** New UI should compose `SliderRow`,
   `StatCard`, `Badge`, `Button`, `SectionLabel`, `ViewModeToggle` — not
   reinvent them.
4. **Never put heavy compute on the main thread.** If it can take >16 ms,
   it belongs in a Web Worker.
5. **The optimizer never silently writes state.** Preserve the ghost-overlay
   dialogue pattern.

If you're adding a biomechanical claim or a math-driven UI widget, invoke the
project-scoped agents in `.claude/agents/` for review.

## Source of truth

When sources disagree:

1. `CLAUDE.md` (thesis + principles)
2. `Design/Pedalwise_Design.pdf` (visual + interaction specification)
3. The current code

If you find a conflict, treat it as a bug. Fix it and update the higher-priority
document if needed.
