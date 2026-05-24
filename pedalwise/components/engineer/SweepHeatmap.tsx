"use client";

import { useMemo, useState } from "react";

import type { SweepMeasure, SweepResult } from "@/lib/sweep";

import { Badge } from "@/components/Badge";
import { SectionLabel } from "@/components/SectionLabel";

/* ------------------------------------------------------------------ */
/*  Color scale                                                       */
/*                                                                    */
/*  Principle 3: one accent + semantic. The scale ramps accent-light  */
/*  → accent → success at the high end; NaN cells are danger-tinted   */
/*  with a diagonal hatch so the eye reads them as "out of range".    */
/* ------------------------------------------------------------------ */

const RAMP = [
  "var(--color-accent-light)", // low
  "#bcd6ec",                   // accent-light → accent midpoint (token-derived)
  "var(--color-accent)",       // mid
  "#0e6e93",                   // accent → success midpoint
  "var(--color-success)",      // high
] as const;

function rampColor(t: number): string {
  // t ∈ [0, 1]; piecewise across RAMP.
  if (!Number.isFinite(t)) return "var(--color-danger-bg)";
  const clamped = Math.max(0, Math.min(1, t));
  const last = RAMP.length - 1;
  const idx = Math.min(last, Math.floor(clamped * last));
  return RAMP[idx];
}

/**
 * For "kneeAtBDC" — distance from 35° (mid-Holmes) drives color: near 35
 * is high, far is low. For everything else: higher raw value is "better"
 * for grossEfficiency / ie / power; for metabolicCost we invert.
 */
function normaliseForColor(
  v: number,
  min: number,
  max: number,
  measure: SweepMeasure,
): number {
  if (!Number.isFinite(v)) return NaN;
  if (max === min) return 0.5;
  switch (measure) {
    case "grossEfficiency":
    case "ie":
    case "power":
      return (v - min) / (max - min);
    case "metabolicCost":
      // Lower metabolic cost is better → invert.
      return 1 - (v - min) / (max - min);
    case "kneeAtBDC": {
      // Distance from 35° in the observed [min, max] band.
      const distNow = Math.abs(v - 35);
      const distMax = Math.max(Math.abs(min - 35), Math.abs(max - 35));
      if (distMax === 0) return 1;
      return 1 - distNow / distMax;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Format helpers                                                    */
/* ------------------------------------------------------------------ */

function fmtMeasure(v: number, measure: SweepMeasure): string {
  if (!Number.isFinite(v)) return "—";
  switch (measure) {
    case "grossEfficiency": return (v * 100).toFixed(2);  // % units
    case "ie":              return v.toFixed(3);
    case "metabolicCost":   return v.toFixed(0);
    case "kneeAtBDC":       return v.toFixed(1);
    case "power":           return v.toFixed(0);
  }
}

function measureUnit(measure: SweepMeasure): string {
  switch (measure) {
    case "grossEfficiency": return "%";
    case "ie":              return "";
    case "metabolicCost":   return "W";
    case "kneeAtBDC":       return "°";
    case "power":           return "W";
  }
}

function axisLabel(field: string): string {
  switch (field) {
    case "crankLength":   return "crank length (mm)";
    case "saddleHeight":  return "saddle height (cm)";
    case "saddleSetback": return "setback (cm)";
    case "cadence":       return "cadence (rpm)";
    case "targetSpeed":   return "target speed (km/h)";
    case "barDrop":       return "bar drop (cm)";
    case "cleatOffset":   return "cleat offset (cm)";
    case "roadGrade":     return "road grade (%)";
    default:              return field;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export type SweepHeatmapProps = {
  result: SweepResult | null;
  inFlight: boolean;
  error: string | null;
  /**
   * Called when the user clicks a cell. The page applies these field
   * overrides to the running simulator config.
   */
  onCellClick?: (overrides: Record<string, number>) => void;
};

export function SweepHeatmap({ result, inFlight, error, onCellClick }: SweepHeatmapProps) {
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);

  const stats = useMemo(() => {
    if (!result) return null;
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < result.values.length; i++) {
      const v = result.values[i];
      if (!Number.isFinite(v)) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (min === Infinity) return { min: NaN, max: NaN };
    return { min, max };
  }, [result]);

  if (error) {
    return (
      <div
        className="rounded-md p-4 mono"
        style={{
          background: "var(--color-danger-bg)",
          border: "1px solid var(--color-danger)",
          color: "var(--color-danger)",
          fontSize: 12,
        }}
        data-testid="sweep-error"
      >
        Sweep failed · {error}
      </div>
    );
  }

  if (inFlight) {
    return (
      <div
        className="rounded-md p-6 mono pw-pulse"
        style={{
          background: "var(--color-bg-alt)",
          border: "1px dashed var(--color-border-strong)",
          color: "var(--color-text-secondary)",
          fontSize: 12,
          textAlign: "center",
        }}
        data-testid="sweep-loading"
      >
        Running sweep in worker…
      </div>
    );
  }

  if (!result) {
    return (
      <div
        className="rounded-md p-6 mono"
        style={{
          background: "var(--color-bg-alt)",
          border: "1px dashed var(--color-border-default)",
          color: "var(--color-text-tertiary)",
          fontSize: 12,
          textAlign: "center",
        }}
      >
        No sweep yet. Pick two axes, press Run.
      </div>
    );
  }

  const { xValues, yValues, values, optimumIndex, request, degenerate, computeMs } = result;
  const cols = xValues.length;
  const rows = yValues.length;
  const measure = request.measure;
  const { min: vMin, max: vMax } = stats ?? { min: NaN, max: NaN };

  // SVG dims — cell is responsive via viewBox.
  const CELL_W = 44;
  const CELL_H = 36;
  const PAD_L = 60;
  const PAD_T = 14;
  const PAD_B = 22;
  const PAD_R = 14;
  const width  = PAD_L + cols * CELL_W + PAD_R;
  const height = PAD_T + rows * CELL_H + PAD_B;

  const hoveredCell = hover ? { r: hover.r, c: hover.c, v: values[hover.r * cols + hover.c] } : null;

  /** ARIA fallback: name min / max / optimum / cell count. */
  const ariaSummary = (() => {
    const cellCount = rows * cols;
    if (optimumIndex < 0) {
      return `Sweep heatmap, ${rows} by ${cols}. All ${cellCount} cells out of range.`;
    }
    const optR = Math.floor(optimumIndex / cols);
    const optC = optimumIndex % cols;
    return [
      `Sweep heatmap, ${rows} rows by ${cols} columns.`,
      `Measure ${measure}, range ${fmtMeasure(vMin, measure)} to ${fmtMeasure(vMax, measure)} ${measureUnit(measure)}.`,
      `Optimum at ${axisLabel(request.xAxis.field)} ${xValues[optC]}, ${axisLabel(request.yAxis.field)} ${yValues[optR]}.`,
    ].join(" ");
  })();

  return (
    <div className="flex flex-col gap-2" data-testid="sweep-heatmap">
      {/* Title + meta */}
      <div className="flex items-baseline justify-between">
        <SectionLabel>
          Sweep · {axisLabel(request.xAxis.field)} × {axisLabel(request.yAxis.field)} · color = {measure}
        </SectionLabel>
        <span className="mono" style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
          {rows}×{cols} · {computeMs.toFixed(0)} ms
        </span>
      </div>

      {degenerate && (
        <div data-testid="sweep-degenerate">
          <Badge tone="warn">step &gt; range — single cell shown</Badge>
        </div>
      )}

      {/* SVG heatmap */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "auto" }}
        role="img"
        aria-label={ariaSummary}
      >
        <defs>
          {/* Hatched pattern for NaN cells — pattern is reinforcement of the
              danger-bg fill so colorblind users still read "bad cell". */}
          <pattern id="sweep-nan-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="var(--color-danger-bg)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-danger)" strokeWidth="1" opacity="0.4" />
          </pattern>
        </defs>

        {/* Y-axis labels */}
        {yValues.map((y, r) => (
          <text
            key={`y-${r}`}
            x={PAD_L - 6}
            y={PAD_T + r * CELL_H + CELL_H / 2 + 3}
            fontFamily="var(--font-geist-mono), monospace"
            fontSize="10"
            fill="var(--color-text-tertiary)"
            textAnchor="end"
          >
            {Number(y).toFixed(1)}
          </text>
        ))}

        {/* Cells */}
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const idx = r * cols + c;
            const v = values[idx];
            const t = normaliseForColor(v, vMin, vMax, measure);
            const isOptimum = idx === optimumIndex;
            const isHovered = hover?.r === r && hover?.c === c;
            const isNaN_ = !Number.isFinite(v);

            const cx = PAD_L + c * CELL_W;
            const cy = PAD_T + r * CELL_H;

            return (
              <g key={`cell-${r}-${c}`}>
                <rect
                  x={cx + 1}
                  y={cy + 1}
                  width={CELL_W - 2}
                  height={CELL_H - 2}
                  rx={3}
                  fill={isNaN_ ? "url(#sweep-nan-hatch)" : rampColor(t)}
                  stroke={isHovered ? "var(--color-text-primary)" : "var(--color-bg-surface)"}
                  strokeWidth={isHovered ? 1.5 : 1}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHover({ r, c })}
                  onMouseLeave={() => setHover((h) => (h?.r === r && h?.c === c ? null : h))}
                  onClick={() => {
                    if (!onCellClick) return;
                    onCellClick({
                      [request.xAxis.field]: xValues[c],
                      [request.yAxis.field]: yValues[r],
                    });
                  }}
                  data-testid={`sweep-cell-${r}-${c}`}
                />
                {!isNaN_ && (
                  <text
                    x={cx + CELL_W / 2}
                    y={cy + CELL_H / 2 + 3}
                    textAnchor="middle"
                    fontFamily="var(--font-geist-mono), monospace"
                    fontSize="9"
                    fontWeight={isOptimum ? 600 : 400}
                    fill={t > 0.55 ? "white" : "var(--color-text-primary)"}
                    pointerEvents="none"
                  >
                    {fmtMeasure(v, measure)}
                  </text>
                )}
                {/* Optimum ring — color-independent reinforcement (principle 9). */}
                {isOptimum && (
                  <rect
                    x={cx + 0.5}
                    y={cy + 0.5}
                    width={CELL_W - 1}
                    height={CELL_H - 1}
                    rx={4}
                    fill="none"
                    stroke="var(--color-text-primary)"
                    strokeWidth={2}
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })
        )}

        {/* X-axis labels (under) */}
        {xValues.map((x, c) => (
          <text
            key={`x-${c}`}
            x={PAD_L + c * CELL_W + CELL_W / 2}
            y={height - 6}
            fontFamily="var(--font-geist-mono), monospace"
            fontSize="9"
            fill="var(--color-text-tertiary)"
            textAnchor="middle"
          >
            {Number(x).toFixed(1)}
          </text>
        ))}
      </svg>

      {/* Hover tooltip + legend row */}
      <div className="flex items-center justify-between">
        <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", minHeight: 16 }}>
          {hoveredCell ? (
            <>
              {axisLabel(request.xAxis.field)} = {Number(xValues[hoveredCell.c]).toFixed(2)} · {axisLabel(request.yAxis.field)} = {Number(yValues[hoveredCell.r]).toFixed(2)} · {measure} = {fmtMeasure(hoveredCell.v, measure)}{measureUnit(measure)}
              {hoveredCell.r * cols + hoveredCell.c === optimumIndex && " · optimum"}
            </>
          ) : (
            <span style={{ color: "var(--color-text-tertiary)" }}>Hover a cell for raw values · click to load it into the simulator.</span>
          )}
        </div>

        <Legend min={vMin} max={vMax} measure={measure} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Legend                                                            */
/* ------------------------------------------------------------------ */

function Legend({ min, max, measure }: { min: number; max: number; measure: SweepMeasure }) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return (
      <div className="mono" style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
        — no finite cells —
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 mono" style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
      <span>{fmtMeasure(min, measure)}</span>
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: 64,
          height: 8,
          borderRadius: 4,
          background: `linear-gradient(90deg, ${RAMP.join(", ")})`,
        }}
      />
      <span>{fmtMeasure(max, measure)} {measureUnit(measure)}</span>
    </div>
  );
}
