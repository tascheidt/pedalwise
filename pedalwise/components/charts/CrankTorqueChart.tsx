"use client";

import { useMemo } from "react";
import { tangentialForceCurve } from "@/lib/kinematics";
import { ChartFrame } from "./ChartFrame";

const W = 400;
const H = 160;
const PAD = { l: 24, r: 8, t: 12, b: 26 };

export function CrankTorqueChart() {
  const { rPath, lPath, sPath } = useMemo(() => {
    const n = 121;
    const ptsR: [number, number][] = [];
    const ptsL: [number, number][] = [];
    const ptsS: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1)) * Math.PI * 2;
      const r = tangentialForceCurve(t);
      const l = tangentialForceCurve(t + Math.PI);
      const x = PAD.l + (t / (Math.PI * 2)) * (W - PAD.l - PAD.r);
      ptsR.push([x, r]);
      ptsL.push([x, l]);
      ptsS.push([x, r + l]);
    }
    const yMax = 2.0;
    const yFor = (v: number) => PAD.t + (1 - v / yMax) * (H - PAD.t - PAD.b);
    const toPath = (pts: [number, number][]) =>
      pts.map(([x, v], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${yFor(v).toFixed(1)}`).join(" ");
    return {
      rPath: toPath(ptsR),
      lPath: toPath(ptsL),
      sPath: toPath(ptsS),
    };
  }, []);

  return (
    <ChartFrame title="Crank torque" subtitle="left, right, total"
      footer={
        <div className="flex gap-3 items-center mono" style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>
          <Legend color="var(--color-chart-right)" label="R" />
          <Legend color="var(--color-chart-left)"  label="L" />
          <Legend color="var(--color-chart-total)" label="sum" dashed />
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--color-border-default)" strokeWidth={1} />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="var(--color-border-default)" strokeWidth={1} />
        <path d={rPath} fill="none" stroke="var(--color-chart-right)" strokeWidth={1.5} />
        <path d={lPath} fill="none" stroke="var(--color-chart-left)"  strokeWidth={1.5} />
        <path d={sPath} fill="none" stroke="var(--color-chart-total)" strokeWidth={1.5} strokeDasharray="4 3" />
        {[0, 90, 180, 270, 360].map((deg) => {
          const x = PAD.l + (deg / 360) * (W - PAD.l - PAD.r);
          return (
            <text key={deg} x={x} y={H - 10} textAnchor="middle"
                  fontSize={10}
                  fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace"
                  fill="var(--color-text-tertiary)">
              {deg}°
            </text>
          );
        })}
      </svg>
    </ChartFrame>
  );
}

function Legend({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <svg width={14} height={6}>
        <line x1={0} y1={3} x2={14} y2={3} stroke={color} strokeWidth={2} strokeDasharray={dashed ? "3 2" : undefined} />
      </svg>
      {label}
    </span>
  );
}
