/* global React, Pedalwise */
const { Wordmark, Eyebrow, SagittalRider, Pill } = Pedalwise;

/* =====================================================================
   Bike-fit report — A4 / Letter portrait, intended for print.
   Branded for the fitter, summary for the client.
   ===================================================================== */

window.BikeFitReport = function BikeFitReport() {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "var(--sand-50)",
      padding: 32, boxSizing: "border-box",
      display: "flex", justifyContent: "center", alignItems: "flex-start",
      overflowY: "auto",
      fontFamily: "var(--font-sans)", color: "var(--fg)",
    }}>
      {/* Paper */}
      <div style={{
        width: "100%", maxWidth: 720,
        background: "var(--sand-0)",
        boxShadow: "var(--shadow-md)",
        padding: "44px 48px",
        display: "flex", flexDirection: "column", gap: 22,
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          borderBottom: "1px solid var(--border)", paddingBottom: 20,
        }}>
          <div>
            <Wordmark size={14}/>
            <h1 style={{
              fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600,
              letterSpacing: "-0.02em", margin: "16px 0 4px", lineHeight: 1.05,
            }}>
              Bike-fit report
            </h1>
            <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>
              Marcus L. · Session 2 · September 18, 2025
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em",
              color: "var(--fg-muted)", fontWeight: 500, marginBottom: 4,
            }}>Fitted by</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Cascade Bike Studio</div>
            <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>cascade.bike · Portland, OR</div>
          </div>
        </div>

        {/* Summary box */}
        <div style={{
          padding: "18px 20px", borderRadius: 10,
          background: "var(--primary-soft)", color: "var(--primary-soft-fg)",
          display: "flex", gap: 22, alignItems: "center",
        }}>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 600,
            color: "var(--color-success)", letterSpacing: "-0.02em", lineHeight: 1,
          }}>+3.2%</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
              Recommended fit · gross η vs current setup
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              Saddle <strong>+1.5 cm</strong>, crank <strong>−2.5 mm</strong>.
              Knee at BDC drops from <strong>47°</strong> to <strong>34°</strong>
              — inside Holmes range (25–45°). Pedalling economy improves
              across endurance pace.
            </div>
          </div>
        </div>

        {/* Side-by-side */}
        <div>
          <Eyebrow style={{ marginBottom: 10 }}>Current vs recommended</Eyebrow>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14,
          }}>
            <ReportPanel title="Current" sub="Measured on intake">
              <div style={{
                height: 170, background: "var(--bg-subtle)",
                borderRadius: 6, border: "1px solid var(--border)",
                overflow: "hidden", marginBottom: 10,
              }}>
                <SagittalRider kneeAngle={47} hipAngle={62} accentColor="var(--sun-700)"/>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <tbody>
                  <ReportRow label="Saddle height" value="72.0 cm"/>
                  <ReportRow label="Crank length" value="175 mm"/>
                  <ReportRow label="Saddle setback" value="5.0 cm"/>
                  <ReportRow label="Cadence" value="95 rpm"/>
                  <ReportRow label="Knee at BDC" value="47°" status="warn"/>
                  <ReportRow label="Gross η" value="22.1%"/>
                </tbody>
              </table>
            </ReportPanel>

            <ReportPanel title="Recommended" sub="After fit adjustments" emphasized>
              <div style={{
                height: 170, background: "var(--bg-subtle)",
                borderRadius: 6, border: "1px solid var(--pacific-200)",
                overflow: "hidden", marginBottom: 10,
              }}>
                <SagittalRider kneeAngle={34} hipAngle={67}/>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <tbody>
                  <ReportRow label="Saddle height" value="73.5 cm" delta="+1.5 cm"/>
                  <ReportRow label="Crank length" value="172.5 mm" delta="−2.5 mm"/>
                  <ReportRow label="Saddle setback" value="5.0 cm"/>
                  <ReportRow label="Cadence" value="88 rpm" delta="−7 rpm"/>
                  <ReportRow label="Knee at BDC" value="34°" status="success" delta="−13°"/>
                  <ReportRow label="Gross η" value="23.4%" status="success" delta="+1.3 pts"/>
                </tbody>
              </table>
            </ReportPanel>
          </div>
        </div>

        {/* Body diagram + notes */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
          <div>
            <Eyebrow style={{ marginBottom: 8 }}>Anatomy</Eyebrow>
            <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
              <tbody>
                <ReportRow label="Height" value="180 cm"/>
                <ReportRow label="Mass" value="76 kg"/>
                <ReportRow label="Femur" value="44.0 cm"/>
                <ReportRow label="Tibia" value="44.5 cm"/>
                <ReportRow label="Foot" value="28.0 cm"/>
                <ReportRow label="FT %" value="55%"/>
              </tbody>
            </table>
          </div>
          <div>
            <Eyebrow style={{ marginBottom: 8 }}>Fitter notes</Eyebrow>
            <div style={{
              fontSize: 12, color: "var(--fg-1)", lineHeight: 1.65,
              padding: "12px 14px", background: "var(--bg-subtle)",
              borderRadius: 8, border: "1px solid var(--border)",
            }}>
              Marcus reported right-knee discomfort on long rides. Current
              fit shows excessive knee flexion at BDC (47°) consistent with a
              low saddle. The recommended saddle raise of 1.5 cm and shorter
              crank should bring flexion into the Holmes range (25–45°) and
              reduce the left-right IE asymmetry. Plan: two-week trial, then
              re-measure cadence + comfort.
            </div>
          </div>
        </div>

        {/* Action plan */}
        <div>
          <Eyebrow style={{ marginBottom: 8 }}>Action plan</Eyebrow>
          <ol style={{
            margin: 0, padding: 0, listStyle: "none",
            display: "flex", flexDirection: "column", gap: 8,
            counterReset: "step",
          }}>
            {[
              "Raise saddle 1.5 cm (use 0.5 cm increments over 3 rides if preferred).",
              "Order 172.5 mm crankset; install before re-measure.",
              "Aim for 88 rpm at endurance pace; chain rests in 52×17.",
              "Ride two weeks, log any discomfort by location.",
              "Schedule re-measure session for Oct 2.",
            ].map((step, i) => (
              <li key={i} style={{
                display: "flex", gap: 12, alignItems: "flex-start",
                padding: "10px 12px", borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--sand-0)",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: "var(--primary)", color: "white",
                  fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{i + 1}</div>
                <span style={{ fontSize: 12, color: "var(--fg-1)", lineHeight: 1.55 }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: "auto", paddingTop: 16,
          borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between",
          fontSize: 10, color: "var(--fg-muted)",
        }}>
          <span>
            Generated by Pedalwise · sagittal-plane biomechanics simulator ·
            session ID PWS-0918-7c41
          </span>
          <span style={{ fontFamily: "var(--font-mono)" }}>1 / 1</span>
        </div>
      </div>
    </div>
  );
};

function ReportPanel({ title, sub, emphasized, children }) {
  return (
    <div style={{
      border: `1px solid ${emphasized ? "var(--pacific-200)" : "var(--border)"}`,
      background: emphasized ? "var(--primary-soft)" : "var(--sand-0)",
      borderRadius: 10,
      padding: 14,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{
          fontSize: 13, fontWeight: 600,
          color: emphasized ? "var(--primary-soft-fg)" : "var(--fg)",
        }}>{title}</span>
        <span style={{ fontSize: 10, color: "var(--fg-muted)" }}>{sub}</span>
      </div>
      {children}
    </div>
  );
}

function ReportRow({ label, value, status, delta }) {
  const color = status === "success" ? "var(--color-success)"
              : status === "warn" ? "var(--color-warning)"
              : "var(--fg)";
  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td style={{ padding: "5px 0", fontSize: 11, color: "var(--fg-2)" }}>{label}</td>
      <td style={{
        padding: "5px 0", fontFamily: "var(--font-mono)", fontSize: 11,
        color, fontWeight: 500, textAlign: "right",
      }}>
        {value}
        {delta && <span style={{
          marginLeft: 6, color: "var(--color-success)", fontSize: 10,
        }}>{delta}</span>}
      </td>
    </tr>
  );
}
