/// <reference lib="webworker" />
import { computeMetrics } from "@/lib/_compose";
import type { Config } from "@/lib/types";
import type {
  SweepAxis,
  SweepMeasure,
  SweepRequest,
  SweepResult,
  SweepWorkerIn,
  SweepWorkerOut,
} from "@/lib/sweep";

// ---------------------------------------------------------------------------
// Grid helpers
// ---------------------------------------------------------------------------

/**
 * Build a linear sequence of values for one axis.
 * If step > (max − min), returns a single-element array at min.
 */
function buildAxisValues(axis: SweepAxis): { values: number[]; degenerate: boolean } {
  const range = axis.max - axis.min;
  if (axis.step > range || range <= 0) {
    return { values: [axis.min], degenerate: true };
  }
  const count = Math.floor(range / axis.step) + 1;
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    // Round to avoid floating-point drift accumulating across many steps.
    values.push(Math.round((axis.min + i * axis.step) * 1e6) / 1e6);
  }
  return { values, degenerate: false };
}

/**
 * Extract the scalar measure from Metrics returned by computeMetrics.
 */
function extractMeasure(metrics: ReturnType<typeof computeMetrics>, measure: SweepMeasure): number {
  if (metrics.geometryImpossible) return NaN;
  switch (measure) {
    case "grossEfficiency": return metrics.grossEfficiency;
    case "metabolicCost":   return metrics.metabolicCost;
    case "ie":              return metrics.ie;
    case "kneeAtBDC":       return metrics.kneeAtBDC;
    case "power":           return metrics.power;
  }
}

/**
 * Determine the "best" index in values[] for the given measure.
 *  - grossEfficiency / ie / power  → argmax
 *  - metabolicCost                 → argmin
 *  - kneeAtBDC                     → argmin |x − 35|  (mid Holmes 25–45°)
 * Returns -1 if all cells are NaN.
 */
function findOptimumIndex(values: Float32Array, measure: SweepMeasure): number {
  let bestIdx = -1;
  let bestScore = NaN;

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) continue;

    let score: number;
    switch (measure) {
      case "grossEfficiency":
      case "ie":
      case "power":
        score = v; // want max
        if (bestIdx === -1 || score > bestScore) { bestScore = score; bestIdx = i; }
        break;
      case "metabolicCost":
        score = -v; // want min
        if (bestIdx === -1 || score > bestScore) { bestScore = score; bestIdx = i; }
        break;
      case "kneeAtBDC":
        score = -Math.abs(v - 35); // want closest to 35°
        if (bestIdx === -1 || score > bestScore) { bestScore = score; bestIdx = i; }
        break;
    }
  }

  return bestIdx;
}

// ---------------------------------------------------------------------------
// Worker message handler
// ---------------------------------------------------------------------------

let cancelled = false;

self.onmessage = (e: MessageEvent<SweepWorkerIn>) => {
  const msg = e.data;

  if (msg.kind === "cancel") {
    cancelled = true;
    return;
  }

  if (msg.kind === "run") {
    cancelled = false;
    const { id, request } = msg;
    runSweep(id, request);
  }
};

function runSweep(id: number, request: SweepRequest): void {
  const t0 = performance.now();

  const { base, xAxis, yAxis, measure } = request;

  const { values: xValues, degenerate: xDegen } = buildAxisValues(xAxis);
  const { values: yValues, degenerate: yDegen } = buildAxisValues(yAxis);
  const degenerate = xDegen || yDegen;

  const cols = xValues.length;
  const rows = yValues.length;
  const cellCount = rows * cols;

  const grid = new Float32Array(cellCount);

  for (let r = 0; r < rows; r++) {
    if (cancelled) return; // honour cancel mid-sweep

    const y = yValues[r];

    for (let c = 0; c < cols; c++) {
      const x = xValues[c];

      let cellValue: number;
      try {
        // Build a per-cell config by spreading the field overrides over base.
        // Both axes may point to the same field — in that case the yAxis wins,
        // which is consistent (x and y are independent params).
        const cellCfg: Config = {
          ...base,
          [xAxis.field]: x,
          [yAxis.field]: y,
        };
        const metrics = computeMetrics(cellCfg);
        cellValue = extractMeasure(metrics, measure);
      } catch {
        // Any exception in a single cell must not crash the whole sweep.
        cellValue = NaN;
      }

      grid[r * cols + c] = cellValue;
    }
  }

  if (cancelled) return;

  const optimumIndex = findOptimumIndex(grid, measure);
  const computeMs = performance.now() - t0;

  const result: SweepResult = {
    request,
    xValues,
    yValues,
    values: grid,
    optimumIndex,
    computeMs,
    degenerate,
  };

  const out: SweepWorkerOut = { kind: "result", id, result };
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(out, [grid.buffer]);
}

export {};
