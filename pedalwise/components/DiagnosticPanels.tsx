"use client";

import type { Metrics, StrokeCurves } from "@/lib/types";
import { Badge } from "./Badge";
import { SectionLabel } from "./SectionLabel";

const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Linear interpolation of a 121-sample stroke curve at an arbitrary
 *  crank angle θ ∈ [0, 2π]. Wraps periodically. */
function interpCurve(values: number[], theta: number): number {
  const N = values.length;
  if (N === 0) return 0;
  const t = ((theta % TAU) + TAU) % TAU;
  // 121 samples cover [0, 2π] inclusive; spacing = TAU / (N-1).
  const f = (t / TAU) * (N - 1);
  const i0 = Math.floor(f) % (N - 1);
  const i1 = (i0 + 1) % (N - 1);
  const frac = f - Math.floor(f);
  return values[i0] * (1 - frac) + values[i1] * frac;
}

/** Color band by IE value, per Stream H biomech reference bands. */
function ieColor(ie: number): string {
  if (ie >= 0.55) return "var(--color-success)";
  if (ie >= 0.40) return "var(--color-warn)";
  return "var(--color-danger)";
}

/* ------------------------------------------------------------------ */
/*  Polar effectiveness                                               */
/* ------------------------------------------------------------------ */

function PolarEffectiveness({
  curves,
  ieRight,
  ieLeft,
  lrBalance,
  crankAngle,
}: {
  curves: StrokeCurves;
  ieRight: number;
  ieLeft: number;
  lrBalance: number;
  crankAngle: number;
}) {
  const cx = 100, cy = 100;
  const rMin = 10;
  const rMax = 80;

  // Per-revolution normaliser: max |F_total| across BOTH legs so the two
  // lobes share a scale. Use the same |F| metric the IE integral uses.
  let fNorm = 1e-6;
  const N = curves.crankAngle.length;
  for (let i = 0; i < N; i++) {
    const fR = Math.hypot(curves.tangentialR[i], curves.radialR[i]);
    const fL = Math.hypot(curves.tangentialL[i], curves.radialL[i]);
    if (fR > fNorm) fNorm = fR;
    if (fL > fNorm) fNorm = fL;
  }

  // The R curve indexes against the right crank angle (θ_R = θ).
  // The L curve was sampled at θ_L = θ_R + π in dynamics; the array index i
  // therefore corresponds to θ_R[i] = i · 2π / (N-1) for BOTH legs, but at
  // that moment the LEFT pedal is at the diametrically opposite point on
  // the crank circle. To draw the L lobe in its actual angular position
  // we rotate its samples by π.
  const polarPath = (tan: number[], rotate: boolean): string => {
    const pts: string[] = [];
    for (let i = 0; i < N; i++) {
      const theta = (i / (N - 1)) * TAU + (rotate ? Math.PI : 0);
      const fTan = Math.max(0, tan[i]);
      const r = rMin + (rMax - rMin) * (fTan / fNorm);
      const x = cx + Math.sin(theta) * r;
      const y = cy - Math.cos(theta) * r;
      pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    pts.push("Z");
    return pts.join(" ");
  };

  const rPath = polarPath(curves.tangentialR, false);
  const lPath = polarPath(curves.tangentialL, true);

  // Current-angle dot: which leg is active in the current half?
  // Right leg is active over θ ∈ [0, π); left leg active over [π, 2π).
  const tNorm = ((crankAngle % TAU) + TAU) % TAU;
  const rightActive = tNorm < Math.PI;
  const dotTan = rightActive
    ? interpCurve(curves.tangentialR, tNorm)
    : interpCurve(curves.tangentialL, tNorm - Math.PI);
  const dotR = rMin + (rMax - rMin) * Math.max(0, dotTan) / fNorm;
  const dotX = cx + Math.sin(tNorm) * dotR;
  const dotY = cy - Math.cos(tNorm) * dotR;
  const dotColor = rightActive ? "var(--color-accent)" : "var(--color-chart-left)";

  // IE reference band: 0.55–0.75 ring (faint annulus).
  const rBand0 = rMin + (rMax - rMin) * 0.55;
  const rBand1 = rMin + (rMax - rMin) * 0.75;

  const lrR = Math.round(lrBalance * 1000) / 10;       // % right
  const lrL = Math.round((1 - lrBalance) * 1000) / 10; // % left

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <SectionLabel>Polar effectiveness</SectionLabel>
      </div>
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 200 200" width={200} height={160}>
          {/* IE reference band — annulus 0.55..0.75 of fNorm */}
          <circle cx={cx} cy={cy} r={rBand1} stroke="var(--color-border-default)" strokeWidth={1} fill="none" strokeDasharray="1 4" />
          <circle cx={cx} cy={cy} r={rBand0} stroke="var(--color-border-default)" strokeWidth={1} fill="none" strokeDasharray="1 4" />
          {/* Outer ring + half-ring grid */}
          <circle cx={cx} cy={cy} r={rMax + 5} stroke="var(--color-border-default)" strokeWidth={1} fill="none" />
          <circle cx={cx} cy={cy} r={(rMax + 5) / 2} stroke="var(--color-border-default)" strokeWidth={1} fill="none" strokeDasharray="2 3" />
          <line x1={cx} y1={20} x2={cx} y2={180} stroke="var(--color-border-default)" strokeWidth={1} strokeDasharray="2 3" />
          <line x1={20} y1={cy} x2={180} y2={cy} stroke="var(--color-border-default)" strokeWidth={1} strokeDasharray="2 3" />
          {/* Left lobe — drawn first so right lobe sits on top */}
          <path d={lPath} fill="var(--color-chart-left)" fillOpacity={0.25} stroke="var(--color-chart-left)" strokeWidth={1.25} />
          {/* Right lobe */}
          <path d={rPath} fill="var(--color-accent)" fillOpacity={0.35} stroke="var(--color-accent)" strokeWidth={1.25} />
          {/* Current angle dot */}
          <circle cx={dotX} cy={dotY} r={4} fill={dotColor} stroke="var(--color-bg-surface)" strokeWidth={1.25} />
          {/* Labels */}
          <text x={cx} y={14} textAnchor="middle" fontSize={10} fill="var(--color-text-tertiary)"
                fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace">TDC</text>
          <text x={cx} y={196} textAnchor="middle" fontSize={10} fill="var(--color-text-tertiary)"
                fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace">BDC</text>
          <text x={188} y={cy + 3} textAnchor="end" fontSize={10} fill="var(--color-text-tertiary)"
                fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace">3</text>
          <text x={12} y={cy + 3} textAnchor="start" fontSize={10} fill="var(--color-text-tertiary)"
                fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace">9</text>
        </svg>
        <div className="flex flex-col gap-1">
          <div className="mono" style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)" }}>
            IE
          </div>
          <div className="mono" style={{ fontSize: 14, fontWeight: 500 }}>
            <span style={{ color: "var(--color-text-tertiary)", marginRight: 4 }}>R</span>
            <span style={{ color: ieColor(ieRight) }}>{ieRight.toFixed(2)}</span>
            <span style={{ color: "var(--color-text-tertiary)", margin: "0 4px 0 10px" }}>L</span>
            <span style={{ color: ieColor(ieLeft) }}>{ieLeft.toFixed(2)}</span>
          </div>
          <div className="mono" style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginTop: 6 }}>
            L/R
          </div>
          <div className="mono" style={{ fontSize: 14, fontWeight: 500 }}>
            {lrL.toFixed(1)} / {lrR.toFixed(1)}
          </div>
          <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 6 }}>
            trained range 0.55–0.75
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Joint power stacked area                                          */
/* ------------------------------------------------------------------ */

function JointPower({
  curves,
  share,
}: {
  curves: StrokeCurves;
  share: { hip: number; knee: number; ankle: number };
}) {
  const W = 360, H = 100;

  // TODO(future): tokenize chart series colors (`--color-chart-hip` etc.).
  // For now these match the existing palette used elsewhere in the app.
  const HIP_COLOR = "#0F6E56";   // matches --color-success
  const KNEE_COLOR = "#185FA5";  // matches --color-accent
  const ANKLE_COLOR = "#D85A30"; // matches --color-chart-left

  const N = curves.crankAngle.length;

  // Power can be momentarily negative (eccentric phase). Stacked-area only
  // makes sense for non-negative heights, so use |power|.
  const hip = curves.jointPowerHip.map(Math.abs);
  const knee = curves.jointPowerKnee.map(Math.abs);
  const ankle = curves.jointPowerAnkle.map(Math.abs);

  // Stack (bottom → top): hip, knee, ankle.
  const stacked: number[][] = [hip, knee, ankle].map(() => new Array(N).fill(0));
  let yMax = 0;
  for (let i = 0; i < N; i++) {
    const a = hip[i];
    const b = a + knee[i];
    const c = b + ankle[i];
    stacked[0][i] = a;
    stacked[1][i] = b;
    stacked[2][i] = c;
    if (c > yMax) yMax = c;
  }
  yMax = yMax > 0 ? yMax * 1.05 : 1; // 5% headroom

  const px = (i: number) => (i / (N - 1)) * W;
  const py = (v: number) => H - (v / yMax) * (H - 6);

  function area(top: number[], bot: number[]) {
    const path: string[] = [`M ${px(0).toFixed(1)} ${py(bot[0]).toFixed(1)}`];
    for (let i = 0; i < N; i++) path.push(`L ${px(i).toFixed(1)} ${py(bot[i]).toFixed(1)}`);
    for (let i = N - 1; i >= 0; i--) path.push(`L ${px(i).toFixed(1)} ${py(top[i]).toFixed(1)}`);
    path.push("Z");
    return path.join(" ");
  }

  const layers = [
    { color: HIP_COLOR, top: stacked[0], bot: new Array(N).fill(0) },
    { color: KNEE_COLOR, top: stacked[1], bot: stacked[0] },
    { color: ANKLE_COLOR, top: stacked[2], bot: stacked[1] },
  ];

  return (
    <div className="flex flex-col gap-2">
      <SectionLabel>Joint power contribution</SectionLabel>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 110 }}>
        {layers.map((l, idx) => (
          <path key={idx} d={area(l.top, l.bot)} fill={l.color} opacity={0.55} />
        ))}
      </svg>
      <div className="flex gap-3 mono" style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>
        <LegendDot color={HIP_COLOR} label={`Hip ${Math.round(share.hip)}%`} />
        <LegendDot color={KNEE_COLOR} label={`Knee ${Math.round(share.knee)}%`} />
        <LegendDot color={ANKLE_COLOR} label={`Ankle ${Math.round(share.ankle)}%`} />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Detected issues — owned by Stream E, do not modify                */
/* ------------------------------------------------------------------ */

function DetectedIssues({ metrics }: { metrics: Metrics }) {
  type Issue = { tone: "info" | "warn" | "success" | "danger"; title: string; body: string };
  const issues: Issue[] = [];
  if (metrics.kneeAtBDC < 25)
    issues.push({ tone: "warn", title: `Knee at BDC: ${metrics.kneeAtBDC.toFixed(0)}°`, body: "Below Holmes range (25–45°). Raise saddle 0.5–1.5 cm and re-measure." });
  else if (metrics.kneeAtBDC > 45)
    issues.push({ tone: "warn", title: `Knee at BDC: ${metrics.kneeAtBDC.toFixed(0)}°`, body: "Above Holmes range (25–45°). Lower saddle 0.5–1.5 cm and re-measure." });
  else
    issues.push({ tone: "success", title: `Knee at BDC: ${metrics.kneeAtBDC.toFixed(0)}°`, body: "Inside Holmes range (25–45°)." });

  // Per-leg IE from real integrals (Stream B). Badge derives from L/R gap.
  const ieR = metrics.ieRight;
  const ieL = metrics.ieLeft;
  const ieGap = Math.abs(ieL - ieR);
  let ieTone: "success" | "warn" | "danger";
  let ieBadge: string;
  if (ieGap < 0.03) {
    ieTone = "success";
    ieBadge = "balanced";
  } else if (ieGap < 0.06) {
    ieTone = "warn";
    ieBadge = "minor asymmetry";
  } else {
    ieTone = "danger";
    ieBadge = "significant asymmetry";
  }
  issues.push({
    tone: ieTone,
    title: `IE asymmetry · ${ieBadge}`,
    body: `L ${ieL.toFixed(2)} · R ${ieR.toFixed(2)} · gap ${Math.abs(ieL - ieR).toFixed(2)}`,
  });

  const optDelta = Math.abs(metrics.cadence - metrics.optimumCadence);
  if (optDelta < 4)
    issues.push({ tone: "success", title: "Cadence at optimum", body: `${metrics.cadence} rpm matches your power target.` });
  else
    issues.push({ tone: "warn", title: "Cadence off optimum", body: `${metrics.cadence} rpm vs ${metrics.optimumCadence.toFixed(0)} rpm target.` });

  return (
    <div className="flex flex-col gap-2">
      <SectionLabel>Detected issues</SectionLabel>
      <div className="flex flex-col gap-2">
        {issues.map((iss, i) => (
          <div key={i} className="flex gap-2">
            <Badge tone={iss.tone}>{iss.tone === "success" ? "✓" : iss.tone === "warn" ? "!" : iss.tone === "danger" ? "×" : "i"}</Badge>
            <div className="flex flex-col">
              <div style={{ fontSize: 12, fontWeight: 500 }}>{iss.title}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{iss.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DiagnosticSidePanel({
  crankAngle, metrics,
}: {
  /** @deprecated kept for legacy call sites — derived from metrics.ie now. */
  ie?: number;
  crankAngle: number;
  /** @deprecated kept for legacy call sites — derived from metrics.jointShare. */
  share?: { hip: number; knee: number; ankle: number };
  metrics: Metrics;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[10px] p-4" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}>
        <PolarEffectiveness
          curves={metrics.curves}
          ieRight={metrics.ieRight}
          ieLeft={metrics.ieLeft}
          lrBalance={metrics.lrBalance}
          crankAngle={crankAngle}
        />
      </div>
      <div className="rounded-[10px] p-4" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}>
        <JointPower curves={metrics.curves} share={metrics.jointShare} />
      </div>
      <div className="rounded-[10px] p-4" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}>
        <DetectedIssues metrics={metrics} />
      </div>
    </div>
  );
}
