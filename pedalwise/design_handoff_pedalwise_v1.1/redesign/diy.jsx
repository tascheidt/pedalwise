/* global React, Pedalwise */
const { AppHeader, Eyebrow, SagittalRider, Stat, Card, Btn, SliderRow, Pill } = Pedalwise;

/* =====================================================================
   DIY Guided Fit — five-step layout, current step expanded, others
   collapsed. Aimed at a cyclist on their own who has never used the tool.
   ===================================================================== */

window.DIYGuidedFit = function DIYGuidedFit() {
  const steps = [
    { n: 1, title: "Measure your body", time: "3 min", state: "done" },
    { n: 2, title: "Tell us your current fit", time: "2 min", state: "done" },
    { n: 3, title: "Pick a riding goal", time: "1 min", state: "current" },
    { n: 4, title: "Tune the simulator", time: "2 min", state: "todo" },
    { n: 5, title: "Save & share", time: "1 min", state: "todo" },
  ];

  return (
    <div style={{
      height: "100%", background: "var(--bg)",
      fontFamily: "var(--font-sans)", color: "var(--fg)",
      display: "flex", flexDirection: "column",
    }}>
      <AppHeader
        persona="DIY Guided Fit"
        breadcrumb="My fit · session 1"
        right={<>
          <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>Saved · 14:32</span>
          <Btn variant="ghost" size="sm">Switch workspace</Btn>
        </>}
      />

      <div style={{
        flex: 1, display: "grid", gridTemplateColumns: "320px minmax(0, 1fr) 360px",
        gap: 0, minHeight: 0,
      }}>
        {/* ---- Left: step rail ------------------------------------ */}
        <div style={{
          background: "var(--bg-elevated)",
          borderRight: "1px solid var(--border)",
          padding: "20px 18px",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          <Eyebrow style={{ marginBottom: 12 }}>Setup progress</Eyebrow>
          {steps.map((s, i) => (
            <div key={s.n} style={{
              display: "flex", gap: 12, alignItems: "flex-start",
              padding: "12px 12px",
              borderRadius: 8,
              background: s.state === "current" ? "var(--primary-soft)" : "transparent",
              border: s.state === "current" ? "1px solid var(--pacific-200)" : "1px solid transparent",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                background: s.state === "done" ? "var(--color-success)"
                          : s.state === "current" ? "var(--primary)"
                          : "var(--bg-elevated)",
                border: s.state === "todo" ? "1.5px solid var(--sand-300)" : "none",
                color: s.state === "todo" ? "var(--fg-muted)" : "white",
                fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: 1,
              }}>
                {s.state === "done" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                ) : s.n}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: s.state === "current" ? 600 : 500,
                  color: s.state === "todo" ? "var(--fg-muted)" : "var(--fg)",
                }}>{s.title}</div>
                <div style={{
                  fontSize: 11, color: "var(--fg-muted)", marginTop: 2,
                  fontFamily: "var(--font-mono)",
                }}>{s.time}</div>
              </div>
            </div>
          ))}

          {/* footer help */}
          <div style={{
            marginTop: "auto", padding: "16px 14px",
            background: "var(--bg-subtle)", borderRadius: 10,
            fontSize: 12, color: "var(--fg-1)", lineHeight: 1.55,
          }}>
            <strong style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Tip</strong>
            Measure inseam against a wall with a book between your legs. That's
            what saddle-height suggestions are anchored to.
          </div>
        </div>

        {/* ---- Center: current step ----------------------------- */}
        <div style={{
          padding: "32px 40px", overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 20,
        }}>
          <div>
            <Eyebrow>Step 3 of 5</Eyebrow>
            <h1 style={{
              fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em",
              margin: "8px 0 6px",
            }}>What kind of riding is this fit for?</h1>
            <p style={{
              fontSize: 15, color: "var(--fg-1)", margin: 0, lineHeight: 1.5,
              maxWidth: 600,
            }}>
              Different disciplines favour different bar drops, cadences
              and pedal modes. Pick yours — you can fine-tune below.
            </p>
          </div>

          {/* Goal cards */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10,
          }}>
            <GoalCard
              title="Road"
              cadence="90 rpm"
              meta="clipped · bar drop 8 cm"
              desc="All-day road. Modal Pedalwise setup."
              icon="R"
              selected
            />
            <GoalCard
              title="TT / Tri"
              cadence="88 rpm"
              meta="clipped · bar drop 14 cm"
              desc="Aggressive aero position."
              icon="TT"
            />
            <GoalCard
              title="XC MTB"
              cadence="80 rpm"
              meta="clipped · bar drop 2 cm"
              desc="Cross-country, lighter spin."
              icon="XC"
            />
            <GoalCard
              title="Gravity"
              cadence="70 rpm"
              meta="flat · bar drop −2 cm"
              desc="Descent-first. Flat pedals."
              icon="GR"
            />
            <GoalCard
              title="Commuter"
              cadence="75 rpm"
              meta="flat · bar drop 4 cm"
              desc="Upright. Easy spin."
              icon="CM"
            />
          </div>

          {/* Targets sliders for the selected goal */}
          <Card padding={24}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Fine-tune your target</h3>
              <Pill tone="info">Road defaults applied</Pill>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <SliderRow label="Target speed" value="30" unit=" km/h" min={20} max={45} fill={0.4}
                         note="What you'd sit at on flat road."/>
              <SliderRow label="Road grade" value="0" unit="%" min={-5} max={12} fill={0.3}
                         note="Average gradient. Flat = 0."/>
              <SliderRow label="Cadence" value="90" unit=" rpm" min={60} max={120} fill={0.5}
                         note="Faster = legs spin lighter."/>
              <SliderRow label="Upstroke effort" value="5" unit="%" min={0} max={25} fill={0.2}
                         note="How much you pull on the upstroke."/>
            </div>
          </Card>

          {/* Footer step controls */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            paddingTop: 8, marginTop: 8,
          }}>
            <Btn variant="ghost">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Back
            </Btn>
            <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>
              Step saves automatically.
            </span>
            <Btn variant="primary" rightIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 5l7 7-7 7"/>
              </svg>
            }>Continue to tune</Btn>
          </div>
        </div>

        {/* ---- Right: live preview ----------------------------- */}
        <div style={{
          background: "var(--bg-elevated)",
          borderLeft: "1px solid var(--border)",
          padding: "24px 22px",
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          <div>
            <Eyebrow>Live preview</Eyebrow>
            <div style={{ fontSize: 13, color: "var(--fg-1)", marginTop: 4 }}>
              Your bike, your body, this goal.
            </div>
          </div>

          <div style={{
            background: "var(--bg-subtle)", borderRadius: 10,
            border: "1px solid var(--border)",
            position: "relative", overflow: "hidden", aspectRatio: "1 / 1",
          }}>
            <SagittalRider kneeAngle={34} hipAngle={67}/>
          </div>

          {/* Stat readouts plain-English */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14,
            padding: "14px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
          }}>
            <Stat label="Predicted speed" value="30" unit=" km/h" size="md"/>
            <Stat label="Knee at BDC" value="34" unit="°" size="md" status="success" note="in Holmes range"/>
            <Stat label="Power output" value="232" unit=" W" size="md"/>
            <Stat label="Gross η" value="23.4" unit="%" size="md" status="success"/>
          </div>

          <div style={{
            background: "var(--accent-soft)", color: "var(--accent-soft-fg)",
            padding: "12px 14px", borderRadius: 10,
            fontSize: 12, lineHeight: 1.55,
          }}>
            <strong style={{ display: "block", marginBottom: 4 }}>What this means</strong>
            Your knee bends to 34° at the bottom of the stroke — well inside
            the safe range (25–45°) used by professional fitters. Efficiency
            is at 23.4% which is solid for endurance pace.
          </div>
        </div>
      </div>
    </div>
  );
};

function GoalCard({ title, cadence, meta, desc, icon, selected }) {
  return (
    <div style={{
      padding: "14px 14px",
      background: selected ? "var(--primary-soft)" : "var(--bg-elevated)",
      border: `1.5px solid ${selected ? "var(--primary)" : "var(--border)"}`,
      borderRadius: 10,
      cursor: "pointer",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          width: 30, height: 24, borderRadius: 6,
          background: selected ? "var(--primary)" : "var(--bg-subtle)",
          color: selected ? "white" : "var(--fg-2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600,
        }}>{icon}</span>
        {selected && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        )}
      </div>
      <div style={{
        fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em",
        color: selected ? "var(--primary-soft-fg)" : "var(--fg)",
      }}>{title}</div>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-muted)",
      }}>
        <div>{cadence}</div>
        <div>{meta}</div>
      </div>
      <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.45, marginTop: 2 }}>
        {desc}
      </div>
    </div>
  );
}
