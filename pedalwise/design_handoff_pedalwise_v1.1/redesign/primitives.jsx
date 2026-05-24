/* global React */

/* =====================================================================
   Shared visual primitives used across artboards.
   Pedalwise visual language: warm Sand background, Pacific blue accent,
   monospace numbers, generous quiet panels.
   ===================================================================== */

window.Pedalwise = (function () {
  /* The Pedalwise wordmark — small "P" dot then label */
  function Wordmark({ size = 16, subtitle }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          width: size + 6, height: size + 6, borderRadius: "50%",
          background: "radial-gradient(circle at 30% 30%, var(--pacific-300), var(--pacific-700) 70%)",
          position: "relative", flex: "none",
        }}>
          <span style={{
            position: "absolute", inset: "32% 18% 32% 18%",
            border: "1.5px solid var(--sand-0)", borderRadius: "50%",
            transform: "rotate(-30deg)",
          }} />
        </span>
        <span style={{ fontWeight: 600, fontSize: size, letterSpacing: "-0.01em" }}>
          Pedalwise{subtitle && <span style={{
            color: "var(--fg-muted)", fontWeight: 400, marginLeft: 8,
          }}>{subtitle}</span>}
        </span>
      </div>
    );
  }

  /* Header chrome that appears at top of every persona workspace */
  function AppHeader({ persona, breadcrumb, right }) {
    return (
      <div style={{
        height: 56, padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Wordmark size={15} />
          {persona && (
            <>
              <span style={{ color: "var(--sand-300)" }}>/</span>
              <span style={{
                padding: "3px 10px", borderRadius: 999,
                background: "var(--primary-soft)", color: "var(--primary-soft-fg)",
                fontSize: 12, fontWeight: 500,
              }}>
                {persona}
              </span>
            </>
          )}
          {breadcrumb && (
            <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
              {breadcrumb}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {right}
        </div>
      </div>
    );
  }

  /* Section label — the eyebrow text Pedalwise uses */
  function Eyebrow({ children, style }) {
    return (
      <div style={{
        fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em",
        color: "var(--fg-muted)", fontWeight: 500, ...style,
      }}>{children}</div>
    );
  }

  /* Pedalwise sagittal rider — a parameterized SVG. Kinematic-feel,
     not literal. Used by every artboard that shows the simulator. */
  function SagittalRider({
    width = "100%", height = "100%",
    kneeAngle = 34, hipAngle = 67,
    showGhost = false, showVectors = false, showForceFlow = false,
    showDeadZones = false,
    accentColor = "var(--color-danger)",
    fill = "outline", // "outline" | "silhouette"
  }) {
    return (
      <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet" style={{ width, height, display: "block" }}>
        <defs>
          <pattern id="gridfine" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="var(--sand-100)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="400" height="320" fill="url(#gridfine)"/>

        {/* pedal circle */}
        <circle cx="210" cy="220" r="60" fill="none" stroke="var(--sand-200)" strokeDasharray="3 4"/>

        {/* dead zones */}
        {showDeadZones && (
          <>
            <circle cx="210" cy="160" r="14" fill="var(--color-danger)" opacity="0.10"/>
            <circle cx="210" cy="280" r="14" fill="var(--color-danger)" opacity="0.10"/>
            <text x="210" y="163" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="9"
                  fill="var(--color-danger)" fontWeight="500">TDC</text>
            <text x="210" y="283" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="9"
                  fill="var(--color-danger)" fontWeight="500">BDC</text>
          </>
        )}

        {/* ghost */}
        {showGhost && (
          <g opacity="0.22" strokeLinecap="round">
            <line x1="200" y1="85" x2="225" y2="170" stroke="var(--sand-500)" strokeWidth="8"/>
            <line x1="225" y1="170" x2="240" y2="270" stroke="var(--sand-500)" strokeWidth="8"/>
          </g>
        )}

        {/* limbs */}
        {fill === "silhouette" ? (
          <>
            <path d="M 145 35 Q 170 30 195 50 L 240 130 L 260 200 L 240 210 L 220 200 L 205 140 L 175 75 L 145 60 Z"
                  fill="var(--sand-900)"/>
            <path d="M 138 30 Q 160 14 188 22 Q 195 32 192 42 Q 175 44 155 50 Q 142 50 138 38 Z" fill="var(--sand-900)"/>
          </>
        ) : (
          <g strokeLinecap="round">
            <line x1="135" y1="60" x2="200" y2="85" stroke="var(--sand-700)" strokeWidth="8" opacity="0.85"/>
            <line x1="200" y1="85" x2="240" y2="180" stroke="var(--sand-950)" strokeWidth="10"/>
            <line x1="240" y1="180" x2="265" y2="265" stroke="var(--sand-950)" strokeWidth="10"/>
            <line x1="265" y1="265" x2="248" y2="280" stroke="var(--sand-950)" strokeWidth="7"/>
          </g>
        )}

        {/* joint dots */}
        {fill !== "silhouette" && (
          <>
            <circle cx="200" cy="85" r="6" fill="var(--bg-elevated)" stroke="var(--sand-950)" strokeWidth="2"/>
            <circle cx="240" cy="180" r="8" fill="var(--bg-elevated)" stroke={accentColor} strokeWidth="2.5"/>
            <circle cx="265" cy="265" r="5" fill="var(--bg-elevated)" stroke="var(--sand-950)" strokeWidth="2"/>
            <circle cx="210" cy="220" r="4" fill="var(--sand-950)"/>
            <ellipse cx="200" cy="78" rx="16" ry="4" fill="var(--primary)"/>

            {/* knee label */}
            <text x="255" y="172" fontFamily="var(--font-mono)" fontSize="14"
                  fontWeight="500" fill={accentColor}>{kneeAngle}°</text>
            <text x="255" y="186" fontFamily="var(--font-sans)" fontSize="10" fill="var(--fg-muted)">knee</text>
            {/* hip label */}
            <text x="160" y="74" fontFamily="var(--font-mono)" fontSize="12" fill="var(--fg-2)">{hipAngle}°</text>
            <text x="160" y="86" fontFamily="var(--font-sans)" fontSize="10" fill="var(--fg-muted)">hip</text>
          </>
        )}

        {/* force vectors */}
        {showVectors && (
          <>
            <g stroke="var(--color-success)" strokeWidth="2.5">
              <line x1="265" y1="265" x2="310" y2="258"/>
              <path d="M310 258 L302 254 L302 262 Z" fill="var(--color-success)" stroke="none"/>
            </g>
            <g stroke="var(--sand-500)" strokeWidth="2" strokeDasharray="3 3">
              <line x1="265" y1="265" x2="280" y2="240"/>
            </g>
          </>
        )}
      </svg>
    );
  }

  /* Stat readout — eyebrow label, mono value, optional note */
  function Stat({ label, value, unit, status, note, align = "left", size = "md" }) {
    const color = status === "success" ? "var(--color-success)"
      : status === "warn" ? "var(--color-warning)"
      : status === "danger" ? "var(--color-danger)"
      : "var(--fg)";
    const valueSize = size === "lg" ? 28 : size === "sm" ? 14 : 18;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: align }}>
        <span style={{
          fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em",
          color: "var(--fg-muted)", fontWeight: 500,
        }}>{label}</span>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: valueSize,
          fontWeight: 500, color, letterSpacing: "-0.01em",
        }}>
          {value}{unit && <span style={{ fontSize: valueSize - 6, marginLeft: 3, color: "var(--fg-muted)" }}>{unit}</span>}
        </span>
        {note && <span style={{ fontSize: 11, color: "var(--fg-muted)", fontStyle: "italic" }}>{note}</span>}
      </div>
    );
  }

  /* A bordered card */
  function Card({ children, style, padding = 20 }) {
    return (
      <div style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding,
        ...style,
      }}>{children}</div>
    );
  }

  /* Solid Pedalwise primary button */
  function Btn({ variant = "primary", size = "md", children, leftIcon, rightIcon, style, full }) {
    const h = size === "sm" ? 28 : size === "lg" ? 44 : 36;
    const palette = {
      primary: { bg: "var(--primary)", color: "var(--fg-on-primary)", border: "transparent" },
      ghost:   { bg: "transparent", color: "var(--fg)", border: "var(--border-strong)" },
      soft:    { bg: "var(--primary-soft)", color: "var(--primary-soft-fg)", border: "transparent" },
      accent:  { bg: "var(--accent)", color: "var(--sand-950)", border: "transparent" },
      danger:  { bg: "transparent", color: "var(--color-danger)", border: "var(--border)" },
    }[variant];
    return (
      <button style={{
        height: h, padding: `0 ${size === "sm" ? 12 : 16}px`,
        background: palette.bg, color: palette.color,
        border: `1px solid ${palette.border}`,
        borderRadius: 8,
        fontFamily: "var(--font-sans)", fontSize: size === "sm" ? 13 : 14, fontWeight: 500,
        display: "inline-flex", alignItems: "center", gap: 8,
        cursor: "pointer", width: full ? "100%" : undefined, justifyContent: full ? "center" : undefined,
        whiteSpace: "nowrap", ...style,
      }}>
        {leftIcon}
        {children}
        {rightIcon}
      </button>
    );
  }

  /* Slider row — same primitive used across all controls */
  function SliderRow({ label, value, unit, min, max, fill, note, status }) {
    const f = fill ?? ((parseFloat(value) - min) / (max - min));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 13, color: "var(--fg-1)" }}>{label}</span>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 13,
            color: status === "warn" ? "var(--color-warning)" : "var(--fg)",
            fontWeight: 500,
          }}>{value}{unit && <span style={{ color: "var(--fg-muted)", marginLeft: 2 }}>{unit}</span>}</span>
        </div>
        <div style={{ position: "relative", height: 4, background: "var(--sand-100)", borderRadius: 999 }}>
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: `${Math.max(0, Math.min(1, f)) * 100}%`,
            background: "var(--primary)", borderRadius: 999,
          }}/>
          <div style={{
            position: "absolute", left: `${Math.max(0, Math.min(1, f)) * 100}%`,
            top: "50%", transform: "translate(-50%, -50%)",
            width: 14, height: 14, background: "var(--bg-elevated)",
            border: "2px solid var(--primary)", borderRadius: "50%",
          }}/>
        </div>
        {note && <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>{note}</span>}
      </div>
    );
  }

  /* Badge / pill */
  function Pill({ tone = "neutral", children, style }) {
    const map = {
      neutral: { bg: "var(--bg-muted)", color: "var(--fg-1)" },
      success: { bg: "color-mix(in oklab, var(--color-success) 15%, transparent)", color: "var(--color-success)" },
      warn:    { bg: "var(--accent-soft)", color: "var(--accent-soft-fg)" },
      info:    { bg: "var(--primary-soft)", color: "var(--primary-soft-fg)" },
      highlight: { bg: "var(--highlight-soft)", color: "var(--highlight-soft-fg)" },
    }[tone];
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 8px", borderRadius: 999,
        background: map.bg, color: map.color,
        fontSize: 11, fontWeight: 500, letterSpacing: "0.02em",
        ...style,
      }}>{children}</span>
    );
  }

  return { Wordmark, AppHeader, Eyebrow, SagittalRider, Stat, Card, Btn, SliderRow, Pill };
})();
