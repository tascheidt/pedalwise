# Handoff · Pedalwise v1.0 → v1.1

> A two-track package: **copy revisions** (mechanical, ship in days) and
> **design surfaces** (new persona-aware workspaces, ship over weeks).

This package was prepared for an engineer using **Claude Code** in the
existing `pedal_power/pedalwise/` Next.js 16 codebase. The mocks here are
**design references in HTML/React** — they show intended look, copy, and
behavior. The task is to **re-create them inside the existing Pedalwise
codebase**, composing the existing component primitives (`SliderRow`,
`StatCard`, `Badge`, `Button`, `SectionLabel`, `ViewModeToggle`) — not to
ship the HTML as-is.

---

## TL;DR · what to do first

1. **Read** `Pedalwise — Tone & Voice.md` end to end. Everything else
   refers back to it.
2. **Skim** `Pedalwise — Copy Audit.html` and the **Section 11 ·
   Changeset for Claude Code** that closes it. That section is a
   line-by-line patch list and is the lowest-risk place to start.
3. **Open** `Pedalwise — Redesign Canvas.html` and inspect section
   **06 · Developer handoff** (six tickets PW-101 → PW-106, mapped to
   files in `pedalwise/`). Those are the structural changes that flesh
   out v1.1.
4. **Refer to** `Pedalwise — Landing.html` for the marketing surface.
   It's a static HTML reference; if the team wants it on the same
   Next.js app, port the markup to a `app/(marketing)/page.tsx`.

---

## Fidelity

| Deliverable | Fidelity | What that means for you |
|---|---|---|
| Landing page | **Hi-fi**, pixel-accurate | Recreate with the existing token system. Use the team's preferred Next.js patterns for the marketing route (RSC, Tailwind classes). |
| Redesign workspaces (DIY, Fitter, Engineer) | **Hi-fi** layouts; some inner components are placeholders | Re-implement using `ControlsRail`, `Simulator`, `RecommendationPanel`, and the new primitives the tickets call for. Don't lift the JSX literally — port it. |
| Bike-fit report | **Hi-fi**, single-page Letter | Print-only stylesheet; emits one PDF per call. |
| Copy audit findings | **Editorial**, not visual | Apply the literal string changes in §11. |
| Tone & Voice doc | **Doctrine** | Load it as system context for any future copy work. |

---

## Source of truth — read these first

These files in the existing repo are normative; the design package
**conforms to** them rather than overriding them. If a design choice
disagrees with one of them, treat it as a bug in the design package and
flag it.

1. `pedal_power/CLAUDE.md` — project thesis, the five design principles, the ten architectural principles.
2. `pedal_power/Design/Pedalwise_Design.pdf` — visual + interaction spec, 16 sections.
3. `pedal_power/pedalwise/AGENTS.md` — Next.js 16 caveats. **Read before writing route code** — APIs differ from older Next examples.
4. `pedal_power/pedalwise/CLAUDE.md` — imports the project CLAUDE.md.

---

## Track 1 · Copy revisions (P0, ~1 day)

Apply the changeset in **`Pedalwise — Copy Audit.html § 11`**. It
contains 14 file-scoped diff blocks. The findings (CP-001 through
CP-090) are the rationale; the changeset is the patch.

### Files touched

| File | Findings applied |
|---|---|
| `pedalwise/app/page.tsx` | CP-001 · CP-003 · CP-021 · CP-022 · CP-040 · CP-060 · CP-090 |
| `pedalwise/components/HudStrip.tsx` | CP-020 |
| `pedalwise/components/ControlsRail.tsx` | CP-010 · CP-012 |
| `pedalwise/components/charts/CrankTorqueChart.tsx` | CP-030 |
| `pedalwise/components/DiagnosticPanels.tsx` | CP-041 · CP-042 · CP-043 |
| `pedalwise/components/RecommendationPanel.tsx` | CP-050 · CP-051 · CP-052 · CP-053 |

### What "done" looks like

- All `gross effic.` references → `gross η`
- "Endurance · 30 km/h · flat" reads the discipline from `config.discipline` (default `Road`)
- "Coach mode" badge gone from `DiagnosticLayout`
- Recommendation headline shows `+3.2%` (delta), not `23.4%` (absolute)
- `Solving…` includes iteration count from the worker
- No phrase from the **Banned phrases** list (Tone & Voice §9) survives in any string

### Caveat · CP-021 (the Endurance fix)

The current `Config` type doesn't carry a `discipline` field — `lib/presets.ts`
references one via `DEFAULT_DISCIPLINE` and `DISCIPLINE_DEFAULTS`. To make
the subtitle dynamic, you'll need to either:

1. Add `discipline: Discipline` to `Config` in `lib/types.ts` and let the
   ControlsRail surface a discipline picker (see ticket **PW-102** — the
   DIY guided-fit step 3 uses exactly this);
2. Or, as a stop-gap, hardcode the subtitle to `"Road"` until step 1
   lands. Either is fine; the gap will close in track 2.

---

## Track 2 · Design surfaces (P0–P1, weeks)

The six tickets live in **`Pedalwise — Redesign Canvas.html § 06 ·
Developer handoff`**. Each ticket carries:

- **Problem** — the finding it addresses
- **Change** — the structural fix
- **Files to touch** — `NEW` vs `EDIT` against `pedalwise/`
- **Preserve** — the architectural principles that must survive
- **Smoke tests** — the minimum verification before merging

### Ticket roll-up

| ID | Title | Priority | Effort | Surfaces |
|---|---|---|---|---|
| **PW-101** | Persona-routed workspace shell | P0 | L | App shell |
| **PW-102** | DIY · five-step guided setup | P0 | M | DIY workspace |
| **PW-103** | Fitter · client roster + session model | P1 | L | Fitter workspace |
| **PW-104** | Engineer · parameter sweep + raw export | P1 | L | Engineer workspace |
| **PW-105** | Promoted HUD strip · above the simulator | P2 | S | Universal |
| **PW-106** | Recommendation · delta-first headline | P2 | S | Universal |

PW-105 and PW-106 also have copy components in track 1's changeset —
ship them together if convenient.

### How to read the mocks

The redesign canvas opens in any modern browser. Pan with two-finger
scroll; pinch to zoom. Click an artboard label to focus it fullscreen.

Each artboard is a **layout reference** — the *information architecture*
to honor, not the JSX to copy. Inner components in the mocks
re-implement the existing primitives (`Pedalwise.SliderRow`,
`Pedalwise.Card`, `Pedalwise.Btn`) so the canvas can render
standalone — your production version should use the real ones in
`pedalwise/components/`.

---

## Architectural principles to preserve

Verbatim from `pedal_power/CLAUDE.md`. Violating any of these will
produce a redesign that has to be redone.

1. **One kinematic model, three rendering layers.** All three new
   workspaces (DIY, Fitter, Engineer) **share** the existing
   `lib/kinematics.ts` evaluator. They do NOT fork it.
2. **Heavy compute belongs in a Web Worker.** The sweep worker in
   PW-104 follows the pattern in `app/worker/optimizer.worker.ts`.
3. **Real-time everywhere.** Slider drag → rider redraw in <16 ms.
4. **Token-based design system.** No hard-coded hex values. Use the
   tokens in `pedalwise/app/globals.css` (the existing app uses
   `--color-accent`, `--space-*`, etc.); the design package's
   `tokens.css` is a *reference* showing how the SoCal palette maps to
   Pedalwise's existing names.
5. **Desktop-first, mobile read-only.** Don't try to make the new
   workspaces work on phone widths; below 768 px is read-only by
   design.
6. **Optimizer never silently writes state.** The ghost-overlay pattern
   stays. The new "Apply to client's fit" in the Fitter studio is the
   same idea, scaled to a saved record.
7. **Component primitives, not page-level scaffolding.** New workspaces
   compose existing primitives where they can.

---

## Files in this package

```
design_handoff_pedalwise_copy_review/
├── README.md                          ← this file
├── Pedalwise — Tone & Voice.md       ← brand voice doctrine (read first)
├── Pedalwise — Copy Audit.html       ← editorial review + Changeset for Claude Code
├── Pedalwise — Landing.html          ← public marketing page (hi-fi)
├── Pedalwise — Redesign Canvas.html  ← in-product redesigns + 6 dev tickets
├── redesign/                          ← JSX components for the Redesign Canvas
│   ├── primitives.jsx                ← shared visual primitives
│   ├── critique.jsx                  ← the review's findings
│   ├── shell.jsx                     ← persona picker / first-run entry
│   ├── diy.jsx                       ← DIY Guided Fit workspace
│   ├── fitter.jsx                    ← Fitter Studio workspace
│   ├── engineer.jsx                  ← Engineer Workbench workspace
│   ├── workspace.jsx                 ← Refined universal workspace
│   ├── report.jsx                    ← Printable bike-fit report
│   ├── handoff.jsx                   ← Six dev tickets PW-101..106
│   └── app.jsx                       ← Composes all artboards into the canvas
├── design-canvas.jsx                 ← runtime for Redesign Canvas (pan/zoom shell)
└── tokens.css                         ← SoCal palette + Geist/Fraunces fonts
```

The two HTML files open standalone in any browser. To explore the
redesign artboards, open `Pedalwise — Redesign Canvas.html` and pan
around.

---

## Voice doctrine, briefly

(Full version in `Pedalwise — Tone & Voice.md` — load it as system
context for any future copy work.)

- **Race-mechanic precise, sports-medicine careful, never gym-bro.**
- Evidence first — every claim ties to a number, a range, or a delta.
- Cycling-correct words: *saddle*, *crank length*, *BDC*, *cadence*,
  *gear ratio*, *Holmes range*. Never *seat*, *RPM* (all caps), *pedal
  arm*, *bike geometry* (vague).
- Imperative for the user, descriptive for the model. Buttons command
  ("Find optimal fit"); system messages observe ("Optimizer converged
  in 240 iterations").
- One unit per number, signed deltas, en-dash for ranges (`25–45°`).
- Banned: emoji, exclamation marks, "marginal gains", "crush", "smart
  AI", "next-level", "unlock", "effortless".

---

## Open questions for the team

These came up during the audit and the redesign and should be resolved
before PR review:

1. **Discipline picker placement.** PW-102 surfaces it as DIY step 3.
   Should the existing single-page Anatomical workspace get a
   discipline picker too, or wait until PW-101 lands?
2. **Holmes range — 25–45° vs 25–35°.** `pedal_power/CLAUDE.md` cites
   "25–35°" in passing; the wireframe and Diagnostic panel show
   "25–45°". The audit assumed 25–45° (matching production). Confirm
   the canonical range and update CLAUDE.md if needed.
3. **Save / share flow.** PW-102 sketches a `lib/share.ts` URL-encoded
   share link. Aligning with privacy expectations: confirm this is
   OK before users encode anatomical numbers into a shareable URL.

---

## Acceptance criteria (track 1)

- [ ] `npm run lint` is clean
- [ ] Every diff in §11 of the audit applied verbatim
- [ ] HUD reads `gross η`, not `gross effic.`
- [ ] Discipline subtitle reads `Road · 30 km/h · flat` (or current discipline)
- [ ] Recommendation headline shows the **signed delta** in display type
- [ ] No string in the app matches a phrase from Tone & Voice §9
- [ ] `data-testid` attributes preserved on every interactive element

## Acceptance criteria (track 2)

- [ ] Persona picker renders on first load; choice persists in `pedalwise.workspace` LocalStorage key
- [ ] All three workspaces (DIY, Fitter, Engineer) compose existing primitives — no fork of `lib/kinematics.ts`
- [ ] Sweep worker (PW-104) achieves <500 ms for the default 9×7 grid on an 8-core
- [ ] Bike-fit report prints to a single Letter page (or A4) with no overflow
- [ ] Reduced-motion media query freezes the pedal stroke until the user clicks Play

---

*Prepared by the Pedalwise design review · v1.0 → v1.1*
