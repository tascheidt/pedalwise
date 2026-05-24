/* global React, Pedalwise */
const { Wordmark, Eyebrow, Btn, Pill } = Pedalwise;

/* =====================================================================
   Developer handoff — every redesign suggestion as a ticket, mapped to
   actual files in pedalwise/. Designed so an engineer can pick up the
   ticket without re-reading the critique.
   ===================================================================== */

window.DevHandoff = function DevHandoff() {
  const tickets = [
    {
      id: "PW-101", title: "Persona-routed workspace shell",
      priority: "P0", effort: "L", surface: "App shell",
      links: ["02 · Persona picker", "03 · Three workspaces"],
      problem: "Anatomical view is the only entry. All three audiences land on the same dense workspace from the first paint.",
      change: "Add a first-run persona picker that routes to one of three workspace layouts above the same kinematic model.",
      files: [
        ["app/page.tsx", "→ delegate to /(workspace)/[id]/page.tsx based on saved choice"],
        ["app/(picker)/page.tsx", "NEW · persona picker route, default if no workspace stored"],
        ["app/(workspace)/diy/page.tsx", "NEW · composes DIYGuidedFit shell + ControlsRail + Simulator"],
        ["app/(workspace)/fitter/page.tsx", "NEW · composes ClientRoster + Simulator + DiagnosticSidePanel"],
        ["app/(workspace)/engineer/page.tsx", "NEW · composes Sweep + Simulator + EquationsPanel"],
        ["lib/storage.ts", "NEW · pedalwise.workspace key (diy|fitter|engineer)"],
      ],
      preserve: [
        "Mode toggle stays — becomes an IN-SESSION render switch (anatomical/diagnostic/realistic), not the only persona segmentation.",
        "DEFAULT_CONFIG and PRESETS unchanged — workspaces vary chrome, not the kinematic model (architectural principle #1).",
      ],
      tests: [
        "First load with no LocalStorage → persona picker. Pick → routes; reload → lands on picked workspace.",
        "Switch workspace from nav → updates pedalwise.workspace; pedalwise.viewMode preserved.",
      ],
    },
    {
      id: "PW-102", title: "DIY · five-step guided setup",
      priority: "P0", effort: "M", surface: "DIY workspace",
      links: ["03A · DIY Guided Fit"],
      problem: "Eleven sliders show on first load. A first-time DIY user has no path to enter measurements or know which knob to touch first.",
      change: "Linear 5-step flow: Measure → Bike fit → Goal → Tune → Save. Each step exposes only relevant sliders + a plain-English explainer.",
      files: [
        ["app/(workspace)/diy/[step]/page.tsx", "NEW · 5 dynamic step routes"],
        ["components/diy/StepRail.tsx", "NEW · left rail, see artboard 03A"],
        ["components/diy/GoalPicker.tsx", "NEW · Endurance / Climb / Sprint cards (Endurance default)"],
        ["components/diy/Explainer.tsx", "NEW · plain-English info card per metric"],
        ["lib/share.ts", "NEW · encode/decode Config to share URL"],
      ],
      preserve: [
        "Existing ControlsRail rendered in step 2 + 3 — do NOT fork it; pass a `fields` prop that filters which sliders show.",
        "Reduced-motion: freeze pedal stroke until Play (per architectural principle #8).",
      ],
      tests: [
        "Step persists in URL (`/diy/3`) → refresh stays on the step.",
        "`/diy/share?c=<encoded>` opens with config restored.",
      ],
    },
    {
      id: "PW-103", title: "Fitter · client roster + session model",
      priority: "P1", effort: "L", surface: "Fitter workspace",
      links: ["03B · Fitter Studio"],
      problem: "State is single-user and ephemeral. No way to carry a client between sessions, compare before/after, or hand off a printable report.",
      change: "Introduce Client + Session entities (LocalStorage first; IndexedDB if a roster exceeds ~50 clients). Side-by-side before/after card. Branded printable report.",
      files: [
        ["lib/storage.ts", "NEW · clients[], sessions[] CRUD against LocalStorage"],
        ["lib/types.ts", "EXTEND · add `Client`, `Session` types"],
        ["components/fitter/ClientRoster.tsx", "NEW · left rail roster"],
        ["components/fitter/SessionCompare.tsx", "NEW · before/after Simulator pair"],
        ["app/(workspace)/fitter/[clientId]/page.tsx", "NEW · session detail"],
        ["app/(workspace)/fitter/[clientId]/report/page.tsx", "NEW · print stylesheet, see artboard 05A"],
        ["components/report/BikeFitReport.tsx", "NEW"],
      ],
      preserve: [
        "Optimizer dialogue pattern (principle #6) extends: \"Apply to client's fit\" still writes only on click.",
        "Existing `RecommendationPanel` is reused — wrap it in a session-aware container that stores Apply events.",
      ],
      tests: [
        "Print preview at A4/Letter shows page break before Action plan if content overflows.",
        "Deleting a client cascades to their sessions (soft-delete with 7-day recovery).",
      ],
    },
    {
      id: "PW-104", title: "Engineer · parameter sweep + raw export",
      priority: "P1", effort: "L", surface: "Engineer workspace",
      links: ["03C · Engineer Workbench"],
      problem: "No way to test a hypothesis across a parameter range, see the equations, or get raw frames out.",
      change: "Sweep grid (any two axes × any one measure), batch-run via Worker, render as a heatmap. Visible equations panel. CSV/JSON export.",
      files: [
        ["app/worker/sweep.worker.ts", "NEW · fan out evaluate() across a 2D grid, return Float32Array"],
        ["lib/sweep.ts", "NEW · sweep config + result types; useSweep hook"],
        ["components/engineer/SweepHeatmap.tsx", "NEW · grid + active cell + optimum marker"],
        ["components/engineer/EquationsPanel.tsx", "NEW · model + assumptions sheet"],
        ["lib/export.ts", "NEW · toCSV(frames), toJSON(sweepResult)"],
      ],
      preserve: [
        "`evaluate()` is the single biomechanics oracle — sweep worker imports it, does NOT fork it.",
        "Heavy compute off the main thread (principle #2). The 9×7 default grid (63 cells) target: <500ms wall on an 8-core.",
      ],
      tests: [
        "Sweep over an axis with `step > range` → graceful single-cell render with a warning toast.",
        "CSV round-trips: export → import a known dataset → byte-identical.",
      ],
    },
    {
      id: "PW-105", title: "Promoted HUD strip · above the simulator",
      priority: "P2", effort: "S", surface: "Universal",
      links: ["04A · Refined workspace"],
      problem: "Speed / cadence / power / η compete with section labels and split attention along the simulator's bottom edge.",
      change: "Lift HudStrip out of the simulator card. Promote to a dedicated band above with larger numerics and a vertical divider between drivetrain (speed · cadence · power · η) and biomechanics (knee · IE).",
      files: [
        ["app/page.tsx", "AnatomicalLayout: move <HudStrip> out of the simulator card, into a sibling card above"],
        ["components/HudStrip.tsx", "EXTEND · accept extra items (knee, IE); add `divider` slot; default valueSize 28"],
      ],
      preserve: [
        "Tabular numerics on every value (font-variant-numeric: tabular-nums) — already on .mono.",
        "Accent color (green/amber/red) on the η value reflects in-range state — extend to knee at BDC.",
      ],
      tests: [
        "Snapshot at 1280px, 1440px, 1920px — no wrap, no overflow.",
        "Reduced-motion: numbers still update; no transition flicker.",
      ],
    },
    {
      id: "PW-106", title: "Recommendation · delta-first headline",
      priority: "P2", effort: "S", surface: "Universal",
      links: ["04A · Refined workspace"],
      problem: "+3.2% (the value the user paid attention for) is buried below the gross-η number. The headline reads as the absolute, not the improvement.",
      change: "Recommendation panel leads with the Δη in display type (Fraunces / Geist Bold @ 44px+). Diff table below. Apply / Dismiss row at the bottom.",
      files: [
        ["components/RecommendationPanel.tsx", "RESTRUCTURE: <DeltaHeadline> → <DiffTable> → <GearCandidates> → <ActionRow>"],
        ["components/DeltaHeadline.tsx", "NEW · large delta, success color, includes `vs current` caption"],
        ["components/DiffTable.tsx", "EXTRACT existing diff rows into reusable component"],
      ],
      preserve: [
        "Ghost-overlay pattern at 25% opacity is the visual primitive of principle #5 — do NOT change.",
        "95% CI footer line stays. It's load-bearing for the engineer audience.",
      ],
      tests: [
        "When delta is 0 or negative, headline switches to neutral color and prepends 'No improvement found.'",
        "Apply button has data-testid='apply-recommendation' (per AGENTS.md convention).",
      ],
    },
  ];

  return (
    <div style={{
      height: "100%", padding: "44px 56px",
      background: "var(--bg-elevated)",
      fontFamily: "var(--font-sans)", color: "var(--fg)",
      display: "flex", flexDirection: "column", gap: 24,
      overflowY: "auto",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-end", gap: 32,
        paddingBottom: 20, borderBottom: "1px solid var(--border)",
      }}>
        <div>
          <Eyebrow>Implementation handoff · v1.0 → v1.1</Eyebrow>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 600,
            letterSpacing: "-0.02em", margin: "10px 0 6px",
          }}>Tickets, mapped to files.</h1>
          <p style={{ fontSize: 14, color: "var(--fg-1)", margin: 0, maxWidth: "60ch", lineHeight: 1.55 }}>
            Six findings, six tickets. Each is keyed to specific files in
            <code style={{ fontFamily: "var(--font-mono)", padding: "1px 6px", background: "var(--bg-subtle)", borderRadius: 4, margin: "0 4px" }}>
              pedalwise/
            </code>
            with the architectural principles to preserve and the smoke-tests an engineer should run.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <LegendChip label="P0 · ship in v1.1" color="var(--color-danger)"/>
          <LegendChip label="P1 · follow-up" color="var(--sun-700)"/>
          <LegendChip label="P2 · polish" color="var(--pacific-600)"/>
        </div>
      </div>

      {/* Tickets */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {tickets.map(t => <Ticket key={t.id} ticket={t}/>)}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: "auto", paddingTop: 18,
        borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between",
        fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--font-mono)",
      }}>
        <span>References · CLAUDE.md (principles), AGENTS.md (Next.js 16 caveats), Design/Pedalwise_Design.pdf</span>
        <span>6 tickets · 2 P0 · 2 P1 · 2 P2</span>
      </div>
    </div>
  );
};

function LegendChip({ label, color }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: 11, color: "var(--fg-1)",
      padding: "4px 10px", background: "var(--bg-subtle)",
      borderRadius: 999, border: "1px solid var(--border)",
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }}/>
      {label}
    </div>
  );
}

function Ticket({ ticket }) {
  const pColor = ticket.priority === "P0" ? "var(--color-danger)"
              : ticket.priority === "P1" ? "var(--sun-700)"
              : "var(--pacific-600)";
  const pBg = ticket.priority === "P0" ? "var(--highlight-soft)"
            : ticket.priority === "P1" ? "var(--accent-soft)"
            : "var(--primary-soft)";
  return (
    <div style={{
      border: "1px solid var(--border)", borderRadius: 12,
      background: "var(--bg-subtle)", padding: "18px 22px",
      display: "grid", gridTemplateColumns: "1fr 1.4fr",
      gap: 24,
    }}>
      {/* Left: meta + narrative */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-muted)",
            padding: "2px 8px", border: "1px solid var(--border)",
            borderRadius: 4, background: "var(--bg-elevated)", fontWeight: 500,
          }}>
            {ticket.id}
          </span>
          <span style={{
            fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em",
            padding: "3px 8px", borderRadius: 4,
            background: pBg, color: pColor, fontWeight: 600,
          }}>{ticket.priority}</span>
          <span style={{
            fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em",
            padding: "3px 8px", borderRadius: 4,
            background: "var(--bg-elevated)", color: "var(--fg-2)",
            border: "1px solid var(--border)", fontWeight: 500,
          }}>Effort · {ticket.effort}</span>
          <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>{ticket.surface}</span>
        </div>
        <h3 style={{
          margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em",
        }}>{ticket.title}</h3>
        <div style={{ fontSize: 12, color: "var(--fg-1)", lineHeight: 1.55 }}>
          <span style={{ color: "var(--fg-muted)", fontWeight: 500 }}>Problem · </span>
          {ticket.problem}
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-1)", lineHeight: 1.55 }}>
          <span style={{ color: "var(--primary)", fontWeight: 500 }}>Change · </span>
          {ticket.change}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          {ticket.links.map(l => (
            <span key={l} style={{
              fontSize: 10, color: "var(--fg-muted)",
              padding: "2px 8px", borderRadius: 999,
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
            }}>
              ↗ {l}
            </span>
          ))}
        </div>
      </div>

      {/* Right: file map + preserve + tests */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <Eyebrow>Files to touch</Eyebrow>
          <div style={{
            marginTop: 6, display: "flex", flexDirection: "column", gap: 4,
            fontFamily: "var(--font-mono)", fontSize: 11, lineHeight: 1.5,
          }}>
            {ticket.files.map(([file, action], i) => {
              const isNew = action.startsWith("NEW");
              return (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{
                    flex: "none", padding: "1px 5px", borderRadius: 3,
                    background: isNew ? "color-mix(in oklab, var(--color-success) 18%, transparent)"
                              : "var(--primary-soft)",
                    color: isNew ? "var(--color-success)" : "var(--primary-soft-fg)",
                    fontSize: 9, fontWeight: 600, letterSpacing: "0.05em",
                    textTransform: "uppercase", marginTop: 2, minWidth: 32, textAlign: "center",
                  }}>{isNew ? "NEW" : "EDIT"}</span>
                  <span style={{ color: "var(--fg)", fontWeight: 500 }}>{file}</span>
                  <span style={{ color: "var(--fg-muted)" }}>{action.replace(/^NEW\s*·\s*/, "")}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <Eyebrow>Preserve</Eyebrow>
            <ul style={{ margin: "6px 0 0", padding: 0, listStyle: "none",
                         display: "flex", flexDirection: "column", gap: 6 }}>
              {ticket.preserve.map((p, i) => (
                <li key={i} style={{ fontSize: 11, color: "var(--fg-1)", lineHeight: 1.5, display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--primary)", flexShrink: 0 }}>✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Eyebrow>Smoke tests</Eyebrow>
            <ul style={{ margin: "6px 0 0", padding: 0, listStyle: "none",
                         display: "flex", flexDirection: "column", gap: 6 }}>
              {ticket.tests.map((t, i) => (
                <li key={i} style={{ fontSize: 11, color: "var(--fg-1)", lineHeight: 1.5, display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--sun-700)", flexShrink: 0, fontFamily: "var(--font-mono)" }}>›</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
