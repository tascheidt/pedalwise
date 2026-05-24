# Pedalwise — Tone &amp; Voice

> The canonical guide for every word that appears in Pedalwise. Live UI,
> marketing surfaces, generated reports, error messages, system prompts.
> When in doubt, read this before writing.

This document is meant to be loaded by any agent — human or AI — writing
copy for the product. It assumes you have already read
[`CLAUDE.md`](./pedal_power/CLAUDE.md). When this document and CLAUDE.md
disagree, treat it as a bug and update this file.

---

## 1. Voice in one line

**Pedalwise sounds like a race mechanic who studied biomechanics.** Precise
about wrench-and-bolt detail. Careful with anatomical claims. Allergic to
gym-bro enthusiasm. The simulator is the product; the copy gets out of its
way.

The voice is **not**:
- a coach pep-talking ("crush your next ride!")
- a marketing site shouting ("unlock your potential")
- a research paper hedging ("it could be suggested that…")
- a friendly chatbot apologizing ("oops, looks like…")

The voice **is**:
- a workshop note left for the next mechanic
- a fit-studio printout the rider takes home
- a lab notebook entry with the timestamp and the delta

---

## 2. The five voice principles

These are quoted *because* the design principles are five. Pair them.

1. **Evidence first, vibe last.** Every claim ties to a number, a named
   range, or an observable change. "+3.2% gross efficiency" beats
   "huge efficiency gain". If there is no measurement, write less.

2. **Wrench-precise, jargon-translated.** Use the real cycling term —
   *saddle*, not *seat*; *crank length*, not *pedal arm*; *BDC*, not
   *bottom of the pedal stroke*. Translate it once on first appearance
   in any given surface, then trust the reader.

3. **Imperative for the user, descriptive for the model.** Buttons command
   ("Find optimal fit"). System reports observe ("Optimizer converged in
   240 iterations"). Never the reverse.

4. **One unit per number. One name per quantity.** Cadence is `rpm`,
   power is `W`, efficiency is `%` or `η`. Don't mix `gross effic.` with
   `gross η` with `efficiency` across the same screen.

5. **The number changes faster than the noun.** Headlines lead with the
   delta. Verbs are present tense. Sentences are short. "Saddle, +1.5 cm.
   Knee at BDC drops to 34°." beats "We recommend raising the saddle by
   one and a half centimetres, which will…"

**Acid test.** Could a confident fit-studio mechanic say this string out
loud to a paying client without cringing? If not, rewrite.

---

## 3. Audience perspective — universal, not segmented

Pedalwise serves three populations: riders who DIY their fit, fitters
running paid sessions, and engineers/researchers inspecting the model.
Copy must work for all three from the same surface.

Practical rules:

- **Don't address an audience by name on a shared surface.** No "For
  cyclists:" / "For fitters:" / "For engineers:" headings on the landing
  page or shared product chrome. The work itself signals who it is for.
- **Lead with the task, not the audience.** "Set saddle height with
  evidence" works for all three; "For DIY riders" only works for one.
- **Pitch jargon to the fitter level by default.** A motivated DIY rider
  who landed on Pedalwise can look up BDC. A fitter who sees "bottom of
  the pedal stroke" will close the tab.
- **One number, two languages.** When introducing a metric for the first
  time, give the cycling-correct name and a short translation in the
  same breath: "Knee at BDC (the bottom of the stroke)."

---

## 4. Cycling terminology — the must-use list

Treat this as binding. If a writer uses an alternate term for any of
these, it is a copy bug.

### Anatomy &amp; fit geometry

| Use | Don't use | Notes |
|---|---|---|
| `saddle` | seat | Always. Even in casual prose. |
| `saddle height` | seat height, post height | Measured from BB centre to saddle top along the seat tube line. |
| `saddle setback` | offset, layback | Horizontal distance, BB to saddle nose. |
| `crank length` | crank-arm length, lever length | Centre-to-centre, BB spindle to pedal axle. |
| `bar drop` | drop bar height | The vertical from saddle top to bar top. |
| `pedal mode: clipped` / `pedal mode: flat` | clipless, platform | Discipline determines the default. |
| `cleat offset` | cleat position | Distance from pedal-spindle axis to ball of foot. |
| `BDC` / `TDC` | bottom of stroke / top of stroke | Spell out on first use: "bottom dead centre (BDC)". |
| `knee at BDC` | knee angle when foot down | The Holmes-method reference angle. |
| `Holmes range` | knee safe zone, ideal knee angle | 25–45° at BDC. Always cite the range on first reference. |

### Drivetrain &amp; performance

| Use | Don't use | Notes |
|---|---|---|
| `cadence (rpm)` | pedal rate, RPM (caps) | Lowercase `rpm`. Always. |
| `gear ratio` | gear, ratio | Front teeth ÷ rear teeth. Write as `52 × 17 = 3.06`. |
| `gain ratio` | — | Sheldon Brown's metric. Use only when explicitly referencing it. |
| `power (W)` | wattage, power output | Capital `W`. Space between number and unit. |
| `gross efficiency` / `η` / `gross η` | efficiency %, GE | Spell out on first use. Use η thereafter when space is tight. |
| `IE` (Index of Effectiveness) | pedal stroke quality, effectiveness | Define parenthetically on first use. |
| `metabolic cost` | calorie burn, energy expenditure | Reported in W (or kcal/hr in fitter contexts). |
| `dead zone` | weak phase, low-torque zone | The TDC/BDC arcs where tangential force ≈ 0. |
| `tangential force` / `radial force` | useful force / wasted force | Engineering-correct. *Then* gloss as propulsive/wasted on the legend. |

### Discipline names (match `lib/presets.ts`)

`Road` · `TT/Tri` · `XC MTB` · `Gravity MTB` · `Commuter`

Do not invent new discipline names ("Endurance", "Climbing", "Sprint") —
those are training intensities, not disciplines. Pedalwise's discipline
defaults set pedal mode, bar drop, cadence, and upstroke effort. Match.

### View modes (match the app)

`Anatomical` · `Realistic` · `Diagnostic`

These are proper nouns in product copy. Capitalize. Do not translate to
"engineering view" / "marketing view" / "coach view" in user-facing copy
even when describing them — say "the Diagnostic view".

---

## 5. Numbers, units, and formatting

### Units

- **Cadence**: `rpm` (lowercase), always. `88 rpm`.
- **Power**: `W` (capital), space before. `232 W`.
- **Speed**: `km/h` (no spaces, lowercase). `30 km/h`. Region-set to `mph` only when explicitly localised.
- **Length**: `cm` / `mm` (lowercase, no period). Crank in mm, saddle in cm.
- **Angle**: `°` (no space). `34°`.
- **Percent**: `%` (no space). `23.4%`.
- **Efficiency Greek**: `η` is fine in body copy and labels; spell out "efficiency" on hero / headline lines.

### Precision

| Quantity | Decimals | Example |
|---|---|---|
| Gross efficiency | 1 | `23.4%` |
| Cadence | 0 | `88 rpm` |
| Power | 0 | `232 W` |
| Speed | 0 (≥ 10 km/h) · 1 (< 10) | `30 km/h`, `4.5 km/h` |
| Saddle height (cm) | 1 | `73.5 cm` |
| Crank length (mm) | 0 or 1 (half-mm) | `172.5 mm`, `170 mm` |
| Setback (cm) | 1 | `5.0 cm` |
| Knee angle | 0 | `34°` |
| IE | 2 | `0.68` |

### Ranges

- En-dash, **no spaces** around it: `25–45°`, `0.55–0.75`.
- Direction unambiguous: `↓ 5 mm → −1.2% η` (minus is `−`, not `-`).

### Deltas

- Always signed: `+1.5 cm`, `−2.5 mm`, `+3.2%`.
- Color semantic: green for improvement, amber for borderline, red for harm. Never decorative.
- When delta is zero or unchanged, say `unchanged` or `same`. Not `0 cm`.

---

## 6. Sentence rhythm

- **Cap UI strings at 22 words.** Marketing leads at 30. Body paragraphs at 40.
- **Verbs forward.** "Adjust the saddle" — not "By adjusting the saddle…"
- **Two beats per UI sentence.** Subject + verb. Or verb + object. Stop.
- **No throat-clearing.** Cut "Simply", "Just", "We help you", "Now you can".
- **Em-dashes** for asides; reserve semicolons for lists in body copy.

### Bad → good

| Throat-clearing | Direct |
|---|---|
| "Simply adjust your saddle height to see the change." | "Move the saddle slider." |
| "We help you optimize your bike fit." | "Pedalwise proposes a fit. You apply it, or you don't." |
| "Just press the button to get started." | "Open the simulator." |
| "Now you can compare your current setup with the optimum." | "Current and optimum sit beside each other." |

---

## 7. SEO — keywords without keyword-stuffing

Pedalwise's audiences search for very different phrases. The marketing
surface needs to surface for all of them without naming any.

### Keyword families to weave into the prose

- **Fit task** (rider intent): saddle height, crank length, knee at BDC, bike fit knee pain, find optimal cadence
- **Diagnostic task** (fitter intent): bike fit session, pedal effectiveness, polar IE, joint power cycling
- **Model task** (engineer intent): sagittal cycling biomechanics, kinematic model cycling, drivetrain identity, efficiency cadence curve

### Rules

1. **Embed naturally in the lead paragraph.** "Move the saddle slider, watch the knee angle at BDC update in real time" already carries `saddle`, `knee at BDC`.
2. **Headlines are the SEO surface.** Long-tail phrases live there. Avoid clever titles that drop the keyword.
3. **No keyword lists.** Never a paragraph of "saddle height calculator, crank length calculator, cadence efficiency calculator…"
4. **Meta description ≤ 155 chars, leads with the task.** "Sagittal-plane bike-fit simulator. Tune saddle height, crank length and cadence; the optimizer proposes a +η fit, applied only when you say so."

---

## 8. Voice in context — do/don't pairs

| Surface | Don't | Do |
|---|---|---|
| Hero | "Take your cycling to the next level." | "See the trade-offs in your fit before you change a bolt." |
| Hero subhead | "Smart AI-powered bike fit." | "A sagittal-plane simulator. Move a slider, the rider redraws at 60 fps." |
| Section label | "OUR FEATURES" | "What the simulator shows" |
| Stat card | "Total Power: 232W" | `232 W` (mono) · `power` (label) |
| Issue (low) | "✅ All good!" | "Cadence at optimum · 88 rpm, ideal for this power." |
| Issue (warn) | "Your knee angle is out of range. You should fix this." | "Knee at BDC: 47° · above Holmes range (target 25–45°). Try a higher saddle." |
| Optimizer headline | "Pedalwise found a better fit!" | "Optimizer converged · +3.2% gross efficiency vs current." |
| Apply button | "Update my bike fit" | "Apply to simulation" |
| Dismiss | "No thanks" | "Dismiss" |
| Loading | "Crunching the numbers…" | "Solving… 240 iterations" |
| Error | "Oops, something went wrong" | "Geometry impossible · saddle too high for this leg length. Lower the saddle 1–2 cm." |
| Footer | "© Pedalwise — Pedal smarter!" | "Pedalwise · v1.1 · sagittal biomechanics simulator" |
| Empty state | "You haven't started yet." | "Adjust rider profile, bike fit, and goal on the left. When you're ready, press Find optimal fit." |

---

## 9. Banned phrases

These never appear in Pedalwise copy. The list is binding — adding one
introduces drift the next agent will need to undo.

**Marketing throat-clearing**

unlock · take to the next level · marginal gains · beast mode · crush ·
crushing it · level up · effortless · magical · seamless · intuitive ·
the future of … · smart (when describing the model) · AI-powered ·
revolutionary · game-changing · next-gen · pro-level (when describing
the tool itself)

**Hedge soup**

it could be argued that · we believe that · in our opinion · arguably ·
roughly · sort of · probably (in claims about the model)

**Wrong cycling words**

bike seat · pedal arm · pedal stroke quality (vague) · power output
(use "mechanical power" or just "power") · RPM (all caps) · KPH · MPH
(unless localised) · biking (use "cycling" or just "riding")

**Punctuation we don't use**

`!` — never in product UI. Marketing hero allowed exactly once if it
genuinely earns its keep.
`?` — only on input prompts and FAQ headings.
Emoji — never. Banned by the design principles; the voice doc extends
that to icons and all surfaces.

---

## 10. Approved verb pool

When a writer is stuck, draw from these. They're cycling-correct or
biomech-correct or both.

**Rider verbs** — spins, drives, sits, leans, climbs, descends, holds,
loads, unloads, pedals.

**System verbs (read-only reports)** — converged, evaluated, computed,
flagged, detected, observed, measured, sampled.

**Optimizer verbs** — proposes, suggests, recommends, narrows, pins,
solves, snaps, converges, returns. **Never** "tells", "demands",
"forces", "applies" (the user applies, not the system).

**Fit verbs** — raise, lower, lengthen, shorten, advance, retract, set,
swap, fit, dial in.

**Analytic verbs** — decompose, resolve, integrate, plot, compare,
sweep, vary, hold, fix.

---

## 11. Checklist for every string

Before committing a new piece of copy, run it through:

1. Does it carry a **number**, a **named quantity**, or a **directive**? If none of the three — cut it.
2. If it cites a measurement, is the unit attached, correctly cased, with the right precision (§5)?
3. If it uses jargon, did §4 approve that exact word?
4. Is the verb in active voice? Subject doing the action?
5. Under 22 words (UI) / 30 (marketing) / 40 (body)?
6. Could a confident fit-studio mechanic say this out loud without cringing?
7. Banned phrase check (§9)?
8. Punctuation: zero `!`, no emoji, em-dash for asides?
9. If it's a heading: does it carry the SEO keyword for the surface (§7)?
10. If you removed it tomorrow, would anything actually change? If not, remove it now.

---

## 12. Surface-by-surface defaults

**Buttons** — Imperative + verb-first. Two to four words. "Find optimal fit". "Apply to simulation". "Reset to default". "Export bike-fit report".

**Section labels** — `eyebrow` style: 12 px, uppercase, tracked +0.08em. Sentence case for the actual words ("Rider profile" not "RIDER PROFILE" in source — CSS uppercases). Always paired with a content panel; never floating alone.

**Stat readouts** — Mono value, sentence-case label, optional italic note. The label is a noun. The note is a short range or status.

**Issue messages** — `Title (numeric or named state) · body (range + recommendation)`. Always the same pattern. The Diagnostic panel's issue list is the gold standard; copy from it.

**Hero / marketing headlines** — Cycling-correct second-person task. ≤ 14 words. One italic emphasis allowed (display serif). Period at the end is fine.

**Speaker notes / report prose** — Past tense for what was measured, present for what is observed, conditional for what is proposed. "Marcus reported right-knee discomfort. Current fit shows excessive knee flexion at BDC. The recommended saddle raise should bring flexion into range."

**Error / impossible-state** — Lead with the constraint. End with the fix. "Geometry impossible · saddle too high for this leg length. Lower the saddle 1–2 cm."

**Footer / legal** — Mono, muted, version-stamped. `Pedalwise · v1.1 · sagittal biomechanics simulator`. Date only if the document is dated.

---

## 13. Examples — full passages, scored

### A. Optimizer recommendation panel

> **Pedalwise found a better fit! 🎯 +3.2% efficiency gain!**
> *Click Apply to use the new setup, or Dismiss if you don't like it.*

**Score: 0/10.** Emoji, exclamation marks, ambiguous about the numbers,
imperatives written like a wizard. Rewrite.

> **Optimizer converged**
> **+3.2%** *gross efficiency vs current*
> Saddle +1.5 cm · Crank −2.5 mm · Cadence −7 rpm · Setback unchanged.
> [Apply to simulation] [Dismiss]
> 95% CI · saddle ±0.8 cm · crank ±2.1 mm · cadence ±3 rpm

**Score: 10/10.** Delta first, units everywhere, signed numbers, CI line
for engineers, two-word buttons, no emoji.

### B. Empty-state for the recommendation pane

> **Welcome! 👋 Start by setting your bike fit on the left, then click
> the big button to find your perfect setup.**

**Score: 0/10.** Onboarding tone, "perfect setup" overpromises, emoji.

> **Recommendation**
> Adjust rider profile, bike fit, and goal on the left. When you're
> ready, press **Find optimal fit** to compute the highest-efficiency
> setup.
> *The optimizer searches saddle height, crank length, cadence, and
> setback simultaneously, then picks the closest commercial gear.*

**Score: 9/10.** This is the current production copy, almost. Score
falls one point for "find your perfect setup" → "compute the
highest-efficiency setup" — kept because "highest-efficiency setup"
restates the work in the same way an engineer would. Don't soften it.

---

## 14. Glossary — quick reference

- **BDC** — bottom dead centre. The crank position where the pedal is closest to the ground.
- **TDC** — top dead centre. The crank position where the pedal is highest.
- **Holmes range** — 25–45° of knee flexion at BDC. The reference range from the Holmes static fit method.
- **IE (Index of Effectiveness)** — fraction of the applied pedal force that produces useful (tangential) torque. Trained range 0.55–0.75.
- **Gross efficiency (η)** — ratio of mechanical work delivered to the cranks vs metabolic energy expended. Trained cyclists: ~20–25%.
- **Gear ratio** — front chainring teeth ÷ rear cog teeth.
- **Gain ratio** — Sheldon Brown's metric: gear ratio × (crank length / wheel radius). Use when referencing his work explicitly.
- **Sagittal plane** — the side-on view of the rider. Pedalwise renders only this plane.
- **Dead zone** — the crank-angle arcs near TDC/BDC where tangential force approaches zero.
- **Fast-twitch %** — the rider's estimated fast-twitch muscle-fibre fraction. Determines preferred cadence.

---

*This document is normative. Edits to it are edits to the brand. PR
into the repo with the rationale in the description.*
