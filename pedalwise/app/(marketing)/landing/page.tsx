import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pedalwise — sagittal-plane bike-fit simulator",
  description:
    "Sagittal-plane bike-fit simulator. Move saddle height, crank length, and cadence; the optimizer proposes a +η fit, applied only when you say so.",
};

/* ─────────────────────────────────────────────────────────────────────────────
   Token mapping (design-package → globals.css)
   --bg / --bg-elevated / --bg-muted / --bg-subtle
     → var(--color-bg-app) / var(--color-bg-surface) / var(--color-bg-alt) / var(--color-bg-alt)
   --fg / --fg-1 / --fg-2 / --fg-muted
     → var(--color-text-primary) / var(--color-text-secondary) / var(--color-text-secondary) / var(--color-text-tertiary)
   --border / --border-strong
     → var(--color-border-default) / var(--color-border-strong)
   --primary / --primary-hover
     → var(--color-accent) / var(--color-accent-dark)
   --primary-soft / --primary-soft-fg
     → var(--color-accent-light) / var(--color-accent-dark)
   --color-success   → var(--color-success)
   --color-danger    → var(--color-danger)
   sand-* stroke fills in SVGs → literal oklch values kept only inside SVG where no token covers them;
                                  otherwise mapped to --color-text-primary / secondary / tertiary
───────────────────────────────────────────────────────────────────────────── */

/* ── Inline styles as const objects so TypeScript is happy ─────────────── */

const css = {
  // Layout
  container: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "0 24px",
  } satisfies React.CSSProperties,

  // Nav
  nav: {
    borderBottom: "1px solid var(--color-border-default)",
    background: "var(--color-bg-surface)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  } satisfies React.CSSProperties,
  navInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 60,
  } satisfies React.CSSProperties,

  // Section wrapper
  section: {
    padding: "96px 0",
    borderBottom: "1px solid var(--color-border-default)",
  } satisfies React.CSSProperties,
  sectionAlt: {
    padding: "96px 0",
    borderBottom: "1px solid var(--color-border-default)",
    background: "var(--color-bg-alt)",
  } satisfies React.CSSProperties,

  // Section head
  sectionHead: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 48,
    alignItems: "end",
    marginBottom: 40,
  } satisfies React.CSSProperties,
} as const;

/* ── Wordmark ──────────────────────────────────────────────────────────── */
function Wordmark() {
  return (
    <Link
      href="/"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontWeight: 600,
        fontSize: 16,
        letterSpacing: "-0.01em",
        color: "var(--color-text-primary)",
        textDecoration: "none",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 30% 30%, var(--color-accent-light), var(--color-accent-dark) 70%)",
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      <span>Pedalwise</span>
    </Link>
  );
}

/* ── Eyebrow label ─────────────────────────────────────────────────────── */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="section-label"
      style={{ marginBottom: 12 }}
    >
      {children}
    </div>
  );
}

/* ── Primary link-button ───────────────────────────────────────────────── */
function PrimaryLink({
  href,
  size = "md",
  children,
  testId,
}: {
  href: string;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  testId?: string;
}) {
  const heights: Record<string, number> = { sm: 32, md: 40, lg: 48 };
  const paddings: Record<string, string> = { sm: "0 12px", md: "0 18px", lg: "0 22px" };
  const fontSizes: Record<string, number> = { sm: 13, md: 14, lg: 16 };
  return (
    <Link
      href={href}
      data-testid={testId}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: heights[size],
        padding: paddings[size],
        borderRadius: 8,
        fontFamily: "inherit",
        fontSize: fontSizes[size],
        fontWeight: 500,
        background: "var(--color-accent)",
        color: "white",
        border: "1px solid var(--color-accent)",
        textDecoration: "none",
        whiteSpace: "nowrap",
        transition: "background 120ms, border-color 120ms",
      }}
    >
      {children}
    </Link>
  );
}

/* ── Ghost link-button ─────────────────────────────────────────────────── */
function GhostLink({
  href,
  size = "md",
  children,
  testId,
}: {
  href: string;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  testId?: string;
}) {
  const heights: Record<string, number> = { sm: 32, md: 40, lg: 48 };
  const paddings: Record<string, string> = { sm: "0 12px", md: "0 18px", lg: "0 22px" };
  const fontSizes: Record<string, number> = { sm: 13, md: 14, lg: 16 };
  return (
    <Link
      href={href}
      data-testid={testId}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: heights[size],
        padding: paddings[size],
        borderRadius: 8,
        fontFamily: "inherit",
        fontSize: fontSizes[size],
        fontWeight: 500,
        background: "transparent",
        color: "var(--color-text-primary)",
        border: "1px solid var(--color-border-strong)",
        textDecoration: "none",
        whiteSpace: "nowrap",
        transition: "background 120ms, border-color 120ms",
      }}
    >
      {children}
    </Link>
  );
}

/* ── Arrow icon (inline) ───────────────────────────────────────────────── */
function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div
      style={{
        background: "var(--color-bg-app)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      {/* ──────────────────────────────────────────── NAV */}
      <nav aria-label="Site navigation" style={css.nav}>
        <div style={{ ...css.container, ...css.navInner }}>
          <Wordmark />
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "center",
              color: "var(--color-text-secondary)",
              fontSize: 14,
            }}
          >
            <Link
              href="#use"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              What it does
            </Link>
            <Link
              href="#how"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              How it works
            </Link>
            <Link
              href="#science"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              The model
            </Link>
            <Link
              href="#optimizer"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Optimizer
            </Link>
            <GhostLink href="/" size="sm" testId="nav-sign-in">
              Sign in
            </GhostLink>
            <PrimaryLink href="/" size="sm" testId="nav-open-simulator">
              Open simulator
            </PrimaryLink>
          </div>
        </div>
      </nav>

      {/* ──────────────────────────────────────────── HERO */}
      <header
        style={{
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid var(--color-border-default)",
        }}
      >
        {/* Subtle background gradients — no token exists for these raw oklch
            hues; the design package used them as decorative ambient light.
            They carry no semantic meaning so raw values are acceptable here. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(60% 80% at 85% 10%, oklch(0.945 0.038 230 / 0.5), transparent 60%), radial-gradient(50% 70% at 10% 90%, oklch(0.955 0.040 60 / 0.25), transparent 60%)",
          }}
        />
        {/* Grid texture */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.35,
            backgroundImage:
              "linear-gradient(to right, var(--color-border-default) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border-default) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)",
          }}
        />

        <div
          style={{
            ...css.container,
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
            padding: "88px 24px 96px",
          }}
        >
          {/* Left copy */}
          <div>
            {/* Eyebrow pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 9999,
                background: "var(--color-accent-light)",
                color: "var(--color-accent-dark)",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.02em",
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                  display: "inline-block",
                }}
              />
              Sagittal-plane biomechanics simulator
            </div>

            <h1
              style={{
                fontSize: "clamp(40px, 5vw, 60px)",
                lineHeight: 1.02,
                fontWeight: 600,
                letterSpacing: "-0.025em",
                margin: "0 0 20px",
                color: "var(--color-text-primary)",
              }}
            >
              See the trade-offs in your fit{" "}
              <em
                style={{
                  fontStyle: "italic",
                  color: "var(--color-accent)",
                }}
              >
                before
              </em>{" "}
              you change a bolt.
            </h1>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.65,
                color: "var(--color-text-secondary)",
                maxWidth: 540,
                margin: "0 0 32px",
              }}
            >
              Pedalwise renders an articulated rider pedaling in real time. Move
              the saddle, watch the knee angle move. Change cadence, the
              efficiency curve redraws. The optimizer proposes a better fit and
              gear, as a dialogue — never a silent overwrite.
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <PrimaryLink href="/" size="lg" testId="hero-open-simulator">
                Open the simulator
                <ArrowRight />
              </PrimaryLink>
              <GhostLink href="#how" size="lg" testId="hero-how-it-works">
                How it works
              </GhostLink>
            </div>

            {/* Hero stats */}
            <div
              style={{
                display: "flex",
                gap: 32,
                marginTop: 40,
                paddingTop: 24,
                borderTop: "1px solid var(--color-border-default)",
                maxWidth: 540,
              }}
            >
              {[
                { num: "3", lbl: "anatomy presets: 5′4″ · 5′9″ · 6′2″" },
                { num: "3", lbl: "view modes per session" },
                { num: "60 fps", lbl: "slider to rider redraw" },
              ].map(({ num, lbl }) => (
                <div key={lbl}>
                  <div
                    className="mono"
                    style={{
                      fontSize: 24,
                      fontWeight: 500,
                      color: "var(--color-text-primary)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {num}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-tertiary)",
                      marginTop: 2,
                    }}
                  >
                    {lbl}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: hero illustration */}
          <div
            aria-label="Sagittal view of a pedaling rider, showing knee angle at bottom dead centre and gross efficiency readout"
            role="img"
            style={{
              position: "relative",
              aspectRatio: "1 / 1",
              maxWidth: 560,
              marginLeft: "auto",
              borderRadius: 18,
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-default)",
              boxShadow: "0 4px 12px oklch(0.16 0.04 255 / 0.08), 0 2px 4px oklch(0.16 0.04 255 / 0.04)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-text-tertiary)",
                fontWeight: 500,
              }}
            >
              Sagittal · drive side
            </div>
            <div
              className="mono"
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                fontSize: 12,
                color: "var(--color-text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--color-success)",
                }}
              />
              live
            </div>

            {/* Sagittal rider SVG — inlined from design source */}
            <svg
              viewBox="0 0 560 560"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "100%", height: "100%", display: "block" }}
              aria-hidden="true"
            >
              <defs>
                <pattern
                  id="hero-grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M40 0H0V40"
                    fill="none"
                    stroke="var(--color-border-default)"
                    strokeWidth="1"
                  />
                </pattern>
                <radialGradient id="hero-halo" cx="50%" cy="50%" r="50%">
                  <stop
                    offset="0%"
                    stopColor="var(--color-accent-light)"
                    stopOpacity="0.9"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-accent-light)"
                    stopOpacity="0"
                  />
                </radialGradient>
              </defs>
              <rect width="560" height="560" fill="url(#hero-grid)" />
              <circle cx="280" cy="280" r="240" fill="url(#hero-halo)" />

              {/* Pedal circle */}
              <circle
                cx="290"
                cy="400"
                r="92"
                fill="none"
                stroke="var(--color-border-strong)"
                strokeWidth="1.5"
                strokeDasharray="3 4"
              />

              {/* Ghost — previous fit at 25% opacity */}
              <g opacity="0.25" strokeLinecap="round">
                <line
                  x1="278"
                  y1="180"
                  x2="268"
                  y2="290"
                  stroke="var(--color-text-tertiary)"
                  strokeWidth="8"
                />
                <line
                  x1="268"
                  y1="290"
                  x2="232"
                  y2="408"
                  stroke="var(--color-text-tertiary)"
                  strokeWidth="8"
                />
                <line
                  x1="232"
                  y1="408"
                  x2="218"
                  y2="438"
                  stroke="var(--color-text-tertiary)"
                  strokeWidth="6"
                />
              </g>

              {/* Active (recommended) leg */}
              <g strokeLinecap="round">
                {/* Torso */}
                <line
                  x1="180"
                  y1="160"
                  x2="278"
                  y2="190"
                  stroke="var(--color-text-secondary)"
                  strokeWidth="9"
                  opacity="0.85"
                />
                {/* Femur */}
                <line
                  x1="278"
                  y1="190"
                  x2="345"
                  y2="335"
                  stroke="var(--color-text-primary)"
                  strokeWidth="11"
                />
                {/* Tibia */}
                <line
                  x1="345"
                  y1="335"
                  x2="380"
                  y2="445"
                  stroke="var(--color-text-primary)"
                  strokeWidth="11"
                />
                {/* Foot */}
                <line
                  x1="380"
                  y1="445"
                  x2="350"
                  y2="475"
                  stroke="var(--color-text-primary)"
                  strokeWidth="8"
                />
              </g>

              {/* Joint dots */}
              <circle
                cx="278"
                cy="190"
                r="9"
                fill="var(--color-bg-surface)"
                stroke="var(--color-text-primary)"
                strokeWidth="2"
              />
              {/* Knee — flagged amber/red for out-of-range; using danger token */}
              <circle
                cx="345"
                cy="335"
                r="11"
                fill="var(--color-bg-surface)"
                stroke="var(--color-danger)"
                strokeWidth="2.5"
              />
              <circle
                cx="380"
                cy="445"
                r="8"
                fill="var(--color-bg-surface)"
                stroke="var(--color-text-primary)"
                strokeWidth="2"
              />
              <circle cx="290" cy="400" r="6" fill="var(--color-text-primary)" />

              {/* Saddle */}
              <ellipse
                cx="278"
                cy="180"
                rx="22"
                ry="6"
                fill="var(--color-accent)"
              />

              {/* Knee angle annotation */}
              <text
                x="375"
                y="320"
                fontFamily="var(--font-geist-mono, monospace)"
                fontSize="16"
                fontWeight="500"
                fill="var(--color-danger)"
              >
                34°
              </text>
              <text
                x="375"
                y="338"
                fontFamily="var(--font-geist-sans, system-ui)"
                fontSize="11"
                fill="var(--color-text-tertiary)"
              >
                knee · BDC
              </text>

              {/* Saddle delta annotation */}
              <g>
                <line
                  x1="180"
                  y1="180"
                  x2="180"
                  y2="208"
                  stroke="var(--color-accent)"
                  strokeWidth="1.5"
                />
                <path
                  d="M180 178 L176 186 L184 186 Z"
                  fill="var(--color-accent)"
                />
                <text
                  x="140"
                  y="200"
                  fontFamily="var(--font-geist-mono, monospace)"
                  fontSize="13"
                  fill="var(--color-accent)"
                  fontWeight="500"
                >
                  +1.5 cm
                </text>
              </g>

              {/* Hip angle */}
              <text
                x="232"
                y="172"
                fontFamily="var(--font-geist-mono, monospace)"
                fontSize="13"
                fill="var(--color-text-secondary)"
              >
                67°
              </text>
              <text
                x="232"
                y="186"
                fontFamily="var(--font-geist-sans, system-ui)"
                fontSize="10"
                fill="var(--color-text-tertiary)"
              >
                hip
              </text>
            </svg>

            {/* Floating metric chips */}
            <MetricChip
              label="gross η"
              value="23.4%"
              tone="success"
              style={{ top: "20%", left: "-2%" }}
            />
            <MetricChip
              label="knee at BDC"
              value="34°"
              tone="neutral"
              style={{ bottom: "28%", right: "-4%" }}
            />
            <MetricChip
              label="cadence"
              value="88 rpm"
              tone="neutral"
              style={{ bottom: "8%", left: "8%" }}
            />
          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────── USE CASES */}
      <section id="use" style={css.section}>
        <div style={css.container}>
          <div style={css.sectionHead}>
            <div>
              <Eyebrow>Use Pedalwise to…</Eyebrow>
              <h2
                style={{
                  fontSize: 36,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  fontWeight: 600,
                  margin: "12px 0 0",
                  maxWidth: "18ch",
                }}
              >
                Three jobs the simulator does well.
              </h2>
            </div>
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: 16,
                lineHeight: 1.65,
                margin: 0,
                maxWidth: "48ch",
              }}
            >
              Every screen is built around a decision somebody has to make.
              Below: the three workflows Pedalwise was designed to make faster
              and more honest — from a first-time saddle-height question to a
              full pedal-force diagnostic.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
          >
            {/* Card 1: Fit tuning */}
            <TaskCard
              accentBg="linear-gradient(180deg, var(--color-accent-light), var(--color-bg-alt))"
              title="Set saddle height, crank length and cadence with evidence."
              body="Move any anatomy, fit or goal slider and watch the rest update in real time — joint angles, gross efficiency, knee flexion at BDC and the gear ratio that delivers your target speed."
              items={[
                "Presets at 5′4″, 5′9″, 6′2″ — or enter custom femur, tibia, foot, mass and fast-twitch %",
                "Holmes knee-range check (25–45° at BDC) flags out-of-range setups",
                "Efficiency-vs-cadence chart marks your point against the optimum",
                "Sensitivity strip: η per ±5 mm of crank, saddle or setback",
              ]}
              testId="task-card-saddle"
            >
              <FitTuningVis />
            </TaskCard>

            {/* Card 2: Diagnostic + report */}
            <TaskCard
              accentBg="linear-gradient(180deg, var(--color-warn-bg), var(--color-bg-alt))"
              title="Run a fit session, leave with a printable summary."
              body="Switch to Diagnostic mode and the simulator overlays pedal-force vectors, polar effectiveness, and a ranked list of detected issues for the current configuration."
              items={[
                "Tangential vs radial pedal-force vectors at every crank angle",
                "Polar IE plot against the trained-rider band (0.55–0.75)",
                "Hip / knee / ankle joint-power contribution",
                "Detected-issues list ranked by severity",
                "One-page printable bike-fit report",
              ]}
              testId="task-card-diagnostic"
            >
              <DiagnosticVis />
            </TaskCard>

            {/* Card 3: Kinematic model */}
            <TaskCard
              accentBg="linear-gradient(180deg, var(--color-success-bg), var(--color-bg-alt))"
              title="Inspect the kinematic model, compare against an optimum."
              body="One closed-form drivetrain identity binds speed, cadence and gear ratio. Pin any two, watch the third resolve. The optimizer returns a recommendation with a 95% confidence interval."
              items={[
                "Sagittal kinematics + closed-form efficiency model",
                "Speed · cadence · gear triangle — pin any two, solve the third",
                "Three live charts: knee flexion, crank torque (L / R / sum), η vs cadence",
                "Optimizer recommendation with 95% CI on every parameter",
              ]}
              testId="task-card-model"
            >
              <KinematicVis />
            </TaskCard>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────── VIEW MODES */}
      <section id="how" style={css.sectionAlt}>
        <div style={css.container}>
          <div style={css.sectionHead}>
            <div>
              <Eyebrow>Three view modes</Eyebrow>
              <h2
                style={{
                  fontSize: 36,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  fontWeight: 600,
                  margin: "12px 0 0",
                }}
              >
                The same simulation, drawn three ways.
              </h2>
            </div>
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: 16,
                lineHeight: 1.65,
                margin: 0,
                maxWidth: "48ch",
              }}
            >
              The kinematics never change. The rendering layer does. Start in
              Anatomical for the day-to-day. Switch to Diagnostic when something
              feels off; pull up Realistic when you want to present.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
          >
            <ModeCard
              name="Anatomical"
              meta="default · rider"
              description="Articulated segments. Joint dots. Angle labels at hip, knee, ankle. Reach envelope as a faint dashed circle. Nothing decorative — every mark is in service of a fit decision."
            >
              <AnatomicalPreviewSvg />
            </ModeCard>
            <ModeCard
              name="Diagnostic"
              meta="fitters &amp; engineers"
              description="Pedal force decomposition (tangential vs radial). Polar effectiveness plot. Joint power stack (hip / knee / ankle %). Detected-issue list ranked by severity."
            >
              <DiagnosticPreviewSvg />
            </ModeCard>
            <ModeCard
              name="Realistic"
              meta="presentation"
              description="Filled silhouette with helmet, motion-blur trail, large HUD. Same kinematic solution — lit for a presentation screen, not a calibration screen."
              darkBg
            >
              <RealisticPreviewSvg />
            </ModeCard>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────── SCIENCE */}
      <section id="science" style={css.section}>
        <div style={css.container}>
          <div style={css.sectionHead}>
            <div>
              <Eyebrow>The model</Eyebrow>
              <h2
                style={{
                  fontSize: 36,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  fontWeight: 600,
                  margin: "12px 0 0",
                }}
              >
                One equation makes the trade-off real.
              </h2>
            </div>
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: 16,
                lineHeight: 1.65,
                margin: 0,
                maxWidth: "48ch",
              }}
            >
              Speed, cadence and gear ratio are bound by a single closed-form
              relationship. Pin any two, the third is determined. The triangle
              widget lets you watch it work.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 40,
              alignItems: "start",
            }}
          >
            {/* Equation card */}
            <div
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border-default)",
                borderRadius: 14,
                padding: 32,
              }}
            >
              <div className="section-label">Drivetrain identity</div>
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  color: "var(--color-text-primary)",
                  textAlign: "center",
                  padding: "32px 0",
                  borderTop: "1px solid var(--color-border-default)",
                  borderBottom: "1px solid var(--color-border-default)",
                  margin: "20px 0",
                  fontStyle: "italic",
                }}
              >
                <em
                  style={{
                    fontStyle: "italic",
                    color: "var(--color-accent)",
                  }}
                >
                  v
                </em>{" "}
                = (
                <em style={{ fontStyle: "italic", color: "var(--color-accent)" }}>
                  n
                </em>
                /60) ·{" "}
                <em style={{ fontStyle: "italic", color: "var(--color-accent)" }}>
                  G
                </em>{" "}
                · π ·{" "}
                <em style={{ fontStyle: "italic", color: "var(--color-accent)" }}>
                  D
                </em>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px 20px",
                  fontSize: 13,
                  color: "var(--color-text-secondary)",
                  marginTop: 16,
                }}
              >
                {[
                  ["v", "road speed (m/s)"],
                  ["n", "cadence (rpm)"],
                  ["G", "gear ratio (front / rear)"],
                  ["D", "wheel diameter (m)"],
                ].map(([variable, label]) => (
                  <div key={variable}>
                    <span
                      style={{
                        fontStyle: "italic",
                        color: "var(--color-accent)",
                        fontWeight: 500,
                        marginRight: 6,
                      }}
                    >
                      {variable}
                    </span>
                    {label}
                  </div>
                ))}
              </div>
              <p
                style={{
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: "1px solid var(--color-border-default)",
                  fontSize: 13,
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: 0,
                }}
              >
                The metabolic-cost model layers on top — sensitive to cadence,
                knee flexion at BDC, and the fast-twitch fraction.
                Inverse-kinematics + Hill-type approximation, not a full
                musculoskeletal solver.
              </p>
            </div>

            {/* Science points */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                {
                  n: "01",
                  h: "Kinematics, then biomechanics",
                  p: "Inverse-kinematics solves the leg pose at every crank angle. Joint angles feed a closed-form efficiency model — gross η, IE, joint power share — in <16 ms per frame.",
                },
                {
                  n: "02",
                  h: "Optimization is a dialogue",
                  p: "The optimizer runs in a Web Worker so the UI keeps animating. Results render as a ghost overlay — current at 25% opacity, optimum at 100%. You apply it, or you don't.",
                },
                {
                  n: "03",
                  h: "Reduced motion, first-class",
                  p: "If your OS requests reduced motion, the pedal stroke freezes until you press play. Numbers still update — they're the instrument; the animation is the metaphor.",
                },
              ].map(({ n, h, p }) => (
                <div
                  key={n}
                  style={{
                    paddingBottom: 20,
                    borderBottom: "1px solid var(--color-border-default)",
                  }}
                >
                  <h4
                    style={{
                      fontSize: 16,
                      margin: "0 0 6px",
                      fontWeight: 600,
                      letterSpacing: "-0.005em",
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: 14,
                        color: "var(--color-accent)",
                        fontWeight: 500,
                        marginRight: 12,
                      }}
                    >
                      {n}
                    </span>
                    {h}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--color-text-secondary)",
                      lineHeight: 1.65,
                    }}
                  >
                    {p}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────── OPTIMIZER */}
      <section id="optimizer" style={css.sectionAlt}>
        <div style={css.container}>
          <div style={css.sectionHead}>
            <div>
              <Eyebrow>The optimizer</Eyebrow>
              <h2
                style={{
                  fontSize: 36,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  fontWeight: 600,
                  margin: "12px 0 0",
                }}
              >
                Suggested, never silently applied.
              </h2>
            </div>
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: 16,
                lineHeight: 1.65,
                margin: 0,
                maxWidth: "48ch",
              }}
            >
              Press{" "}
              <code
                className="mono"
                style={{ color: "var(--color-text-primary)" }}
              >
                Find optimal fit
              </code>{" "}
              and a recommendation appears beside your current configuration,
              drawn as a ghost. Apply it, or move on. You stay in control.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "5fr 4fr",
              gap: 40,
              alignItems: "center",
            }}
          >
            {/* Optimizer frame — ghost overlay illustration */}
            <div
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border-default)",
                borderRadius: 14,
                padding: 24,
                position: "relative",
              }}
            >
              <div className="section-label">
                Sagittal · cross-fade to optimum
              </div>
              <svg
                viewBox="0 0 520 320"
                style={{ marginTop: 16, width: "100%", display: "block" }}
                aria-label="Ghost overlay: current fit at 25% opacity alongside the recommended fit at full opacity"
              >
                <defs>
                  <pattern
                    id="opt-grid"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M20 0H0V20"
                      fill="none"
                      stroke="var(--color-border-default)"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect
                  width="520"
                  height="320"
                  fill="url(#opt-grid)"
                  rx="6"
                />
                <circle
                  cx="280"
                  cy="225"
                  r="70"
                  fill="none"
                  stroke="var(--color-border-strong)"
                  strokeDasharray="3 4"
                />
                {/* Ghost (current) */}
                <g
                  opacity="0.25"
                  stroke="var(--color-text-tertiary)"
                  strokeWidth="9"
                  strokeLinecap="round"
                >
                  <line x1="275" y1="100" x2="295" y2="195" />
                  <line x1="295" y1="195" x2="290" y2="290" />
                </g>
                {/* Optimum */}
                <g
                  stroke="var(--color-text-primary)"
                  strokeWidth="10"
                  strokeLinecap="round"
                >
                  <line x1="270" y1="85" x2="310" y2="190" />
                  <line x1="310" y1="190" x2="320" y2="290" />
                </g>
                <ellipse
                  cx="270"
                  cy="80"
                  rx="22"
                  ry="5"
                  fill="var(--color-accent)"
                />
                {/* Saddle delta arrow */}
                <g
                  stroke="var(--color-accent)"
                  strokeWidth="1.5"
                  fill="none"
                >
                  <line x1="200" y1="100" x2="200" y2="130" />
                  <path
                    d="M196 98 L200 90 L204 98 Z"
                    fill="var(--color-accent)"
                  />
                </g>
                <text
                  x="170"
                  y="122"
                  fontFamily="var(--font-geist-mono, monospace)"
                  fontSize="14"
                  fill="var(--color-accent)"
                  fontWeight="500"
                >
                  +1.5 cm
                </text>
                {/* Knee annotations */}
                <text
                  x="335"
                  y="190"
                  fontFamily="var(--font-geist-mono, monospace)"
                  fontSize="14"
                  fill="var(--color-accent)"
                  fontWeight="500"
                >
                  34°
                </text>
                <text
                  x="335"
                  y="206"
                  fontFamily="var(--font-geist-sans, system-ui)"
                  fontSize="10"
                  fill="var(--color-text-tertiary)"
                >
                  optimum
                </text>
                <text
                  x="335"
                  y="225"
                  fontFamily="var(--font-geist-mono, monospace)"
                  fontSize="13"
                  fill="var(--color-text-tertiary)"
                >
                  42°
                </text>
                <text
                  x="335"
                  y="240"
                  fontFamily="var(--font-geist-sans, system-ui)"
                  fontSize="10"
                  fill="var(--color-text-tertiary)"
                >
                  current (ghost)
                </text>
                <circle
                  cx="295"
                  cy="195"
                  r="6"
                  fill="var(--color-bg-surface)"
                  stroke="var(--color-text-tertiary)"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
                <circle
                  cx="310"
                  cy="190"
                  r="7"
                  fill="var(--color-bg-surface)"
                  stroke="var(--color-danger)"
                  strokeWidth="2"
                />
              </svg>
              {/* Legend */}
              <div
                className="mono"
                style={{
                  display: "flex",
                  gap: 16,
                  fontSize: 12,
                  color: "var(--color-text-tertiary)",
                  marginTop: 12,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 18,
                      height: 2,
                      background: "var(--color-text-tertiary)",
                      opacity: 0.4,
                      display: "inline-block",
                    }}
                  />
                  current
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 18,
                      height: 2,
                      background: "var(--color-text-primary)",
                      display: "inline-block",
                    }}
                  />
                  optimum
                </span>
                <span style={{ marginLeft: "auto", fontStyle: "italic" }}>
                  1.0 s cross-fade
                </span>
              </div>
            </div>

            {/* Optimizer summary */}
            <div style={{ padding: 20 }}>
              <div className="section-label">Optimizer found</div>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 600,
                  color: "var(--color-success)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  marginTop: 8,
                }}
              >
                +3.2%
              </div>
              <div
                style={{
                  color: "var(--color-text-secondary)",
                  marginTop: 8,
                  fontSize: 14,
                }}
              >
                efficiency vs current configuration
              </div>

              <table
                style={{
                  marginTop: 24,
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    {["Parameter", "Current", "Optimum", "Δ"].map((h) => (
                      <th
                        key={h}
                        className="mono"
                        style={{
                          padding: "0 0 8px",
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "var(--color-text-tertiary)",
                          fontWeight: 500,
                          textAlign: h === "Parameter" ? "left" : "right",
                          borderBottom: "1px solid var(--color-border-strong)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Saddle height", "72.0 cm", "73.5 cm", "+1.5 cm"],
                    ["Crank length", "175 mm", "172.5 mm", "−2.5 mm"],
                    ["Cadence", "95 rpm", "88 rpm", "−7 rpm"],
                    ["Gear (52×17)", "3.06", "3.06", "unchanged"],
                  ].map(([param, cur, opt, delta]) => (
                    <tr key={param}>
                      <td
                        style={{
                          padding: "10px 0",
                          fontSize: 13,
                          color: "var(--color-text-secondary)",
                          borderBottom: "1px solid var(--color-border-default)",
                          textAlign: "left",
                        }}
                      >
                        {param}
                      </td>
                      <td
                        className="mono"
                        style={{
                          padding: "10px 0",
                          fontSize: 13,
                          color: "var(--color-text-tertiary)",
                          borderBottom: "1px solid var(--color-border-default)",
                          textAlign: "right",
                        }}
                      >
                        {cur}
                      </td>
                      <td
                        className="mono"
                        style={{
                          padding: "10px 0",
                          fontSize: 13,
                          color: "var(--color-text-primary)",
                          borderBottom: "1px solid var(--color-border-default)",
                          textAlign: "right",
                        }}
                      >
                        {opt}
                      </td>
                      <td
                        className="mono"
                        style={{
                          padding: "10px 0",
                          fontSize: 13,
                          fontWeight: delta === "unchanged" ? 400 : 500,
                          color:
                            delta === "unchanged"
                              ? "var(--color-text-tertiary)"
                              : "var(--color-success)",
                          borderBottom: "1px solid var(--color-border-default)",
                          textAlign: "right",
                        }}
                      >
                        {delta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div
                style={{ display: "flex", gap: 12, marginTop: 28 }}
                role="group"
                aria-label="Optimizer actions"
              >
                <PrimaryLink href="/" testId="opt-apply">
                  Apply to simulation
                </PrimaryLink>
                <GhostLink href="/" testId="opt-dismiss">
                  Dismiss
                </GhostLink>
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--color-text-tertiary)",
                  marginTop: 16,
                }}
              >
                95% CI · saddle ±0.8 cm · crank ±2.1 mm · cadence ±3 rpm
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────── CLOSING CTA */}
      <section
        style={{
          padding: "96px 0",
          background:
            "radial-gradient(60% 90% at 80% 30%, oklch(0.945 0.038 230 / 0.45), transparent 60%), radial-gradient(50% 80% at 15% 80%, oklch(0.955 0.040 60 / 0.3), transparent 60%), var(--color-bg-app)",
        }}
      >
        <div style={css.container}>
          <div
            style={{
              textAlign: "center",
              maxWidth: 720,
              margin: "0 auto",
              padding: "32px 0",
            }}
          >
            <div className="section-label" style={{ marginBottom: 18 }}>
              Try it
            </div>
            <h2
              style={{
                fontSize: "clamp(36px, 4.5vw, 56px)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                margin: "0 0 20px",
              }}
            >
              Move a slider. Watch the trade-off.
            </h2>
            <p
              style={{
                fontSize: 18,
                color: "var(--color-text-secondary)",
                margin: "0 0 32px",
                lineHeight: 1.65,
              }}
            >
              Pedalwise runs in the browser, free, no account required for the
              simulator. Bring your numbers — or use the 5′4″, 5′9″, 6′2″ presets.
            </p>
            <div
              style={{ display: "inline-flex", gap: 12 }}
            >
              <PrimaryLink href="/" size="lg" testId="closing-open-simulator">
                Open the simulator
                <ArrowRight />
              </PrimaryLink>
              <GhostLink href="/" size="lg" testId="closing-redesign">
                See the redesign canvas
              </GhostLink>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────── FOOTER */}
      <footer
        style={{
          padding: "32px 0 40px",
          color: "var(--color-text-tertiary)",
          fontSize: 13,
          borderTop: "1px solid var(--color-border-default)",
        }}
        role="contentinfo"
      >
        <div
          style={{
            ...css.container,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div
            style={{ display: "flex", gap: 12, alignItems: "center" }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 30% 30%, var(--color-accent-light), var(--color-accent-dark) 70%)",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span className="mono">
              Pedalwise · v1.1 · sagittal-plane bike-fit simulator
            </span>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              ["Documentation", "#"],
              ["Methodology", "#"],
              ["Privacy", "#"],
              ["GitHub", "#"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                style={{
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-components
═══════════════════════════════════════════════════════════════════════════ */

/* ── Floating metric chip ──────────────────────────────────────────────── */
function MetricChip({
  label,
  value,
  tone,
  style,
}: {
  label: string;
  value: string;
  tone: "success" | "neutral";
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="mono"
      style={{
        position: "absolute",
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-default)",
        borderRadius: 10,
        padding: "10px 12px",
        boxShadow:
          "0 1px 3px oklch(0.16 0.04 255 / 0.08), 0 1px 2px oklch(0.16 0.04 255 / 0.04)",
        minWidth: 110,
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-geist-sans, system-ui)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-text-tertiary)",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 500,
          color:
            tone === "success"
              ? "var(--color-success)"
              : "var(--color-text-primary)",
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* ── Task card (use-cases section) ─────────────────────────────────────── */
function TaskCard({
  accentBg,
  title,
  body,
  items,
  children,
  testId,
}: {
  accentBg: string;
  title: string;
  body: string;
  items: string[];
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      style={{
        position: "relative",
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-default)",
        borderRadius: 14,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Illustration area */}
      <div
        style={{
          height: 160,
          margin: "-24px -24px 20px",
          borderBottom: "1px solid var(--color-border-default)",
          background: accentBg,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {children}
      </div>

      <h3
        style={{
          fontSize: 20,
          fontWeight: 600,
          margin: "0 0 8px",
          letterSpacing: "-0.01em",
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: "var(--color-text-secondary)",
          margin: "0 0 20px",
          lineHeight: 1.65,
          flex: 1,
        }}
      >
        {body}
      </p>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "0 0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {items.map((item) => (
          <li
            key={item}
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              lineHeight: 1.4,
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 14,
                height: 1,
                background: "var(--color-accent)",
                marginTop: 9,
                display: "inline-block",
              }}
            />
            {item}
          </li>
        ))}
      </ul>

      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 14,
          fontWeight: 500,
          color: "var(--color-accent)",
          textDecoration: "none",
        }}
      >
        Open the simulator
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}

/* ── Mode card (how-it-works section) ──────────────────────────────────── */
function ModeCard({
  name,
  meta,
  description,
  children,
  darkBg = false,
}: {
  name: string;
  meta: string;
  description: string;
  children: React.ReactNode;
  darkBg?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-default)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "20px 20px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          {name}
        </h4>
        <span
          style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}
          dangerouslySetInnerHTML={{ __html: meta }}
        />
      </div>
      <div
        style={{
          margin: "16px 0 0",
          height: 220,
          background: darkBg ? "var(--color-text-primary)" : "var(--color-bg-alt)",
          borderTop: "1px solid var(--color-border-default)",
          borderBottom: "1px solid var(--color-border-default)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
      <div
        style={{
          padding: 20,
          fontSize: 14,
          color: "var(--color-text-secondary)",
          lineHeight: 1.65,
        }}
      >
        {description}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Illustration SVGs (inlined, aria-hidden — purely visual decoration)
═══════════════════════════════════════════════════════════════════════════ */

function FitTuningVis() {
  return (
    <svg
      viewBox="0 0 400 160"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <pattern id="u1" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M20 0H0V20"
            fill="none"
            stroke="var(--color-border-default)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="400" height="160" fill="url(#u1)" />
      <circle
        cx="210"
        cy="110"
        r="36"
        fill="none"
        stroke="var(--color-border-strong)"
        strokeDasharray="3 4"
      />
      <line
        x1="170"
        y1="30"
        x2="205"
        y2="38"
        stroke="var(--color-text-secondary)"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <line
        x1="205"
        y1="38"
        x2="230"
        y2="95"
        stroke="var(--color-text-primary)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <line
        x1="230"
        y1="95"
        x2="250"
        y2="140"
        stroke="var(--color-text-primary)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle
        cx="205"
        cy="38"
        r="4"
        fill="var(--color-bg-surface)"
        stroke="var(--color-text-primary)"
        strokeWidth="1.5"
      />
      <circle
        cx="230"
        cy="95"
        r="6"
        fill="var(--color-bg-surface)"
        stroke="var(--color-danger)"
        strokeWidth="2"
      />
      <ellipse cx="205" cy="34" rx="12" ry="3" fill="var(--color-accent)" />
      <text
        x="248"
        y="92"
        fontFamily="var(--font-geist-mono, monospace)"
        fontSize="11"
        fill="var(--color-danger)"
        fontWeight="500"
      >
        34°
      </text>
      <text
        x="248"
        y="106"
        fontFamily="var(--font-geist-sans, system-ui)"
        fontSize="9"
        fill="var(--color-text-tertiary)"
      >
        knee · BDC
      </text>
      <rect
        x="24"
        y="108"
        width="126"
        height="12"
        fill="var(--color-success)"
        opacity="0.18"
        rx="3"
      />
      <line
        x1="60"
        y1="108"
        x2="60"
        y2="120"
        stroke="var(--color-success)"
        strokeWidth="2"
      />
      <text
        x="24"
        y="104"
        fontFamily="var(--font-geist-sans, system-ui)"
        fontSize="8"
        fill="var(--color-text-tertiary)"
      >
        Holmes range 25–45°
      </text>
    </svg>
  );
}

function DiagnosticVis() {
  return (
    <svg
      viewBox="0 0 400 160"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <pattern id="u2" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M20 0H0V20"
            fill="none"
            stroke="var(--color-border-default)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="400" height="160" fill="url(#u2)" />
      <circle
        cx="210"
        cy="100"
        r="40"
        fill="none"
        stroke="var(--color-border-strong)"
        strokeDasharray="3 4"
      />
      <circle cx="210" cy="60" r="10" fill="var(--color-danger)" opacity="0.10" />
      <circle cx="210" cy="140" r="10" fill="var(--color-danger)" opacity="0.10" />
      <text
        x="210"
        y="63"
        textAnchor="middle"
        fontFamily="var(--font-geist-sans, system-ui)"
        fontSize="8"
        fill="var(--color-danger)"
        fontWeight="500"
      >
        TDC
      </text>
      <text
        x="210"
        y="143"
        textAnchor="middle"
        fontFamily="var(--font-geist-sans, system-ui)"
        fontSize="8"
        fill="var(--color-danger)"
        fontWeight="500"
      >
        BDC
      </text>
      <line
        x1="205"
        y1="30"
        x2="230"
        y2="95"
        stroke="var(--color-text-primary)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line
        x1="230"
        y1="95"
        x2="250"
        y2="140"
        stroke="var(--color-text-primary)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <g stroke="var(--color-success)" strokeWidth="2.5">
        <line x1="250" y1="140" x2="295" y2="134" />
        <path
          d="M295 134 L287 130 L287 138 Z"
          fill="var(--color-success)"
          stroke="none"
        />
      </g>
      <g
        stroke="var(--color-text-tertiary)"
        strokeWidth="2"
        strokeDasharray="3 3"
      >
        <line x1="250" y1="140" x2="268" y2="116" />
      </g>
    </svg>
  );
}

function KinematicVis() {
  return (
    <svg
      viewBox="0 0 400 160"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <pattern id="u3" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M20 0H0V20"
            fill="none"
            stroke="var(--color-border-default)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="400" height="160" fill="url(#u3)" />
      <path
        d="M 20 140 Q 100 30 200 30 Q 300 30 380 110"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
      />
      <path
        d="M 20 140 Q 100 30 200 30 Q 300 30 380 110 L 380 160 L 20 160 Z"
        fill="var(--color-accent-light)"
        opacity="0.4"
      />
      <line
        x1="200"
        y1="24"
        x2="200"
        y2="148"
        stroke="var(--color-success)"
        strokeDasharray="3 3"
      />
      <circle cx="200" cy="30" r="5" fill="var(--color-success)" />
      <text
        x="210"
        y="26"
        fontFamily="var(--font-geist-sans, system-ui)"
        fontSize="10"
        fill="var(--color-success)"
        fontWeight="500"
      >
        optimum
      </text>
      <circle cx="232" cy="40" r="5" fill="var(--color-danger)" />
      <text
        x="242"
        y="36"
        fontFamily="var(--font-geist-mono, monospace)"
        fontSize="10"
        fill="var(--color-text-secondary)"
      >
        22.1%
      </text>
      <text
        x="20"
        y="154"
        fontFamily="var(--font-geist-mono, monospace)"
        fontSize="9"
        fill="var(--color-text-tertiary)"
      >
        50 rpm
      </text>
      <text
        x="360"
        y="154"
        fontFamily="var(--font-geist-mono, monospace)"
        fontSize="9"
        fill="var(--color-text-tertiary)"
      >
        130 rpm
      </text>
    </svg>
  );
}

function AnatomicalPreviewSvg() {
  return (
    <svg
      viewBox="0 0 400 220"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <pattern id="ag" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M20 0H0V20"
            fill="none"
            stroke="var(--color-border-default)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="400" height="220" fill="url(#ag)" />
      <circle
        cx="200"
        cy="150"
        r="55"
        fill="none"
        stroke="var(--color-border-strong)"
        strokeDasharray="3 4"
      />
      <line
        x1="195"
        y1="65"
        x2="225"
        y2="135"
        stroke="var(--color-text-primary)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <line
        x1="225"
        y1="135"
        x2="245"
        y2="200"
        stroke="var(--color-text-primary)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <line
        x1="245"
        y1="200"
        x2="230"
        y2="208"
        stroke="var(--color-text-primary)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line
        x1="130"
        y1="48"
        x2="195"
        y2="65"
        stroke="var(--color-text-secondary)"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle
        cx="195"
        cy="65"
        r="5"
        fill="var(--color-bg-surface)"
        stroke="var(--color-text-primary)"
        strokeWidth="1.5"
      />
      <circle
        cx="225"
        cy="135"
        r="6"
        fill="var(--color-bg-surface)"
        stroke="var(--color-danger)"
        strokeWidth="2"
      />
      <circle
        cx="245"
        cy="200"
        r="4"
        fill="var(--color-bg-surface)"
        stroke="var(--color-text-primary)"
        strokeWidth="1.5"
      />
      <circle cx="200" cy="150" r="3" fill="var(--color-text-primary)" />
      <ellipse cx="195" cy="60" rx="14" ry="3" fill="var(--color-accent)" />
      <text
        x="245"
        y="125"
        fontFamily="var(--font-geist-mono, monospace)"
        fontSize="11"
        fill="var(--color-danger)"
        fontWeight="500"
      >
        34°
      </text>
      <text
        x="155"
        y="62"
        fontFamily="var(--font-geist-mono, monospace)"
        fontSize="10"
        fill="var(--color-text-secondary)"
      >
        67°
      </text>
    </svg>
  );
}

function DiagnosticPreviewSvg() {
  return (
    <svg
      viewBox="0 0 400 220"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <pattern id="dg" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M20 0H0V20"
            fill="none"
            stroke="var(--color-border-default)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="400" height="220" fill="url(#dg)" />
      <circle
        cx="200"
        cy="150"
        r="55"
        fill="none"
        stroke="var(--color-border-strong)"
        strokeDasharray="3 4"
      />
      <circle cx="200" cy="95" r="14" fill="var(--color-danger)" opacity="0.10" />
      <circle
        cx="200"
        cy="205"
        r="14"
        fill="var(--color-danger)"
        opacity="0.10"
      />
      <text
        x="200"
        y="98"
        textAnchor="middle"
        fontFamily="var(--font-geist-sans, system-ui)"
        fontSize="9"
        fill="var(--color-danger)"
        fontWeight="500"
      >
        TDC
      </text>
      <text
        x="200"
        y="208"
        textAnchor="middle"
        fontFamily="var(--font-geist-sans, system-ui)"
        fontSize="9"
        fill="var(--color-danger)"
        fontWeight="500"
      >
        BDC
      </text>
      <line
        x1="195"
        y1="65"
        x2="225"
        y2="135"
        stroke="var(--color-text-primary)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line
        x1="225"
        y1="135"
        x2="245"
        y2="200"
        stroke="var(--color-text-primary)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <g stroke="var(--color-success)" strokeWidth="2.5">
        <line x1="245" y1="200" x2="285" y2="195" />
        <path
          d="M285 195 L278 192 L278 198 Z"
          fill="var(--color-success)"
          stroke="none"
        />
      </g>
      <g
        stroke="var(--color-text-tertiary)"
        strokeWidth="2"
        strokeDasharray="3 3"
      >
        <line x1="245" y1="200" x2="263" y2="178" />
      </g>
      <circle
        cx="245"
        cy="200"
        r="4"
        fill="var(--color-bg-surface)"
        stroke="var(--color-text-primary)"
        strokeWidth="1.5"
      />
      <circle cx="200" cy="150" r="3" fill="var(--color-text-primary)" />
    </svg>
  );
}

function RealisticPreviewSvg() {
  return (
    <svg
      viewBox="0 0 400 220"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden="true"
    >
      {/* Filled silhouette on dark background */}
      <path
        d="M 145 35 Q 170 30 195 50 L 240 130 L 260 200 L 240 210 L 220 200 L 205 140 L 175 75 L 145 60 Z"
        fill="var(--color-bg-alt)"
        opacity="0.95"
      />
      {/* Helmet */}
      <path
        d="M 138 30 Q 160 14 188 22 Q 195 32 192 42 Q 175 44 155 50 Q 142 50 138 38 Z"
        fill="var(--color-bg-alt)"
        opacity="0.95"
      />
      {/* Motion trail */}
      <g opacity="0.35">
        <path
          d="M 50 130 L 150 130"
          stroke="var(--color-bg-alt)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="2 6"
        />
        <path
          d="M 60 150 L 145 150"
          stroke="var(--color-bg-alt)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2 6"
        />
      </g>
      {/* HUD */}
      <text
        x="20"
        y="34"
        fontFamily="var(--font-geist-mono, monospace)"
        fontSize="22"
        fill="var(--color-bg-alt)"
        fontWeight="500"
      >
        30
      </text>
      <text
        x="58"
        y="34"
        fontFamily="var(--font-geist-sans, system-ui)"
        fontSize="11"
        fill="var(--color-border-strong)"
      >
        km/h
      </text>
      <text
        x="20"
        y="200"
        fontFamily="var(--font-geist-mono, monospace)"
        fontSize="22"
        fill="var(--color-warn)"
        fontWeight="500"
      >
        23.4%
      </text>
      <text
        x="20"
        y="214"
        fontFamily="var(--font-geist-sans, system-ui)"
        fontSize="10"
        fill="var(--color-border-strong)"
      >
        gross η
      </text>
    </svg>
  );
}
