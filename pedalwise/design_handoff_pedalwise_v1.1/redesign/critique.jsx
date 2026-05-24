/* global React */
const { Fragment } = React;

/* =====================================================================
   Critique slate — opens the canvas with a written review summary.
   Six findings, each with severity, what's happening, recommendation.
   ===================================================================== */

window.CritiqueSlate = function CritiqueSlate() {
  const findings = [
    {
      sev: "high",
      title: "One surface, three audiences",
      observed: "The Anatomical view is the only entry. Engineers, fitters, and DIY riders all see the same dense workspace from the first paint.",
      recommend: "Add a persona-routed shell: each persona gets a tailored workspace (Engineer Workbench, Fitter Studio, DIY Guided Fit) that composes the same primitives. Mode toggle remains for in-session switching.",
    },
    {
      sev: "high",
      title: "No on-ramp for DIY riders",
      observed: "Eleven sliders show on first load. A first-time DIY user has no path to enter measurements safely or to know which knob to touch first.",
      recommend: "Five-step guided fit (Measure → Bike fit → Goal → Tune → Save). Plain-English explainer per metric. Save / share-with-mechanic flow.",
    },
    {
      sev: "med",
      title: "Fitters can't carry context between sessions",
      observed: "State is single-user and ephemeral. There is no client roster, no before/after compare, no printable handoff.",
      recommend: "Add a client roster (top of left rail), session history per client, and a printable branded bike-fit report.",
    },
    {
      sev: "med",
      title: "Engineers lack the rigor surface",
      observed: "No way to export frames, run a parameter sweep, see the equations the tool is solving, or import custom anatomy.",
      recommend: "Engineer workbench mode: visible equations, batch sweeps, CSV/JSON export, custom-anatomy import, raw-numerics drawer.",
    },
    {
      sev: "low",
      title: "HUD readouts compete with the rider",
      observed: "30 km/h · 90 rpm · 232 W · 23.4% sit at the same visual weight as section labels and run across the bottom of the simulator, splitting attention from the rider.",
      recommend: "Promote the four HUD metrics into a dedicated readout strip above the simulator, with the change-indicator semantic colors already in the design principles.",
    },
    {
      sev: "low",
      title: "Recommendation panel buries the headline",
      observed: "23.4% reads as the gross-efficiency value, not as the recommendation's delta. The improvement (+3.2%) is in a secondary panel.",
      recommend: "Delta-first headline (\"+3.2% efficiency\"), then the configuration diff, then gear candidates. The number a user paid for goes biggest.",
    },
  ];

  const sevColor = {
    high: "var(--color-danger)",
    med: "var(--sun-700)",
    low: "var(--pacific-600)",
  };
  const sevBg = {
    high: "var(--highlight-soft)",
    med: "var(--accent-soft)",
    low: "var(--primary-soft)",
  };

  return (
    <div style={{
      height: "100%", padding: "48px 56px",
      background: "var(--bg-elevated)",
      fontFamily: "var(--font-sans)", color: "var(--fg)",
      display: "flex", flexDirection: "column", gap: 28,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 32 }}>
        <div>
          <div style={{
            fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em",
            color: "var(--fg-muted)", fontWeight: 500, marginBottom: 8,
          }}>Design review · v1.0 → v1.1</div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 600,
            letterSpacing: "-0.02em", margin: 0, lineHeight: 1.05,
            maxWidth: "20ch",
          }}>
            Pedalwise serves three audiences as one. Time to give each its own door.
          </h1>
        </div>
        <div style={{
          minWidth: 260, padding: "16px 18px",
          background: "var(--primary-soft)", color: "var(--primary-soft-fg)",
          borderRadius: 10, fontSize: 13, lineHeight: 1.5,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Thesis</div>
          One kinematic model. Three workspaces above it. The mode toggle becomes
          an in-session switch, not the only segmentation.
        </div>
      </div>

      {/* Findings table */}
      <div style={{
        flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}>
        {findings.map((f, i) => (
          <div key={i} style={{
            border: "1px solid var(--border)", borderRadius: 12,
            padding: "18px 20px", background: "var(--bg-subtle)",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em",
                padding: "3px 8px", borderRadius: 999,
                background: sevBg[f.sev], color: sevColor[f.sev], fontWeight: 600,
              }}>
                {f.sev === "high" ? "Priority" : f.sev === "med" ? "Follow-up" : "Polish"}
              </span>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-muted)",
              }}>
                #{String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 style={{
              margin: "2px 0 0", fontSize: 18, fontWeight: 600,
              letterSpacing: "-0.01em",
            }}>{f.title}</h3>
            <div style={{ fontSize: 13, color: "var(--fg-1)", lineHeight: 1.55 }}>
              <span style={{ color: "var(--fg-muted)", fontWeight: 500 }}>Observed · </span>
              {f.observed}
            </div>
            <div style={{ fontSize: 13, color: "var(--fg)", lineHeight: 1.55 }}>
              <span style={{ color: "var(--primary)", fontWeight: 500 }}>Recommendation · </span>
              {f.recommend}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div style={{
        fontSize: 12, color: "var(--fg-muted)", borderTop: "1px solid var(--border)",
        paddingTop: 14, display: "flex", justifyContent: "space-between",
      }}>
        <span>Scroll right to see each redesigned surface →</span>
        <span style={{ fontFamily: "var(--font-mono)" }}>6 findings · 7 surfaces redesigned</span>
      </div>
    </div>
  );
};
