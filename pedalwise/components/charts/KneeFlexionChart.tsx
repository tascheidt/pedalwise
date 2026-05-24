"use client";

import { useMemo } from "react";
import type { Config } from "@/lib/types";
import { computeFrame } from "@/lib/kinematics";
import { ChartFrame } from "./ChartFrame";

const W = 400;
const H = 180;
const PAD = { l: 36, r: 80, t: 16, b: 26 };

// Holmes range: knee flexion at BDC should land here (deg).
const HOLMES_MIN = 25;
const HOLMES_MAX = 45;
// Safety ceiling at TDC (deg) — Bini/Tamborindeguy dynamic-fit literature.
const PEAK_CEILING = 110;

export function KneeFlexionChart({
  config,
  crankAngle,
}: {
  config: Config;
  crankAngle: number;
}) {
  const samples = useMemo(() => {
    const n = 121;
    const out: { theta: number; knee: number }[] = [];
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1)) * Math.PI * 2;
      const f = computeFrame(config, t);
      // "Flexion" = 0° straight, larger = more bent.
      out.push({ theta: t, knee: 180 - f.right.kneeAngle });
    }
    return out;
  }, [config]);

  // Auto-scale so the full curve is visible.
  const dataMin = Math.min(...samples.map((s) => s.knee));
  const dataMax = Math.max(...samples.map((s) => s.knee));
  const yMin = Math.max(0, Math.floor((dataMin - 10) / 15) * 15);
  const yMax = Math.ceil((Math.max(dataMax, PEAK_CEILING) + 10) / 15) * 15;

  const x = (theta: number) =>
    PAD.l + (theta / (Math.PI * 2)) * (W - PAD.l - PAD.r);
  const y = (knee: number) =>
    PAD.t + (1 - (knee - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  const path = samples
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.theta).toFixed(1)} ${y(p.knee).toFixed(1)}`)
    .join(" ");

  // BDC marker
  const bdcTheta = Math.PI;
  const bdcX = x(bdcTheta);
  const bdcFrame = computeFrame(config, bdcTheta);
  const bdcFlex = 180 - bdcFrame.right.kneeAngle;
  const bdcInRange = bdcFlex >= HOLMES_MIN && bdcFlex <= HOLMES_MAX;

  // Peak flexion at TDC
  const tdcFrame = computeFrame(config, 0);
  const tdcFlex = 180 - tdcFrame.right.kneeAngle;
  const peakOK = tdcFlex <= PEAK_CEILING;

  // Animated current-position dot
  const curFrame = computeFrame(config, crankAngle);
  const curFlex = 180 - curFrame.right.kneeAngle;

  // Pick nice y-axis tick marks
  const tickStep = yMax - yMin <= 90 ? 15 : 30;
  const ticks: number[] = [];
  for (let v = yMin; v <= yMax; v += tickStep) ticks.push(v);

  return (
    <ChartFrame title="Knee flexion" subtitle="across one revolution">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Holmes target zone — narrow box centered on BDC */}
        <rect
          x={bdcX - 26}
          y={y(HOLMES_MAX)}
          width={52}
          height={y(HOLMES_MIN) - y(HOLMES_MAX)}
          fill="var(--color-success-bg)"
          stroke="var(--color-success-border, var(--color-success-bg))"
          strokeWidth={1}
        />
        <text
          x={bdcX}
          y={y(HOLMES_MAX) - 4}
          textAnchor="middle"
          fontSize={9}
          fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace"
          fill="var(--color-text-tertiary)"
        >
          Holmes 25–45°
        </text>

        {/* TDC ceiling line — peak flexion shouldn't cross */}
        <line
          x1={PAD.l}
          x2={W - PAD.r}
          y1={y(PEAK_CEILING)}
          y2={y(PEAK_CEILING)}
          stroke="var(--color-text-tertiary)"
          strokeWidth={1}
          strokeDasharray="2 3"
          opacity={0.6}
        />
        <text
          x={W - PAD.r - 4}
          y={y(PEAK_CEILING) - 3}
          textAnchor="end"
          fontSize={9}
          fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace"
          fill="var(--color-text-tertiary)"
        >
          peak ceiling 110°
        </text>

        {/* BDC vertical guide */}
        <line
          x1={bdcX}
          x2={bdcX}
          y1={PAD.t}
          y2={H - PAD.b}
          stroke="var(--color-text-tertiary)"
          strokeWidth={1}
          strokeDasharray="1 3"
          opacity={0.4}
        />
        <text
          x={bdcX}
          y={H - PAD.b + 10}
          textAnchor="middle"
          fontSize={9}
          fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace"
          fill="var(--color-text-tertiary)"
        >
          BDC
        </text>

        {/* Axes */}
        <line
          x1={PAD.l}
          y1={H - PAD.b}
          x2={W - PAD.r}
          y2={H - PAD.b}
          stroke="var(--color-border-default)"
          strokeWidth={1}
        />
        <line
          x1={PAD.l}
          y1={PAD.t}
          x2={PAD.l}
          y2={H - PAD.b}
          stroke="var(--color-border-default)"
          strokeWidth={1}
        />

        {/* Curve */}
        <path
          d={path}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={1.5}
        />

        {/* BDC marker — semantic color based on in-range */}
        <circle
          cx={bdcX}
          cy={y(bdcFlex)}
          r={3.5}
          fill={bdcInRange ? "var(--color-success)" : "var(--color-warning)"}
          stroke="white"
          strokeWidth={1}
        />

        {/* Animated current-position dot */}
        <circle
          cx={x(crankAngle)}
          cy={y(curFlex)}
          r={4}
          fill="var(--color-danger)"
        />

        {/* X labels */}
        {[0, 90, 180, 270, 360].map((deg) => (
          <text
            key={deg}
            x={x((deg / 360) * Math.PI * 2)}
            y={H - 14}
            textAnchor="middle"
            fontSize={10}
            fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace"
            fill="var(--color-text-tertiary)"
          >
            {deg}°
          </text>
        ))}

        {/* Y labels (auto-tick) */}
        {ticks.map((v) => (
          <text
            key={v}
            x={PAD.l - 6}
            y={y(v) + 3}
            textAnchor="end"
            fontSize={10}
            fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace"
            fill="var(--color-text-tertiary)"
          >
            {v}°
          </text>
        ))}

        {/* Readout panel — right side */}
        <g transform={`translate(${W - PAD.r + 6}, ${PAD.t + 4})`}>
          <text
            x={0}
            y={0}
            fontSize={9}
            fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace"
            fill="var(--color-text-tertiary)"
          >
            BDC
          </text>
          <text
            x={0}
            y={14}
            fontSize={13}
            fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace"
            fontWeight={500}
            fill={bdcInRange ? "var(--color-success)" : "var(--color-warning)"}
          >
            {bdcFlex.toFixed(0)}°
          </text>
          <text
            x={0}
            y={36}
            fontSize={9}
            fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace"
            fill="var(--color-text-tertiary)"
          >
            Peak (TDC)
          </text>
          <text
            x={0}
            y={50}
            fontSize={13}
            fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace"
            fontWeight={500}
            fill={peakOK ? "var(--color-text-primary)" : "var(--color-warning)"}
          >
            {tdcFlex.toFixed(0)}°
          </text>
        </g>
      </svg>
    </ChartFrame>
  );
}
