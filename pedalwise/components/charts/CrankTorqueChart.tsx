"use client";

import { useMemo } from "react";
import type { Config, Metrics } from "@/lib/types";
import { ChartFrame } from "./ChartFrame";

const W = 400;
const H = 160;
const PAD = { l: 32, r: 8, t: 12, b: 26 };

export function CrankTorqueChart({
  config,
  metrics,
}: {
  config: Config;
  metrics: Metrics;
}) {
  const { rPath, lPath, sPath, yMax, yMin } = useMemo(() => {
    const curves = metrics.curves;
    const n = curves.crankAngle.length;
    const rCrankM = config.crankLength / 1000; // mm → m

    const torqueR = new Array<number>(n);
    const torqueL = new Array<number>(n);
    const torqueS = new Array<number>(n);

    // Left curve was sampled in "right-crank angle" coordinates (the L pedal
    // is π out of phase). Plotted against the RIGHT crank angle the chart
    // already shows the contribution of each leg over a full revolution,
    // which is what the original chart conveyed — keep that convention.
    let lo = 0, hi = 0;
    for (let i = 0; i < n; i++) {
      const r = (curves.tangentialR[i] ?? 0) * rCrankM;
      const l = (curves.tangentialL[i] ?? 0) * rCrankM;
      const s = r + l;
      torqueR[i] = r;
      torqueL[i] = l;
      torqueS[i] = s;
      if (r > hi) hi = r; if (r < lo) lo = r;
      if (l > hi) hi = l; if (l < lo) lo = l;
      if (s > hi) hi = s; if (s < lo) lo = s;
    }
    // Auto-scale Y with margin. Keep zero in view.
    const range = Math.max(Math.abs(hi), Math.abs(lo), 1);
    const yMax = range * 1.1;
    const yMin = lo < 0 ? -range * 0.4 : 0;

    const xFor = (i: number) => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
    const yFor = (v: number) =>
      PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);
    const toPath = (vals: number[]) =>
      vals
        .map((v, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(v).toFixed(1)}`)
        .join(" ");

    return {
      rPath: toPath(torqueR),
      lPath: toPath(torqueL),
      sPath: toPath(torqueS),
      yMax,
      yMin,
    };
  }, [config.crankLength, metrics.curves]);

  // Y-axis label values (3 ticks).
  const tickVals = [yMax, (yMax + yMin) / 2, yMin];
  const yScreen = (v: number) =>
    PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  return (
    <ChartFrame title="Crank torque" subtitle="left · right · sum · N·m"
      footer={
        <div className="flex gap-3 items-center mono" style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>
          <Legend color="var(--color-chart-right)" label="R" />
          <Legend color="var(--color-chart-left)"  label="L" />
          <Legend color="var(--color-chart-total)" label="sum" dashed />
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
        {/* X axis (at y = 0 if visible, else at bottom) */}
        {yMin <= 0 && yMax >= 0 && (
          <line x1={PAD.l} y1={yScreen(0)} x2={W - PAD.r} y2={yScreen(0)}
                stroke="var(--color-border-default)" strokeWidth={1} strokeDasharray="2 3" />
        )}
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--color-border-default)" strokeWidth={1} />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="var(--color-border-default)" strokeWidth={1} />
        {/* Y ticks */}
        {tickVals.map((v, i) => (
          <text key={i} x={PAD.l - 4} y={yScreen(v) + 3} textAnchor="end"
                fontSize={9}
                fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace"
                fill="var(--color-text-tertiary)">
            {v.toFixed(0)}
          </text>
        ))}
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
