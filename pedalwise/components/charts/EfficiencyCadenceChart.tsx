"use client";

import { useMemo } from "react";
import type { Config } from "@/lib/types";
import { evaluate } from "@/lib/kinematics";
import { gradeResistanceWatts } from "@/lib/geometry";
import { grossEfficiency, optimumCadence } from "@/lib/metabolic";
import { ChartFrame } from "./ChartFrame";

const W = 400;
const H = 160;
const PAD = { l: 32, r: 12, t: 12, b: 22 };

export function EfficiencyCadenceChart({ config }: { config: Config }) {
  const { path, opt, current } = useMemo(() => {
    const xMin = 50, xMax = 130;

    // Power demand is fixed by the goal (speed × grade × mass) — does not
    // depend on cadence. Compute it once, sweep cadence cheaply against the
    // closed-form GE(P, c, rider) (Stream C, S3a). 80× faster than running
    // a full inverse-dynamics evaluate() at every cadence sample.
    const power = gradeResistanceWatts(config.targetSpeed, config.roadGrade, config.mass);

    const samples: [number, number][] = [];
    for (let c = xMin; c <= xMax; c += 1) {
      samples.push([c, grossEfficiency(power, c, config)]);
    }

    // Optimum cadence is the closed-form maximum of the curve (S3a derivation).
    const optC = optimumCadence(power, config);
    const optE = grossEfficiency(power, optC, config);

    // The current dot still reflects the real, fully-composed efficiency
    // (includes kneeAlignmentPenalty etc) so the user sees their actual
    // operating point, not the idealized GE curve.
    const currentE = evaluate(config).grossEfficiency;

    const eMin = 0.05, eMax = 0.30;
    const x = (c: number) => PAD.l + ((c - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
    const y = (e: number) => PAD.t + (1 - (e - eMin) / (eMax - eMin)) * (H - PAD.t - PAD.b);
    const path = samples
      .map(([c, e], i) => `${i === 0 ? "M" : "L"} ${x(c).toFixed(1)} ${y(e).toFixed(1)}`)
      .join(" ");

    return {
      path,
      opt: { x: x(optC), y: y(optE), c: optC, e: optE },
      current: { x: x(config.cadence), y: y(currentE), c: config.cadence, e: currentE },
    };
  }, [config]);

  return (
    <ChartFrame title="Efficiency · cadence" subtitle="current vs optimum">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
        <line x1={PAD.l} y1={H - PAD.b} x2={W - 12} y2={H - PAD.b} stroke="var(--color-border-default)" strokeWidth={1} />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="var(--color-border-default)" strokeWidth={1} />
        <path d={path} fill="none" stroke="var(--color-success)" strokeWidth={2} />
        {/* Current cadence vertical line */}
        <line
          x1={current.x} x2={current.x}
          y1={H - PAD.b} y2={current.y}
          stroke="var(--color-danger)" strokeWidth={1} strokeDasharray="3 3" opacity={0.6}
        />
        <circle cx={current.x} cy={current.y} r={4} fill="var(--color-danger)" />
        {/* Optimum */}
        <circle cx={opt.x} cy={opt.y} r={4} fill="var(--color-success)" />
        <text x={opt.x} y={opt.y - 8} textAnchor="middle"
              fontSize={10}
              fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace"
              fill="var(--color-success)">
          optimum
        </text>
        {/* Axis labels */}
        {[50, 80, 110].map((c) => (
          <text key={c} x={PAD.l + ((c - 50) / 80) * (W - PAD.l - 12)} y={H - 6}
                textAnchor="middle" fontSize={10}
                fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace"
                fill="var(--color-text-tertiary)">
            {c}
          </text>
        ))}
        <text x={W - 4} y={H - 6} textAnchor="end" fontSize={10}
              fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace"
              fill="var(--color-text-tertiary)">rpm</text>
      </svg>
    </ChartFrame>
  );
}
