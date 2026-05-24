# Pedalwise — project thesis and operating principles

This file is the **single source of truth** for what Pedalwise is, why it exists,
and the principles that govern how it is built. When a decision is ambiguous,
defer to this document. When this document is ambiguous, defer to the canonical
design document at `Design/Pedalwise_Design.pdf`.

All other CLAUDE.md, AGENTS.md, and `.claude/agents/*.md` files in this repo
import or reference this file. Do not duplicate the thesis elsewhere — drift is
the failure mode.

---

## 1. What Pedalwise is

Pedalwise is a **sagittal-plane biomechanics simulator** for cycling fit and
performance. The user inputs anatomy (height, femur, tibia, foot, mass,
fast-twitch %), current bike fit (crank length, saddle height, saddle setback),
and a goal (target speed, road grade, cadence). The tool renders an articulated
rider pedaling in real time, reports live biomechanical metrics (gross
efficiency, joint power share, knee flexion at BDC, index of effectiveness,
metabolic cost), and runs an optimizer that proposes an improved bike fit and
gear choice.

It is built for three audiences, **in this order of priority**:

1. **Bike fitters** — primary user. Their workflow is: client walks in with an
   anatomy and a goal, and the fitter needs to quickly narrow in on an optimal
   saddle height, crank length, setback, and gear without spending an hour on
   each candidate. They live in the Anatomical view and reach into Diagnostic
   when something looks off. Every interaction in Pedalwise should be evaluated
   first against "does this make a fitter faster and more confident in front of
   a paying client?"

2. **Mechanical and biomechanical engineers / researchers** studying cycling
   as a system — the people who want to understand *why* a given fit produces
   the efficiency it does, and who use the tool to interrogate the model.
   They live in the Diagnostic view: force decomposition, polar effectiveness,
   joint power contribution, dead-zone markers. They are also the audience
   most likely to push on the model's fidelity and assumptions, so the
   biomechanics must be defensible at this level of scrutiny.

3. **DIY cyclists** building their own fit — motivated end users who want the
   same tool the fitter has, without the appointment. They start in Anatomical
   and may never leave it. The optimizer's ghost-overlay dialogue (design
   principle 5) matters most here, because there is no human expert in the
   loop to catch a bad recommendation.

The **Realistic view** is a feature (screenshots, presentations, confidence-
building demos) but **not a target audience** — it is never the default and
never the basis for a fit recommendation.

## 2. Why it exists

Bike-fit knowledge is real — Holmes range for knee flexion at BDC (25–45°, the
canonical target band used on the BDC marker throughout this codebase), LeMond's
0.883 inseam multiplier, the optimum-cadence-vs-power relationship — but most of it
is delivered as **static rules of thumb**. A fitter applies one rule at a
time. A researcher reads them in papers. A cyclist copies them from a forum.
Nobody can see how the rules trade off against each other or against a
specific rider's anatomy.

Pedalwise makes those trade-offs **visible and interactive**. A fitter moves
the saddle-height slider during a consultation, the knee-at-BDC reading shifts
from green to amber, and the efficiency curve re-renders — the client sees
*why* a change is being proposed. An engineer toggles fast-twitch composition
and watches optimum cadence move. A DIY cyclist runs the optimizer, sees the
ghost overlay, and decides whether to commit. The
speed · cadence · gear triangle makes the v = (n/60) · G · π · D constraint
viscerally clear — pin any two, the third is determined.

The optimizer is the **second opinion delivered as a dialogue**, not a silent
overwrite — so the user (especially the unsupervised DIY cyclist) remains in
control of every change made to their fit.

## 3. The five design principles

These are quoted verbatim from `Design/Pedalwise_Design.pdf` §1. When in doubt,
defer to the principle that comes first.

1. **Biomechanics first, chrome last.** The rider and the simulation are the
   product. Sliders, panels, and chrome support the simulation; they never
   compete with it. When a layout decision pits "more controls visible" against
   "more space for the rider", give the space to the rider.

2. **Real, then readable.** The simulator must look like a sports-engineering
   instrument, not a children's diagram. But anatomical clarity always wins
   over photo-realism. We render limbs as articulated segments with anatomical
   proportions — not stick figures, and not muscle-by-muscle illustrations.

3. **One accent color, semantic everything else.** A single deep-blue accent
   (`#185FA5`) carries the interactive identity. Everything else is semantic:
   green for in-range, amber for borderline, red for out-of-range. We never
   use color decoratively.

4. **Numbers are the second visual layer.** Every screen shows several live
   numerical readouts. They are typographically distinct (monospace, weight 500,
   accent color for changes) so the eye can scan them without effort. Numbers
   that change during animation animate smoothly, never popping.

5. **Optimization is a dialogue, not a command.** When the optimizer suggests
   changes, it never silently overwrites the user's configuration. The current
   state is preserved as a ghost overlay; the optimum is presented as a
   recommendation; the user explicitly applies it (or doesn't).

**The acid test:** If you can show the screen to a stranger and they cannot
immediately identify the rider, the recommendation, and the next thing to do,
the design has failed one of these principles. Iterate until they can.

## 4. Architectural principles

These are derived from the design doc + the current implementation. They are
load-bearing — violating one will produce work that has to be redone.

1. **One kinematic model, three rendering layers.** Anatomical, Realistic, and
   Diagnostic share the same forward-kinematics solution and the same
   biomechanics evaluator (`lib/kinematics.ts`). Switching mode changes
   *only* what is drawn on the canvas. If you find yourself recomputing
   physics per mode, stop.

2. **Heavy compute belongs in a Web Worker.** The optimizer lives in
   `app/worker/optimizer.worker.ts` so the UI keeps animating at 60 fps
   while it runs. Never put a >16 ms compute on the main thread.

3. **Real-time everywhere.** Slider drag → rider redraw in < 16 ms. Charts
   re-render on every parameter change, not on demand. If a chart only updates
   when the user releases the slider, users miss the cause-and-effect that
   makes the tool valuable.

4. **Token-based design system.** Colors, spacing, radii, and typography live
   as CSS custom properties (`--color-accent`, `--space-16`, etc.) generated
   from a single source. Never hard-code a hex value or pixel size in a
   component when a token exists.

5. **Desktop-first, mobile read-only.** The canonical layout is 1280+ px. We
   support down to 768 px with deliberate compromises. Below 768 px the user
   sees the simulator and recommendation but cannot adjust parameters — they
   get a "view this on desktop to optimize" CTA. This is intentional: the
   bike-fit workflow is not phone-shaped, and a half-built mobile experience
   is worse than honest scope.

6. **Optimizer never silently writes state.** Recommendations render as a ghost
   overlay (current at 25 % opacity, optimum at 100 %). The user must click
   Apply, or change any slider to dismiss. This is principle 5 expressed in
   code — preserve it.

7. **Component primitives, not page-level scaffolding.** The component library
   (`SliderRow`, `StatCard`, `Badge`, `Button`, `SectionLabel`, `ViewModeToggle`)
   composes every screen. New UI should reach for these primitives first.

8. **Reduced motion is respected at the source.** `prefers-reduced-motion`
   disables crossfades, motion-blur trails, and freezes the pedal stroke until
   the user clicks play. Numerical updates still happen because they're
   essential to the tool.

9. **Accessibility is structural, not decorative.** Target WCAG 2.1 AA. The
   simulator canvas has a live `aria-label` reflecting current state. All
   interactive elements are keyboard-operable. Charts use both color and
   shape to distinguish series.

10. **The design doc is normative.** `Design/Pedalwise_Design.pdf` (with the
    PRD it cites) is the source of truth. If Figma disagrees with the doc, the
    doc wins. If this CLAUDE.md disagrees with the doc, treat that as a bug
    and update CLAUDE.md.

## 5. Anti-goals — what Pedalwise deliberately is not

Stating these explicitly because the temptation to add them is real, and each
one would weaken the product.

- **Not a photorealistic 3D rider.** Sagittal 2D is the chosen abstraction. It
  is sufficient for fit decisions and avoids the uncanny-valley problem.
- **Not a full musculoskeletal solver.** We do not run Hill-type muscle models,
  segment-inertial multi-body dynamics, or a 3D skeletal solver. We do run a
  **lightweight 2D inverse-dynamics pass** (Jacobian-transpose pseudoinverse
  over a 3-DOF planar leg with activation-derived joint torques, no segment
  inertia) — that is the upper bound of model complexity. The closed-form
  metabolic-cost layer remains the efficiency model. If a future change would
  require segment inertia, EMG-driven activation, or a 3D solver, stop and
  consult this file.
- **Not mobile-first.** Bike fit does not fit a phone screen. See architectural
  principle 5.
- **Not multi-user, not a CMS, not a community.** State is single-user and
  ephemeral. Only the view-mode preference persists, via LocalStorage.
- **Not marketing-first.** Realistic mode exists for screenshots; it is never
  the default and never the basis for a fit decision.
- **Not a generic charting tool.** Every chart in the app has a specific
  pedagogical purpose. Adding a chart "because we could" violates principle 1.

## 6. Code conventions (load-bearing)

- **Next.js with breaking changes from training data.** This repo runs Next.js
  16. APIs, conventions, and file structure may differ from what your training
  data shows. Before writing Next.js code, read the relevant guide in
  `pedalwise/node_modules/next/dist/docs/`. Heed deprecation notices. See
  `pedalwise/AGENTS.md`.
- **Component files.** PascalCase TSX, one component per file (e.g.
  `SliderRow.tsx`).
- **CSS variables.** `--color-{role}`, `--space-{n}`, `--radius-{size}`.
- **Test IDs.** `data-testid="kebab-case"` on every interactive element.

## 7. For specialist agents

Two project-scoped agents live in `.claude/agents/`:

- **`biomechanics-simulation-expert`** — review the kinematics, efficiency
  model, joint share calculations, and any biomechanical claim.
- **`math-ui-architect`** — review interface designs that translate
  mathematical relationships into interactive UI (the triangle widget is a
  canonical example).

Both agents are instructed to read this file before responding. When you
invoke one, you do not need to restate the thesis — they have it.
