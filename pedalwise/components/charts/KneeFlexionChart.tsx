"use client";

import { useMemo } from "react";
import type { Config } from "@/lib/types";
import { computeFrame } from "@/lib/kinematics";
import { ChartFrame } from "./ChartFrame";

const W = 400;
const H = 160;
const PAD = { l: 30, r: 8, t: 12, b: 20 };

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
      // Convert "kneeAngle" (interior angle) into "flexion" (180 - interior),
      // i.e. 0° = straight leg, larger = more bent.
      const flex = 180 - f.right.kneeAngle;
      out.push({ theta: t, knee: flex });
    }
    return out;
  }, [config]);

  const yMin = 0, yMax = 130;
  const x = (theta: number) => PAD.l + (theta / (Math.PI * 2)) * (W - PAD.l - PAD.r);
  const y = (knee: number) => PAD.t + (1 - (knee - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  const path = samples
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.theta).toFixed(1)} ${y(p.knee).toFixed(1)}`)
    .join(" ");

  // Holmes band (25–45 deg knee flexion at BDC). Render as a horizontal band.
  const bandTop = y(45);
  const bandBot = y(25);

  // Current position dot
  const curFrame = computeFrame(config, crankAngle);
  const curFlex = 180 - curFrame.right.kneeAngle;

  return (
    <ChartFrame title="Knee flexion" subtitle="across one revolution">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
        {/* Holmes band */}
        <rect
          x={PAD.l} y={bandTop} width={W - PAD.l - PAD.r} height={bandBot - bandTop}
          fill="var(--color-success-bg)"
        />
        {/* Axes */}
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--color-border-default)" strokeWidth={1} />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="var(--color-border-default)" strokeWidth={1} />
        {/* Curve */}
        <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth={1.5} />
        {/* Current position */}
        <circle cx={x(crankAngle)} cy={y(curFlex)} r={4} fill="var(--color-danger)" />
        {/* X labels */}
        {[0, 90, 180, 270, 360].map((deg) => (
          <text
            key={deg}
            x={x((deg / 360) * Math.PI * 2)}
            y={H - 6}
            textAnchor="middle"
            fontSize={10}
            fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace"
            fill="var(--color-text-tertiary)"
          >
            {deg}°
          </text>
        ))}
        {/* Y labels */}
        {[0, 45, 90, 130].map((v) => (
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
      </svg>
    </ChartFrame>
  );
}
