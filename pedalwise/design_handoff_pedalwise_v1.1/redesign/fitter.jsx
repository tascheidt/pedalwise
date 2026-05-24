/* global React, Pedalwise */
const { AppHeader, Eyebrow, SagittalRider, Stat, Card, Btn, Pill } = Pedalwise;

/* =====================================================================
   Fitter Studio — client roster, session view with diagnostic, before/
   after compare strip. Built for someone who carries clients between
   sessions and hands off a printable report.
   ===================================================================== */

window.FitterStudio = function FitterStudio() {
  const clients = [
    { name: "Anya R.", meta: "5'4\" · road · session 4", since: "Aug", delta: "+3.2%", tone: "success", active: false },
    { name: "Marcus L.", meta: "5'11\" · tri · session 2", since: "Sep", delta: "borderline", tone: "warn", active: true },
    { name: "Priya N.", meta: "5'6\" · gravel · session 1", since: "today", delta: "—", tone: "neutral", active: false },
    { name: "Jamie F.", meta: "6'1\" · road · session 7", since: "ongoing", delta: "+1.4%", tone: "success", active: false },
    { name: "Sasha O.", meta: "5'8\" · TT · session 3", since: "Jul", delta: "+2.1%", tone: "success", active: false },
    { name: "Diego C.", meta: "5'10\" · road · session 5", since: "Sep", delta: "+0.8%", tone: "success", active: false },
  ];

  return (
    <div style={{
      height: "100%", background: "var(--bg)",
      fontFamily: "var(--font-sans)", color: "var(--fg)",
      display: "flex", flexDirection: "column",
    }}>
      <AppHeader
        persona="Fitter Studio"
        breadcrumb={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span>Marcus L.</span>
            <span style={{ color: "var(--sand-300)" }}>/</span>
            <span>Session 2 · Sep 18</span>
          </span>
        }
        right={<>
          <Btn variant="ghost" size="sm" leftIcon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16M4 12h16"/></svg>
          }>New session</Btn>
          <Btn variant="primary" size="sm" leftIcon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 3v4a1 1 0 001 1h4M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/>
            </svg>
          }>Export report</Btn>
        </>}
      />

      <div style={{
        flex: 1, display: "grid", gridTemplateColumns: "280px minmax(0, 1fr)",
        gap: 0, minHeight: 0,
      }}>
        {/* ---- Left: client roster ------------------------------ */}
        <div style={{
          background: "var(--bg-elevated)",
          borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          minHeight: 0,
        }}>
          {/* Search */}
          <div style={{ padding: "16px 16px 10px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px",
              background: "var(--bg-subtle)", borderRadius: 8,
              border: "1px solid var(--border)",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fg-muted)" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>Search clients...</span>
              <span style={{
                marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11,
                color: "var(--fg-muted)", padding: "1px 5px",
                background: "var(--bg-elevated)", borderRadius: 4,
                border: "1px solid var(--border)",
              }}>⌘K</span>
            </div>
          </div>
          {/* Filter chips */}
          <div style={{ padding: "0 16px 10px", display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Pill tone="info">All · 24</Pill>
            <Pill tone="neutral">Recent</Pill>
            <Pill tone="neutral">Needs review</Pill>
          </div>

          <Eyebrow style={{ padding: "8px 16px" }}>Clients · this week</Eyebrow>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {clients.map((c, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 16px",
                background: c.active ? "var(--primary-soft)" : "transparent",
                borderLeft: c.active ? "3px solid var(--primary)" : "3px solid transparent",
                cursor: "pointer",
                borderBottom: "1px solid var(--border)",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: `oklch(0.85 0.08 ${(i * 47) % 360})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--sand-950)", fontWeight: 600, fontSize: 13,
                }}>
                  {c.name.split(" ").map(s => s[0]).join("")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: c.active ? 600 : 500,
                  }}>{c.name}</div>
                  <div style={{
                    fontSize: 11, color: "var(--fg-muted)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{c.meta}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500,
                    color: c.tone === "success" ? "var(--color-success)"
                         : c.tone === "warn" ? "var(--sun-700)"
                         : "var(--fg-muted)",
                  }}>{c.delta}</div>
                  <div style={{ fontSize: 10, color: "var(--fg-muted)" }}>{c.since}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---- Right: session workspace ------------------------- */}
        <div style={{
          padding: "20px 24px",
          display: "flex", flexDirection: "column", gap: 16,
          overflowY: "auto",
        }}>
          {/* Client header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            padding: "16px 20px", background: "var(--bg-elevated)",
            border: "1px solid var(--border)", borderRadius: 10,
          }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "var(--sunset-200)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--sand-950)", fontWeight: 600, fontSize: 18,
              }}>ML</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>Marcus L.</h2>
                <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 2 }}>
                  5'11" · 76 kg · 41 yrs · road + tri · session 2 of ongoing
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <Stat label="Visit" value="Sep 18" size="sm"/>
              <Stat label="Goal" value="Tempo / 95 rpm" size="sm"/>
              <Pill tone="warn">In review</Pill>
            </div>
          </div>

          {/* Before / After comparison */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <Eyebrow>Before / after · this session</Eyebrow>
              <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Drag the divider to A/B</div>
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
            }}>
              <Card padding={16}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <Pill tone="neutral">Before</Pill>
                  <span style={{ fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
                    saddle 72.0 · crank 175 · 95 rpm
                  </span>
                </div>
                <div style={{
                  height: 200, background: "var(--bg-subtle)",
                  borderRadius: 8, border: "1px solid var(--border)",
                  overflow: "hidden",
                }}>
                  <SagittalRider kneeAngle={47} hipAngle={62} accentColor="var(--sun-700)"/>
                </div>
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8, marginTop: 12, paddingTop: 12,
                  borderTop: "1px solid var(--border)",
                }}>
                  <Stat label="Knee BDC" value="47" unit="°" status="warn" size="sm"/>
                  <Stat label="η" value="22.1" unit="%" size="sm"/>
                  <Stat label="IE" value="0.65" size="sm"/>
                </div>
              </Card>
              <Card padding={16} style={{ border: "1.5px solid var(--primary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <Pill tone="info">After (proposed)</Pill>
                  <span style={{ fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
                    saddle 73.5 · crank 172.5 · 88 rpm
                  </span>
                </div>
                <div style={{
                  height: 200, background: "var(--bg-subtle)",
                  borderRadius: 8, border: "1px solid var(--border)",
                  overflow: "hidden",
                }}>
                  <SagittalRider kneeAngle={34} hipAngle={67}/>
                </div>
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8, marginTop: 12, paddingTop: 12,
                  borderTop: "1px solid var(--border)",
                }}>
                  <Stat label="Knee BDC" value="34" unit="°" status="success" size="sm" note="+13° to fix"/>
                  <Stat label="η" value="23.4" unit="%" size="sm" status="success" note="+3.2%"/>
                  <Stat label="IE" value="0.68" size="sm" note="+0.03"/>
                </div>
              </Card>
            </div>
          </div>

          {/* Diagnostic panels strip */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
          }}>
            <DiagnosticChip
              title="Polar effectiveness"
              meta="IE = 0.68"
              metaTone="success"
              metaSub="(trained 0.55–0.75)"
            >
              <svg viewBox="0 0 200 110" style={{ width: "100%", height: "100%" }}>
                <circle cx="100" cy="55" r="46" fill="none" stroke="var(--sand-200)" strokeWidth="0.5"/>
                <circle cx="100" cy="55" r="32" fill="none" stroke="var(--sand-200)" strokeWidth="0.5"/>
                <circle cx="100" cy="55" r="16" fill="none" stroke="var(--sand-200)" strokeWidth="0.5"/>
                <ellipse cx="124" cy="56" rx="32" ry="28" fill="var(--pacific-200)" opacity="0.5" stroke="var(--pacific-500)" strokeWidth="1.5"/>
                <circle cx="146" cy="55" r="3" fill="var(--color-danger)"/>
                <text x="100" y="14" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="9" fill="var(--fg-muted)">TDC</text>
                <text x="158" y="58" fontFamily="var(--font-sans)" fontSize="9" fill="var(--fg-muted)">3</text>
              </svg>
            </DiagnosticChip>

            <DiagnosticChip
              title="Joint power contribution"
              meta="Hip-dominant"
              metaTone="info"
            >
              <svg viewBox="0 0 200 110" style={{ width: "100%", height: "100%" }}>
                <path d="M 10 95 Q 70 30 100 28 Q 130 30 190 95 Z" fill="var(--pacific-400)" opacity="0.85"/>
                <path d="M 30 95 Q 70 50 100 50 Q 130 50 170 95 Z" fill="var(--chart-5)" opacity="0.75"/>
                <path d="M 50 95 Q 80 70 100 70 Q 120 70 150 95 Z" fill="var(--color-success)" opacity="0.65"/>
                <text x="20" y="105" fontFamily="var(--font-sans)" fontSize="9" fill="var(--fg-2)">Hip 58%</text>
                <text x="80" y="105" fontFamily="var(--font-sans)" fontSize="9" fill="var(--fg-2)">Knee 31%</text>
                <text x="140" y="105" fontFamily="var(--font-sans)" fontSize="9" fill="var(--fg-2)">Ankle 11%</text>
              </svg>
            </DiagnosticChip>

            <DiagnosticChip
              title="Detected issues"
              meta="3 flagged"
              metaTone="warn"
            >
              <div style={{ padding: "4px 0", display: "flex", flexDirection: "column", gap: 6 }}>
                <IssueRow tone="warn" title="Knee at BDC: 47°" sub="Outside 25–45° range"/>
                <IssueRow tone="info" title="IE asymmetry" sub="L 0.71 · R 0.65"/>
                <IssueRow tone="success" title="Cadence at optimum" sub="88 rpm ideal for this power"/>
              </div>
            </DiagnosticChip>
          </div>

          {/* Session notes / actions */}
          <Card padding={18}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Eyebrow>Session notes</Eyebrow>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="ghost" size="sm">Dismiss recommendation</Btn>
                <Btn variant="primary" size="sm">Apply to client's fit</Btn>
              </div>
            </div>
            <div style={{
              fontSize: 13, color: "var(--fg-1)", lineHeight: 1.55,
              padding: "12px 14px", background: "var(--bg-subtle)",
              borderRadius: 8, border: "1px solid var(--border)",
            }}>
              <span style={{ color: "var(--fg-muted)" }}>Marcus mentioned right-knee discomfort on long rides.</span>{" "}
              Saddle raise of 1.5 cm + a 2.5 mm shorter crank should bring knee
              flexion into range and may help the IE asymmetry. Recommend a
              two-week trial then re-measure.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

function DiagnosticChip({ title, meta, metaTone, metaSub, children }) {
  const toneColor = {
    success: "var(--color-success)",
    warn: "var(--sun-700)",
    info: "var(--primary)",
    neutral: "var(--fg-muted)",
  }[metaTone || "neutral"];
  return (
    <div style={{
      background: "var(--bg-elevated)", border: "1px solid var(--border)",
      borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Eyebrow>{title}</Eyebrow>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, color: toneColor,
        }}>{meta}</span>
      </div>
      <div style={{ height: 110, overflow: "hidden" }}>{children}</div>
      {metaSub && <div style={{ fontSize: 10, color: "var(--fg-muted)", textAlign: "right" }}>{metaSub}</div>}
    </div>
  );
}

function IssueRow({ tone, title, sub }) {
  const color = tone === "warn" ? "var(--sun-700)"
              : tone === "success" ? "var(--color-success)"
              : "var(--primary)";
  const bg = tone === "warn" ? "var(--accent-soft)"
           : tone === "success" ? "color-mix(in oklab, var(--color-success) 15%, transparent)"
           : "var(--primary-soft)";
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{
        width: 18, height: 18, borderRadius: 4,
        background: bg, color, fontSize: 11, fontWeight: 600,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {tone === "warn" ? "!" : tone === "success" ? "✓" : "i"}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--fg)" }}>{title}</div>
        <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>{sub}</div>
      </div>
    </div>
  );
}
