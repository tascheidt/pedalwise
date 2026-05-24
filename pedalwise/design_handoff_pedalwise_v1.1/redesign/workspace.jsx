/* global React, Pedalwise */
const { AppHeader, Eyebrow, SagittalRider, Stat, Card, Btn, SliderRow, Pill } = Pedalwise;

/* =====================================================================
   Refined unified workspace — the in-app Anatomical view, with the
   review findings applied: promoted HUD strip, delta-first optimizer,
   triangle integrated, tightened spacing, clearer hierarchy.
   ===================================================================== */

window.UnifiedWorkspace = function UnifiedWorkspace() {
  return (
    <div style={{
      height: "100%", background: "var(--bg)",
      fontFamily: "var(--font-sans)", color: "var(--fg)",
      display: "flex", flexDirection: "column",
    }}>
      <AppHeader
        breadcrumb={
          <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 8, background: "var(--bg-subtle)" }}>
            <ModeTab active>Anatomical</ModeTab>
            <ModeTab>Diagnostic</ModeTab>
            <ModeTab>Realistic</ModeTab>
          </div>
        }
        right={<>
          <span style={{ fontSize: 12, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
            Custom · saved 12:04
          </span>
          <Btn variant="ghost" size="sm">Reset</Btn>
          <Btn variant="ghost" size="sm" leftIcon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 3v4a1 1 0 001 1h4M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/>
            </svg>
          }>Export</Btn>
        </>}
      />

      <div style={{
        flex: 1, padding: 14,
        display: "grid", gridTemplateColumns: "280px minmax(0, 1fr) 320px",
        gap: 12, minHeight: 0,
      }}>
        {/* ====== LEFT RAIL ============================================ */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 10,
          overflowY: "auto", minHeight: 0,
        }}>
          <Card padding={16}>
            <Eyebrow style={{ marginBottom: 10 }}>Rider profile</Eyebrow>
            <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
              {["5'4\"", "5'9\"", "6'2\"", "Custom"].map((p) => (
                <button key={p} style={{
                  flex: 1, height: 28, fontSize: 12, fontWeight: 500,
                  background: p === "Custom" ? "var(--primary-soft)" : "var(--bg-elevated)",
                  color: p === "Custom" ? "var(--primary-soft-fg)" : "var(--fg-1)",
                  border: `1px solid ${p === "Custom" ? "var(--pacific-200)" : "var(--border)"}`,
                  borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-mono)",
                }}>{p}</button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SliderRow label="Height" value="175" unit=" cm" min={150} max={200} fill={0.5}/>
              <SliderRow label="Femur" value="42.9" unit=" cm" min={35} max={50} fill={0.53}/>
              <SliderRow label="Tibia" value="43.1" unit=" cm" min={35} max={50} fill={0.54}/>
              <SliderRow label="Foot" value="26.6" unit=" cm" min={22} max={32} fill={0.46}/>
              <SliderRow label="Mass" value="75" unit=" kg" min={45} max={110} fill={0.46}/>
              <SliderRow label="Fast-twitch" value="50" unit="%" min={20} max={80} fill={0.5}/>
            </div>
          </Card>

          <Card padding={16}>
            <Eyebrow style={{ marginBottom: 10 }}>Bike fit</Eyebrow>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SliderRow label="Crank length" value="172.5" unit=" mm" min={155} max={185} fill={0.58}/>
              <SliderRow label="Saddle height" value="73.5" unit=" cm" min={60} max={85} fill={0.54}/>
              <SliderRow label="Saddle setback" value="5.0" unit=" cm" min={0} max={12} fill={0.42}/>
            </div>
          </Card>

          <Card padding={16}>
            <Eyebrow style={{ marginBottom: 10 }}>Goal</Eyebrow>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SliderRow label="Target speed" value="30" unit=" km/h" min={20} max={45} fill={0.4}/>
              <SliderRow label="Road grade" value="0" unit="%" min={-5} max={12} fill={0.3}/>
              <SliderRow label="Cadence" value="88" unit=" rpm" min={60} max={120} fill={0.47}/>
            </div>
          </Card>

          <Btn variant="primary" full leftIcon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          }>Find optimal fit</Btn>
        </div>

        {/* ====== CENTER ============================================== */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 12,
          minHeight: 0, overflowY: "auto",
        }}>
          {/* Promoted HUD strip — finding #5 fix */}
          <div style={{
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "14px 18px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", gap: 28, alignItems: "baseline" }}>
              <Stat label="Speed" value="30" unit=" km/h" size="lg"/>
              <Stat label="Cadence" value="88" unit=" rpm" size="lg"/>
              <Stat label="Power" value="232" unit=" W" size="lg"/>
              <Stat label="Gross η" value="23.4" unit="%" size="lg" status="success"/>
              <div style={{ width: 1, alignSelf: "stretch", background: "var(--border)" }}/>
              <Stat label="Knee at BDC" value="34" unit="°" size="lg" status="success" note="in range"/>
              <Stat label="IE" value="0.68" size="lg" note="trained"/>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Pill tone="info">Road · flat</Pill>
            </div>
          </div>

          {/* Simulator */}
          <Card padding={16} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 360 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <Eyebrow>Sagittal · drive side</Eyebrow>
              <span style={{ fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
                ω = 9.22 rad/s · 60 fps
              </span>
            </div>
            <div style={{
              flex: 1, background: "var(--bg-subtle)", borderRadius: 8,
              border: "1px solid var(--border)", overflow: "hidden", minHeight: 280,
            }}>
              <SagittalRider kneeAngle={34} hipAngle={67}/>
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", gap: 4 }}>
                {["¼×", "½×", "1×", "2×"].map((s, i) => (
                  <button key={s} style={{
                    padding: "4px 10px", fontFamily: "var(--font-mono)", fontSize: 11,
                    background: i === 2 ? "var(--bg-muted)" : "transparent",
                    border: `1px solid ${i === 2 ? "var(--border-strong)" : "var(--border)"}`,
                    borderRadius: 4, color: "var(--fg-1)", cursor: "pointer",
                  }}>{s}</button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, marginLeft: 24 }}>
                <span style={{ fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>crank θ</span>
                <div style={{
                  flex: 1, height: 4, background: "var(--bg-muted)",
                  borderRadius: 999, position: "relative",
                }}>
                  <div style={{
                    position: "absolute", left: "45%", top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 12, height: 12, background: "var(--bg-elevated)",
                    border: "2px solid var(--primary)", borderRadius: "50%",
                  }}/>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-1)" }}>162°</span>
              </div>
              <Btn variant="ghost" size="sm" leftIcon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              }>Run</Btn>
            </div>
          </Card>

          {/* Charts strip */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <ChartChip title="Knee flexion" sub="across one revolution">
              <svg viewBox="0 0 240 120" style={{ width: "100%", height: "100%" }}>
                <rect x="0" y="38" width="240" height="36" fill="var(--color-success)" opacity="0.08"/>
                <path d="M 10 80 Q 80 20 120 22 Q 160 22 230 95" fill="none"
                      stroke="var(--pacific-500)" strokeWidth="2"/>
                <circle cx="78" cy="38" r="4" fill="var(--color-danger)"/>
                <text x="0" y="115" fontFamily="var(--font-mono)" fontSize="9" fill="var(--fg-muted)">0°</text>
                <text x="115" y="115" fontFamily="var(--font-mono)" fontSize="9" fill="var(--fg-muted)">180°</text>
                <text x="220" y="115" fontFamily="var(--font-mono)" fontSize="9" fill="var(--fg-muted)">360°</text>
              </svg>
            </ChartChip>
            <ChartChip title="Crank torque" sub="left · right · sum">
              <svg viewBox="0 0 240 120" style={{ width: "100%", height: "100%" }}>
                <path d="M 10 95 Q 50 12 90 95 Z" fill="var(--pacific-500)" opacity="0.7"/>
                <path d="M 120 95 Q 160 22 200 95 Z" fill="var(--sunset-500)" opacity="0.7"/>
                <path d="M 10 95 Q 50 30 90 95 L 120 95 Q 160 36 200 95 L 230 95" fill="none"
                      stroke="var(--color-danger)" strokeWidth="1.5" strokeDasharray="4 3"/>
              </svg>
            </ChartChip>
            <ChartChip title="Efficiency vs cadence" sub="current · optimum">
              <svg viewBox="0 0 240 120" style={{ width: "100%", height: "100%" }}>
                <path d="M 10 95 Q 80 30 120 28 Q 180 30 230 95" fill="none"
                      stroke="var(--color-success)" strokeWidth="2"/>
                <line x1="118" y1="20" x2="118" y2="110" stroke="var(--color-success)" strokeDasharray="3 3"/>
                <circle cx="118" cy="28" r="4" fill="var(--color-success)"/>
                <text x="124" y="22" fontFamily="var(--font-sans)" fontSize="9" fill="var(--color-success)">optimum</text>
                <circle cx="138" cy="34" r="4" fill="var(--color-danger)"/>
                <text x="0" y="115" fontFamily="var(--font-mono)" fontSize="9" fill="var(--fg-muted)">50</text>
                <text x="218" y="115" fontFamily="var(--font-mono)" fontSize="9" fill="var(--fg-muted)">130 rpm</text>
              </svg>
            </ChartChip>
          </div>

          {/* Triangle widget — integrated, not buried */}
          <Card padding={20}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <Eyebrow>Speed · cadence · gear</Eyebrow>
                <div style={{ fontSize: 13, color: "var(--fg-1)", marginTop: 4 }}>
                  Pin any two — the third is determined.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Pill tone="info">v · n pinned</Pill>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-muted)", alignSelf: "center" }}>
                  v = (n/60) · G · π · D
                </span>
              </div>
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18,
              padding: "14px 0", borderTop: "1px solid var(--border)",
            }}>
              <TriangleNode pinned label="Speed" value="30" unit="km/h"/>
              <TriangleNode pinned label="Cadence" value="88" unit="rpm"/>
              <TriangleNode label="Gear ratio" value="3.06" unit="52 × 17" solved/>
            </div>
          </Card>
        </div>

        {/* ====== RIGHT ============================================== */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 10,
          overflowY: "auto", minHeight: 0,
        }}>
          {/* Delta-first recommendation — finding #6 fix */}
          <Card padding={20} style={{
            background: "linear-gradient(180deg, var(--bg-elevated), var(--primary-soft))",
            border: "1px solid var(--pacific-200)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <Eyebrow>Optimizer converged</Eyebrow>
              <Pill tone="success">8 / 8 restarts</Pill>
            </div>
            <div style={{
              fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 600,
              color: "var(--color-success)", letterSpacing: "-0.02em", lineHeight: 1,
            }}>+3.2%</div>
            <div style={{ fontSize: 13, color: "var(--fg-1)", marginTop: 4 }}>
              gross η vs current setup
            </div>

            <div style={{
              marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              <RecRow label="Saddle height" cur="72.0 cm" opt="73.5 cm" delta="+1.5 cm"/>
              <RecRow label="Crank length" cur="175 mm" opt="172.5 mm" delta="−2.5 mm"/>
              <RecRow label="Cadence" cur="95 rpm" opt="88 rpm" delta="−7 rpm"/>
              <RecRow label="Setback" cur="5.0 cm" opt="5.0 cm" delta="—"/>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <Btn variant="primary" size="sm" full>Apply to simulation</Btn>
              <Btn variant="ghost" size="sm">Dismiss</Btn>
            </div>
            <div style={{
              fontSize: 10, color: "var(--fg-muted)", marginTop: 8,
              fontFamily: "var(--font-mono)", textAlign: "center",
            }}>
              95% CI · saddle ±0.8 cm · crank ±2.1 mm · cadence ±3 rpm
            </div>
          </Card>

          {/* Sensitivity */}
          <Card padding={16}>
            <Eyebrow style={{ marginBottom: 12 }}>Sensitivity · η per parameter</Eyebrow>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SensitivityRow label="Saddle height" delta="−5 mm → −1.2% η" fill={0.85}/>
              <SensitivityRow label="Crank length" delta="−5 mm → −0.4% η" fill={0.45}/>
              <SensitivityRow label="Cadence" delta="+5 rpm → −0.7% η" fill={0.62}/>
              <SensitivityRow label="Setback" delta="+5 mm → −0.2% η" fill={0.25}/>
            </div>
          </Card>

          {/* Gear candidates */}
          <Card padding={16}>
            <Eyebrow style={{ marginBottom: 10 }}>Gear candidates</Eyebrow>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <GearRow front="52" rear="17" ratio="3.06" rpm="88" best/>
              <GearRow front="50" rear="16" ratio="3.13" rpm="86"/>
              <GearRow front="53" rear="17" ratio="3.12" rpm="86"/>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

function ModeTab({ active, children }) {
  return (
    <button style={{
      padding: "6px 14px", borderRadius: 6,
      background: active ? "var(--bg-elevated)" : "transparent",
      border: "none",
      boxShadow: active ? "var(--shadow-xs)" : "none",
      fontSize: 13, fontWeight: active ? 600 : 500,
      color: active ? "var(--fg)" : "var(--fg-muted)",
      cursor: "pointer", fontFamily: "var(--font-sans)",
    }}>{children}</button>
  );
}

function ChartChip({ title, sub, children }) {
  return (
    <div style={{
      background: "var(--bg-elevated)", border: "1px solid var(--border)",
      borderRadius: 10, padding: 12, height: 160,
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div>
        <Eyebrow>{title}</Eyebrow>
        <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

function TriangleNode({ label, value, unit, pinned, solved }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 8,
      background: pinned ? "var(--bg-elevated)" : "var(--primary-soft)",
      border: `1px solid ${pinned ? "var(--border)" : "var(--pacific-200)"}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        {pinned ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--primary)">
            <path d="M16 2l-2 2v6l-2 2v8l-2-2-2 2v-8l-2-2V4l-2-2h12z"/>
          </svg>
        ) : (
          <span style={{
            width: 14, height: 14, background: "var(--primary)", borderRadius: "50%",
            color: "white", fontSize: 9, fontWeight: 700, fontFamily: "var(--font-mono)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>=</span>
        )}
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em",
                       color: pinned ? "var(--fg-muted)" : "var(--primary-soft-fg)",
                       fontWeight: 500 }}>
          {pinned ? "Pinned" : "Solved"} · {label}
        </span>
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 500, color: "var(--fg)" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>{unit}</div>
    </div>
  );
}

function RecRow({ label, cur, opt, delta }) {
  const sameDelta = delta === "—";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "baseline" }}>
      <span style={{ fontSize: 12, color: "var(--fg-1)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-muted)", textDecoration: "line-through" }}>{cur}</span>
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500,
        color: sameDelta ? "var(--fg-muted)" : "var(--color-success)",
        minWidth: 70, textAlign: "right",
      }}>{opt}<span style={{
        marginLeft: 6, fontSize: 10, color: sameDelta ? "var(--fg-muted)" : "var(--color-success)",
      }}>{delta}</span></span>
    </div>
  );
}

function SensitivityRow({ label, delta, fill }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "baseline" }}>
        <span style={{ fontSize: 12, color: "var(--fg-1)" }}>{label}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-muted)" }}>{delta}</span>
      </div>
      <div style={{ height: 4, background: "var(--bg-muted)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${fill * 100}%`, height: "100%", background: "var(--primary)", borderRadius: 999 }}/>
      </div>
    </div>
  );
}

function GearRow({ front, rear, ratio, rpm, best }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 12px", borderRadius: 8,
      background: best ? "var(--primary-soft)" : "var(--bg-subtle)",
      border: `1px solid ${best ? "var(--pacific-200)" : "var(--border)"}`,
    }}>
      <div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 500,
          color: best ? "var(--primary-soft-fg)" : "var(--fg)",
        }}>{front} × {rear}</div>
        <div style={{ fontSize: 10, color: "var(--fg-muted)", marginTop: 2 }}>
          {best && "best · "}{rpm} rpm @ 30 km/h
        </div>
      </div>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 500,
        color: best ? "var(--primary-soft-fg)" : "var(--fg-1)",
      }}>= {ratio}</div>
    </div>
  );
}
