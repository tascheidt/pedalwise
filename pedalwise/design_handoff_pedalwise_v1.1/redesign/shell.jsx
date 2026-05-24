/* global React, Pedalwise */
const { Wordmark, Eyebrow, Btn, Pill } = Pedalwise;

/* =====================================================================
   Persona-routed shell — the new first-run entry point.
   Three workspace cards. Each carries the simulator preview tuned for
   that audience.
   ===================================================================== */

window.PersonaShell = function PersonaShell() {
  return (
    <div style={{
      height: "100%",
      background: "var(--bg)",
      fontFamily: "var(--font-sans)", color: "var(--fg)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Top bar */}
      <div style={{
        height: 56, padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)",
      }}>
        <Wordmark size={15} />
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>Need a different door later? Switch workspace from the nav.</span>
          <Btn variant="ghost" size="sm">Sign in</Btn>
        </div>
      </div>

      {/* Hero region */}
      <div style={{
        flex: 1, padding: "48px 56px 40px",
        display: "flex", flexDirection: "column", gap: 36,
        background: `
          radial-gradient(50% 70% at 80% 10%, oklch(0.945 0.038 230 / 0.5), transparent 60%),
          radial-gradient(40% 60% at 10% 90%, oklch(0.955 0.040 60 / 0.3), transparent 60%)
        `,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 40 }}>
          <div>
            <Eyebrow>Welcome to Pedalwise · pick your workspace</Eyebrow>
            <h1 style={{
              fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 600,
              letterSpacing: "-0.02em", margin: "12px 0 0", lineHeight: 1.05,
              maxWidth: "20ch",
            }}>
              Same simulator. Three doors in.
            </h1>
            <p style={{
              fontSize: 16, color: "var(--fg-1)", maxWidth: 560,
              margin: "16px 0 0", lineHeight: 1.55,
            }}>
              You can switch any time. Your data is the same underneath — what
              changes is the chrome, the workflow, and the level of math
              we put on screen.
            </p>
          </div>
          <div style={{
            padding: "10px 14px", borderRadius: 999,
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--fg-muted)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-success)" }}/>
            <span>Saved choice will become your default on this device.</span>
          </div>
        </div>

        {/* Persona cards */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20,
          flex: 1, minHeight: 0,
        }}>
          <PersonaCard
            tone="diy"
            tag="Cyclist · DIY fit"
            title="DIY Guided Fit"
            blurb="Five guided steps. Plain-English explanations. Save your fit and share a link with your mechanic."
            features={[
              "Step-by-step measurement guide",
              "One slider, one decision at a time",
              "Save / share fit profiles",
              "Mobile-friendly at-bike reference",
            ]}
            timeEstimate="≈ 8 min first time"
            cta="Start guided fit"
            preview={<DiyPreview />}
            recommended
          />
          <PersonaCard
            tone="fitter"
            tag="Bike fitter · coach"
            title="Fitter Studio"
            blurb="Open a client. Run a session. Compare before and after. Print a branded handoff."
            features={[
              "Client roster with session history",
              "Before / after side-by-side compare",
              "Coach-mode diagnostics (forces, polar IE)",
              "Branded printable bike-fit report",
            ]}
            timeEstimate="Per-session, ≈ 30 min"
            cta="Open the studio"
            preview={<FitterPreview />}
          />
          <PersonaCard
            tone="engineer"
            tag="Engineer · researcher"
            title="Engineer Workbench"
            blurb="Test a hypothesis. Sweep a parameter. Export the frame stream. See the model in plain math."
            features={[
              "Parameter sweep & batch runs",
              "Visible equations + assumptions",
              "CSV / JSON frame export",
              "Custom anatomy import",
            ]}
            timeEstimate="Power users · keyboard-first"
            cta="Open the workbench"
            preview={<EngineerPreview />}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "14px 56px", borderTop: "1px solid var(--border)",
        background: "var(--bg-elevated)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 12, color: "var(--fg-muted)",
      }}>
        <span>Pedalwise v1.1 · sagittal biomechanics simulator</span>
        <span style={{ display: "flex", gap: 24 }}>
          <a style={{ color: "inherit" }}>Methodology</a>
          <a style={{ color: "inherit" }}>Documentation</a>
          <a style={{ color: "inherit" }}>What's new</a>
        </span>
      </div>
    </div>
  );
};

function PersonaCard({ tag, title, blurb, features, timeEstimate, cta, preview, tone, recommended }) {
  const accent = tone === "engineer" ? "var(--pacific-500)"
              : tone === "fitter" ? "var(--sun-600)"
              : "var(--sunset-500)";
  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: 0,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      position: "relative",
      boxShadow: recommended ? "0 0 0 2px var(--primary)" : "var(--shadow-xs)",
    }}>
      {recommended && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          padding: "3px 8px", borderRadius: 999,
          background: "var(--primary)", color: "var(--fg-on-primary)",
          fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
        }}>Most popular</div>
      )}
      {/* Preview */}
      <div style={{
        height: 200,
        background: tone === "engineer" ? "linear-gradient(180deg, var(--pacific-50), var(--bg-subtle))"
                  : tone === "fitter" ? "linear-gradient(180deg, var(--sun-50), var(--bg-subtle))"
                  : "linear-gradient(180deg, var(--sunset-50), var(--bg-subtle))",
        borderBottom: "1px solid var(--border)",
        position: "relative", overflow: "hidden",
      }}>{preview}</div>

      <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: 999, background: accent, flexShrink: 0,
          }}/>
          <span style={{
            fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em",
            color: "var(--fg-muted)", fontWeight: 500,
          }}>{tag}</span>
        </div>
        <h3 style={{
          margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em",
        }}>{title}</h3>
        <p style={{
          margin: 0, fontSize: 14, color: "var(--fg-1)", lineHeight: 1.55,
        }}>{blurb}</p>
        <ul style={{
          listStyle: "none", padding: 0, margin: "4px 0 0",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          {features.map((f, i) => (
            <li key={i} style={{
              fontSize: 13, color: "var(--fg-2)", display: "flex", gap: 10,
              lineHeight: 1.4, alignItems: "flex-start",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              {f}
            </li>
          ))}
        </ul>
        <div style={{ flex: 1 }}/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <span style={{
            fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--font-mono)",
          }}>{timeEstimate}</span>
          <Btn variant={recommended ? "primary" : "ghost"} size="sm" rightIcon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          }>{cta}</Btn>
        </div>
      </div>
    </div>
  );
}

/* ---------- Persona-specific tiny previews ---------- */

function DiyPreview() {
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%" }}>
      {/* connecting rail */}
      <line x1="40" y1="100" x2="280" y2="100" stroke="var(--sand-200)" strokeWidth="1"/>
      {[1, 2, 3].map((n, i) => (
        <g key={n}>
          <circle cx={40 + i * 80} cy="100" r="16" fill="var(--sunset-500)"/>
          <text x={40 + i * 80} y="105" textAnchor="middle" fill="white"
                fontFamily="var(--font-sans)" fontSize="13" fontWeight="600">{n}</text>
        </g>
      ))}
      {[4, 5].map((n, i) => (
        <g key={n}>
          <circle cx={200 + i * 80} cy="100" r="16" fill="var(--bg-elevated)" stroke="var(--sand-300)" strokeWidth="1.5"/>
          <text x={200 + i * 80} y="105" textAnchor="middle" fill="var(--fg-muted)"
                fontFamily="var(--font-sans)" fontSize="13" fontWeight="600">{n}</text>
        </g>
      ))}
      <text x="40" y="138" textAnchor="middle" fill="var(--fg-2)" fontFamily="var(--font-sans)" fontSize="10">Measure</text>
      <text x="120" y="138" textAnchor="middle" fill="var(--fg-2)" fontFamily="var(--font-sans)" fontSize="10">Bike fit</text>
      <text x="200" y="138" textAnchor="middle" fill="var(--fg-2)" fontFamily="var(--font-sans)" fontSize="10">Goal</text>
      <text x="280" y="138" textAnchor="middle" fill="var(--fg-muted)" fontFamily="var(--font-sans)" fontSize="10">Tune</text>
      <text x="160" y="60" textAnchor="middle"
            fontFamily="var(--font-sans)" fontSize="12" fontWeight="500" fill="var(--sunset-700)">
        step 3 · pick a goal
      </text>
    </svg>
  );
}

function FitterPreview() {
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%" }}>
      {/* roster */}
      {[
        { y: 30, name: 78, dot: "var(--sun-300)", delta: "+3.2%", tone: "var(--color-success)" },
        { y: 70, name: 92, dot: "var(--sunset-300)", delta: "borderline", tone: "var(--sun-700)" },
        { y: 110, name: 110, dot: "var(--pacific-300)", delta: "+1.4%", tone: "var(--color-success)" },
        { y: 150, name: 86, dot: "var(--sand-400)", delta: "—", tone: "var(--fg-muted)" },
      ].map((r, i) => (
        <g key={i}>
          <rect x="16" y={r.y - 14} width="288" height="28" rx="4"
                fill={i === 1 ? "var(--primary-soft)" : "var(--bg-elevated)"}
                stroke="var(--border)"/>
          <circle cx="32" cy={r.y} r="8" fill={r.dot}/>
          <rect x="48" y={r.y - 4} width={r.name} height="6" fill="var(--sand-800)" rx="2"/>
          <rect x="48" y={r.y + 4} width={r.name * 0.6} height="4" fill="var(--sand-400)" rx="2"/>
          <text x="290" y={r.y + 4} textAnchor="end"
                fontFamily="var(--font-mono)" fontSize="11" fontWeight="500" fill={r.tone}>{r.delta}</text>
        </g>
      ))}
    </svg>
  );
}

function EngineerPreview() {
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%" }}>
      <defs>
        <pattern id="eg" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke="var(--pacific-100)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="320" height="200" fill="url(#eg)" opacity="0.4"/>
      {/* curves */}
      <path d="M 10 180 Q 100 30 200 30 Q 280 30 310 60" fill="none" stroke="var(--pacific-500)" strokeWidth="2"/>
      <path d="M 10 175 Q 90 100 175 60 Q 260 30 310 25" fill="none" stroke="var(--sunset-500)" strokeWidth="1.5" strokeDasharray="3 3"/>
      <path d="M 10 195 Q 70 150 165 105 Q 250 75 310 95" fill="none" stroke="var(--sun-700)" strokeWidth="1.5" strokeDasharray="6 3"/>
      {/* grid of param markers */}
      {[60, 100, 140, 180].map((x, i) => (
        <line key={i} x1={x} y1="0" x2={x} y2="200" stroke="var(--sand-200)" strokeWidth="0.5"/>
      ))}
      {/* pinned point */}
      <circle cx="170" cy="40" r="4" fill="var(--pacific-700)"/>
      <text x="180" y="50" fontFamily="var(--font-mono)" fontSize="10" fill="var(--fg-2)">87.4</text>
      {/* equation */}
      <text x="20" y="22" fontFamily="var(--font-display)" fontStyle="italic" fontSize="14" fill="var(--fg-1)">η = f(n, θ_BDC, FT%)</text>
    </svg>
  );
}
