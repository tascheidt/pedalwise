/* global React, Pedalwise */
const { AppHeader, Eyebrow, SagittalRider, Stat, Card, Btn, Pill } = Pedalwise;

/* =====================================================================
   Engineer Workbench — power-user mode. Parameter sweep, equations
   visible, raw numerics, CSV / JSON export hooks.
   ===================================================================== */

window.EngineerWorkbench = function EngineerWorkbench() {
  return (
    <div style={{
      height: "100%", background: "var(--bg)",
      fontFamily: "var(--font-sans)", color: "var(--fg)",
      display: "flex", flexDirection: "column",
    }}>
      <AppHeader
        persona="Engineer Workbench"
        breadcrumb={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-mono)" }}>experiments/</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>crank-len-sweep-v3.pw</span>
            <Pill tone="warn" style={{ marginLeft: 8 }}>unsaved</Pill>
          </span>
        }
        right={<>
          <Btn variant="ghost" size="sm" leftIcon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
          }>Export CSV</Btn>
          <Btn variant="ghost" size="sm" leftIcon={<span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{"{ }"}</span>}>JSON</Btn>
          <Btn variant="primary" size="sm" leftIcon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          }>Run sweep · 240 runs</Btn>
        </>}
      />

      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: "300px minmax(0, 1fr) 380px",
        gap: 0, minHeight: 0,
      }}>
        {/* ---- Left: experiment controls ---------------------- */}
        <div style={{
          background: "var(--bg-elevated)", borderRight: "1px solid var(--border)",
          padding: "18px 16px", display: "flex", flexDirection: "column", gap: 16,
          overflowY: "auto",
        }}>
          <div>
            <Eyebrow>Experiment</Eyebrow>
            <div style={{ marginTop: 6, fontSize: 13, color: "var(--fg-1)", lineHeight: 1.45 }}>
              Sweep crank length 160–180mm × cadence 75–105rpm with one rider
              preset, measure gross η.
            </div>
          </div>

          <div>
            <Eyebrow>Fixed parameters</Eyebrow>
            <div style={{
              marginTop: 8, padding: "10px 12px",
              background: "var(--bg-subtle)", borderRadius: 8,
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-1)",
              lineHeight: 1.7,
            }}>
              <div><span style={{ color: "var(--fg-muted)" }}>preset</span> = 5'9"</div>
              <div><span style={{ color: "var(--fg-muted)" }}>height</span> = 175 cm</div>
              <div><span style={{ color: "var(--fg-muted)" }}>femur</span> = 42.9 cm</div>
              <div><span style={{ color: "var(--fg-muted)" }}>tibia</span> = 43.1 cm</div>
              <div><span style={{ color: "var(--fg-muted)" }}>mass</span> = 75 kg</div>
              <div><span style={{ color: "var(--fg-muted)" }}>ft_pct</span> = 50%</div>
              <div><span style={{ color: "var(--fg-muted)" }}>v_target</span> = 30 km/h</div>
              <div><span style={{ color: "var(--fg-muted)" }}>grade</span> = 0%</div>
            </div>
          </div>

          <div>
            <Eyebrow>Sweep axes</Eyebrow>
            <SweepAxis label="X · Crank length" expr="160 → 180 mm · step 2.5"/>
            <SweepAxis label="Y · Cadence" expr="75 → 105 rpm · step 5"/>
            <SweepAxis label="Measure" expr="gross_eta, knee_BDC, IE"/>
            <Btn variant="ghost" size="sm" style={{ marginTop: 4, width: "100%", justifyContent: "center" }}>
              + Add axis
            </Btn>
          </div>

          <div>
            <Eyebrow>Custom anatomy</Eyebrow>
            <div style={{
              marginTop: 8, padding: "10px 12px",
              border: "1px dashed var(--border-strong)", borderRadius: 8,
              fontSize: 12, color: "var(--fg-muted)",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 3v4a1 1 0 001 1h4M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/>
              </svg>
              Import rider.json
            </div>
          </div>

          <div style={{ marginTop: "auto" }}>
            <Eyebrow>Compute</Eyebrow>
            <div style={{
              marginTop: 8, padding: 10,
              background: "var(--bg-subtle)", borderRadius: 8,
              border: "1px solid var(--border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontFamily: "var(--font-mono)", fontSize: 11,
            }}>
              <span style={{ color: "var(--fg-muted)" }}>240 runs · 8-core worker</span>
              <span style={{ color: "var(--color-success)" }}>~3.4s</span>
            </div>
          </div>
        </div>

        {/* ---- Center: sweep grid + sim ----------------------- */}
        <div style={{
          padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14,
          overflowY: "auto", minHeight: 0,
        }}>
          {/* HUD strip */}
          <div style={{
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "14px 18px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", gap: 28 }}>
              <Stat label="Active cell" value="(172.5, 88)" size="md"/>
              <Stat label="Gross η" value="23.40" unit="%" size="md" status="success"/>
              <Stat label="Knee BDC" value="34.2" unit="°" size="md"/>
              <Stat label="IE" value="0.68" size="md"/>
              <Stat label="Metabolic" value="991" unit=" W" size="md"/>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Pill tone="success">converged</Pill>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-muted)" }}>
                seed=0xA1F3 · iter=240/240
              </span>
            </div>
          </div>

          {/* Sweep heatmap + sagittal */}
          <div style={{
            display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
            gap: 14, flex: 1, minHeight: 0,
          }}>
            <Card padding={16} style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <Eyebrow>Sweep · crank length × cadence · color = gross η</Eyebrow>
                <span style={{ fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
                  9 × 7 cells · hover for raw
                </span>
              </div>
              <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
                <SweepHeatmap/>
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between", marginTop: 8,
                fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--font-mono)",
              }}>
                <span>160mm</span>
                <span>← crank length →</span>
                <span>180mm</span>
              </div>
            </Card>

            <Card padding={16} style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
              <Eyebrow style={{ marginBottom: 10 }}>Pose · active cell</Eyebrow>
              <div style={{
                flex: 1, background: "var(--bg-subtle)", borderRadius: 8,
                border: "1px solid var(--border)", overflow: "hidden", minHeight: 0,
              }}>
                <SagittalRider kneeAngle={34} hipAngle={67} showGhost/>
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10,
                paddingTop: 10, borderTop: "1px solid var(--border)",
                fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-1)",
              }}>
                <span><span style={{ color: "var(--fg-muted)" }}>q_hip</span> = 67.3°</span>
                <span><span style={{ color: "var(--fg-muted)" }}>q_knee</span> = 142.1°</span>
                <span><span style={{ color: "var(--fg-muted)" }}>q_ankle</span> = 98.4°</span>
                <span><span style={{ color: "var(--fg-muted)" }}>ω</span> = 9.22 rad/s</span>
              </div>
            </Card>
          </div>

          {/* Frame stream viz */}
          <Card padding={16}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <Eyebrow>Frame stream · one revolution at active cell</Eyebrow>
              <span style={{ fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
                Δθ = π/12 · 24 frames
              </span>
            </div>
            <svg viewBox="0 0 800 60" style={{ width: "100%", height: 60 }}>
              {Array.from({ length: 24 }).map((_, i) => {
                const x = 16 + i * 32;
                const phase = i / 24 * Math.PI * 2;
                const torque = Math.max(0, Math.sin(phase));
                return (
                  <g key={i}>
                    <rect x={x - 12} y={42 - 28 * torque} width="20" height={28 * torque + 2}
                          fill={torque > 0.6 ? "var(--pacific-500)" : "var(--pacific-300)"} rx="2"/>
                    <text x={x - 4} y={56} fontFamily="var(--font-mono)" fontSize="8" fill="var(--fg-muted)" textAnchor="middle">{i * 15}°</text>
                  </g>
                );
              })}
            </svg>
          </Card>
        </div>

        {/* ---- Right: equations + raw drawer ------------------ */}
        <div style={{
          background: "var(--bg-elevated)", borderLeft: "1px solid var(--border)",
          padding: "18px 16px", display: "flex", flexDirection: "column", gap: 14,
          overflowY: "auto",
        }}>
          <div>
            <Eyebrow>Model · what's being solved</Eyebrow>
            <div style={{
              marginTop: 10, padding: "14px 16px",
              background: "var(--bg-subtle)", borderRadius: 8,
              border: "1px solid var(--border)",
              fontFamily: "var(--font-display)", fontStyle: "italic",
              fontSize: 16, color: "var(--fg)", lineHeight: 1.8,
            }}>
              <div>v = (n / 60) · G · π · D</div>
              <div>η<sub>gross</sub> = W<sub>mech</sub> / Q̇<sub>met</sub></div>
              <div>IE = ∫ F<sub>t</sub> dθ / ∫ |F<sub>p</sub>| dθ</div>
              <div>θ<sub>knee,BDC</sub> = π − cos⁻¹((S² + L² − T²) / 2SL)</div>
            </div>
          </div>

          <div>
            <Eyebrow>Assumptions sheet</Eyebrow>
            <ul style={{
              margin: "8px 0 0", padding: 0, listStyle: "none",
              fontSize: 12, color: "var(--fg-1)", lineHeight: 1.55,
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              <li style={{ display: "flex", gap: 6 }}>
                <span style={{ color: "var(--pacific-500)", fontFamily: "var(--font-mono)" }}>·</span>
                Sagittal plane only; no Z-axis pelvic rotation.
              </li>
              <li style={{ display: "flex", gap: 6 }}>
                <span style={{ color: "var(--pacific-500)", fontFamily: "var(--font-mono)" }}>·</span>
                Joint stiffness modeled as linear spring (k = 0).
              </li>
              <li style={{ display: "flex", gap: 6 }}>
                <span style={{ color: "var(--pacific-500)", fontFamily: "var(--font-mono)" }}>·</span>
                Hill-type efficiency, no fatigue accumulation.
              </li>
              <li style={{ display: "flex", gap: 6 }}>
                <span style={{ color: "var(--pacific-500)", fontFamily: "var(--font-mono)" }}>·</span>
                Cleat position centered under metatarsal.
              </li>
              <li style={{ display: "flex", gap: 6 }}>
                <span style={{ color: "var(--pacific-500)", fontFamily: "var(--font-mono)" }}>·</span>
                Cd, Crr drag from Wilson &amp; Papadopoulos 2004.
              </li>
            </ul>
          </div>

          <div>
            <Eyebrow>Raw numerics · active cell</Eyebrow>
            <div style={{
              marginTop: 8, padding: 12,
              background: "var(--sand-950)", color: "var(--sand-100)",
              borderRadius: 8, fontFamily: "var(--font-mono)",
              fontSize: 11, lineHeight: 1.7,
              overflow: "auto", maxHeight: 230,
            }}>
              <div style={{ color: "var(--sun-400)" }}>{"// active cell · (172.5, 88)"}</div>
              <div><span style={{ color: "var(--pacific-300)" }}>gross_eta</span>: <span style={{ color: "var(--sun-400)" }}>0.234</span></div>
              <div><span style={{ color: "var(--pacific-300)" }}>knee_BDC</span>: <span style={{ color: "var(--sun-400)" }}>34.18°</span></div>
              <div><span style={{ color: "var(--pacific-300)" }}>ie</span>: <span style={{ color: "var(--sun-400)" }}>0.679</span></div>
              <div><span style={{ color: "var(--pacific-300)" }}>p_hip</span>: <span style={{ color: "var(--sun-400)" }}>0.583</span></div>
              <div><span style={{ color: "var(--pacific-300)" }}>p_knee</span>: <span style={{ color: "var(--sun-400)" }}>0.312</span></div>
              <div><span style={{ color: "var(--pacific-300)" }}>p_ankle</span>: <span style={{ color: "var(--sun-400)" }}>0.105</span></div>
              <div><span style={{ color: "var(--pacific-300)" }}>met_cost</span>: <span style={{ color: "var(--sun-400)" }}>991.4 W</span></div>
              <div><span style={{ color: "var(--pacific-300)" }}>q_dot_max</span>: <span style={{ color: "var(--sun-400)" }}>11.84 rad/s</span></div>
              <div style={{ color: "var(--sand-400)" }}>...</div>
              <div style={{ color: "var(--sun-400)", marginTop: 6 }}>{"// 240 cells total · click to inspect"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function SweepAxis({ label, expr }) {
  return (
    <div style={{
      marginTop: 8, padding: "10px 12px",
      background: "var(--bg-subtle)", borderRadius: 8,
      border: "1px solid var(--border)",
    }}>
      <div style={{ fontSize: 11, color: "var(--fg-muted)", fontWeight: 500, marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg)" }}>{expr}</div>
    </div>
  );
}

/* The sweep heatmap. 9 columns (crank length) × 7 rows (cadence).
   Color = gross η. Active cell highlighted, optimum marked. */
function SweepHeatmap() {
  const cols = 9, rows = 7;
  const ETA = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      // synthetic surface peaked near c=5 r=3 (172.5mm, 88rpm)
      const dx = (c - 5) / 4;
      const dy = (r - 3) / 3;
      const eta = 0.234 - 0.04 * (dx * dx + dy * dy * 1.3);
      row.push(eta);
    }
    ETA.push(row);
  }
  const min = 0.155, max = 0.234;
  function color(v) {
    const t = (v - min) / (max - min);
    // pacific-100 → pacific-600 ramp via sun-300 hot spot
    if (t > 0.85) return "oklch(0.575 0.150 236)";
    if (t > 0.7) return "oklch(0.680 0.140 232)";
    if (t > 0.55) return "oklch(0.795 0.110 230)";
    if (t > 0.4) return "oklch(0.885 0.072 230)";
    if (t > 0.25) return "oklch(0.945 0.038 230)";
    return "oklch(0.975 0.018 230)";
  }
  return (
    <svg viewBox="0 0 460 280" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%" }}>
      {/* y-labels */}
      {Array.from({ length: rows }).map((_, r) => (
        <text key={r} x="22" y={36 + r * 36 + 5}
              fontFamily="var(--font-mono)" fontSize="10" fill="var(--fg-muted)" textAnchor="end">
          {105 - r * 5}
        </text>
      ))}
      <text x="8" y="160" fontFamily="var(--font-sans)" fontSize="10" fill="var(--fg-muted)"
            transform="rotate(-90 8 160)" textAnchor="middle">cadence (rpm)</text>

      {ETA.map((row, r) =>
        row.map((v, c) => {
          const isActive = r === 3 && c === 5;
          return (
            <g key={`${r}-${c}`}>
              <rect x={40 + c * 42} y={22 + r * 36} width="38" height="32" rx="3"
                    fill={color(v)} stroke={isActive ? "var(--sand-950)" : "var(--sand-0)"}
                    strokeWidth={isActive ? 2 : 1}/>
              <text x={40 + c * 42 + 19} y={22 + r * 36 + 20}
                    textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9"
                    fontWeight={isActive ? 600 : 400}
                    fill={v > 0.21 ? "var(--sand-0)" : "var(--sand-900)"}>
                {(v * 100).toFixed(1)}
              </text>
            </g>
          );
        })
      )}
      {/* optimum marker */}
      <g transform="translate(228, 130)">
        <circle r="4" fill="none" stroke="var(--sand-950)" strokeWidth="1.5"/>
        <line x1="-7" y1="0" x2="-3" y2="0" stroke="var(--sand-950)" strokeWidth="1.5"/>
        <line x1="3" y1="0" x2="7" y2="0" stroke="var(--sand-950)" strokeWidth="1.5"/>
        <line x1="0" y1="-7" x2="0" y2="-3" stroke="var(--sand-950)" strokeWidth="1.5"/>
        <line x1="0" y1="3" x2="0" y2="7" stroke="var(--sand-950)" strokeWidth="1.5"/>
      </g>
      <text x="244" y="124" fontFamily="var(--font-mono)" fontSize="9" fill="var(--sand-950)" fontWeight="600">opt</text>
    </svg>
  );
}
