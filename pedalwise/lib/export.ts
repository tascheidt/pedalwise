/**
 * lib/export.ts — CSV and JSON exporters for the Engineer workspace (PW-104).
 *
 * Three exports:
 *   toJSON / fromJSON  — round-trip stable JSON for a SweepResult
 *   toCSV  / fromCSV   — spreadsheet-friendly matrix CSV for a SweepResult
 *   framesToCSV        — per-degree crank samples for a single Config
 *
 * Invariants preserved across all exporters:
 *   - Float32Array is serialised as a plain number[] so JSON.parse
 *     can rehydrate it without a custom reviver.
 *   - NaN cells are written as "" in CSV (not the string "NaN") to keep
 *     spreadsheet software happy; fromCSV treats "" as NaN.
 *   - Round-trip: fromJSON(toJSON(r)) deep-equals r; fromCSV(toCSV(r)) equals r.
 */

import type { Config } from "./types";
import type { SweepResult, SweepRequest } from "./sweep";
import { computeMetrics } from "./_compose";
import { computeFrame } from "./geometry";

// ---------------------------------------------------------------------------
// JSON round-trip
// ---------------------------------------------------------------------------

/** Serialisable representation of a SweepResult. */
type SweepResultJSON = Omit<SweepResult, "values"> & {
  /**
   * Float32 cells as a plain number[] (JSON has no typed-array notation).
   * NaN is serialised as null (JSON.stringify turns NaN → null automatically).
   */
  valuesArray: (number | null)[];
};

/**
 * Serialise a SweepResult to a JSON string.
 * Includes every field needed to reconstruct the identical plot.
 */
export function toJSON(result: SweepResult): string {
  const valuesArray: (number | null)[] = Array.from(result.values).map((v) =>
    Number.isFinite(v) ? v : null
  );

  const payload: SweepResultJSON = {
    request:       result.request,
    xValues:       result.xValues,
    yValues:       result.yValues,
    valuesArray,
    optimumIndex:  result.optimumIndex,
    computeMs:     result.computeMs,
    degenerate:    result.degenerate,
  };

  return JSON.stringify(payload);
}

/**
 * Deserialise a string produced by toJSON back to a SweepResult.
 * Throws if the string is malformed.
 */
export function fromJSON(s: string): SweepResult {
  const payload = JSON.parse(s) as SweepResultJSON;

  // Rehydrate null → NaN and build a Float32Array.
  const raw: number[] = payload.valuesArray.map((v) =>
    v === null || v === undefined ? NaN : (v as number)
  );
  const values = new Float32Array(raw);

  const result: SweepResult = {
    request:      payload.request as SweepRequest,
    xValues:      payload.xValues,
    yValues:      payload.yValues,
    values,
    optimumIndex: payload.optimumIndex,
    computeMs:    payload.computeMs,
    degenerate:   payload.degenerate,
  };

  return result;
}

// ---------------------------------------------------------------------------
// CSV round-trip
// ---------------------------------------------------------------------------

/**
 * Serialise a SweepResult to a CSV string.
 *
 * Layout:
 *   Row 0 (header): first cell = "y\\x" label, then x-axis values
 *   Rows 1..R:       first cell = y-axis value, then measure values
 *
 * NaN cells are written as "" (empty) — not "NaN" — for clean spreadsheet import.
 *
 * A metadata comment block at the top carries the full SweepRequest so that
 * fromCSV can reconstruct the SweepResult with request intact. Each metadata
 * line starts with "#".
 */
export function toCSV(result: SweepResult): string {
  const { xValues, yValues, values, optimumIndex, computeMs, degenerate, request } = result;
  const cols = xValues.length;
  const rows = yValues.length;

  const lines: string[] = [];

  // ---- Metadata block (survives round-trip; fromCSV re-reads it) -----------
  lines.push(`# pedalwise-sweep-v1`);
  lines.push(`# request=${JSON.stringify(request)}`);
  lines.push(`# optimumIndex=${optimumIndex}`);
  lines.push(`# computeMs=${computeMs}`);
  lines.push(`# degenerate=${degenerate}`);

  // ---- Header row ----------------------------------------------------------
  const headerCells = [`y\\x`, ...xValues.map(String)];
  lines.push(headerCells.join(","));

  // ---- Data rows -----------------------------------------------------------
  for (let r = 0; r < rows; r++) {
    const cells: string[] = [String(yValues[r])];
    for (let c = 0; c < cols; c++) {
      const v = values[r * cols + c];
      cells.push(Number.isFinite(v) ? String(v) : "");
    }
    lines.push(cells.join(","));
  }

  return lines.join("\n");
}

/**
 * Deserialise a string produced by toCSV back to a SweepResult.
 * Treats empty cells as NaN.
 */
export function fromCSV(s: string): SweepResult {
  const allLines = s.split(/\r?\n/);

  // Parse metadata comments.
  let requestJson: string | null = null;
  let optimumIndex = -1;
  let computeMs = 0;
  let degenerate = false;

  const dataLines: string[] = [];
  for (const line of allLines) {
    if (line.startsWith("# request=")) {
      requestJson = line.slice("# request=".length);
    } else if (line.startsWith("# optimumIndex=")) {
      optimumIndex = parseInt(line.slice("# optimumIndex=".length), 10);
    } else if (line.startsWith("# computeMs=")) {
      computeMs = parseFloat(line.slice("# computeMs=".length));
    } else if (line.startsWith("# degenerate=")) {
      degenerate = line.slice("# degenerate=".length).trim() === "true";
    } else if (!line.startsWith("#") && line.trim() !== "") {
      dataLines.push(line);
    }
  }

  if (dataLines.length < 2) {
    throw new Error("fromCSV: too few data lines to reconstruct a SweepResult");
  }
  if (!requestJson) {
    throw new Error("fromCSV: missing # request= metadata line");
  }

  const request = JSON.parse(requestJson) as SweepRequest;

  // Header row: ["y\\x", x0, x1, ...]
  const headerCells = dataLines[0].split(",");
  const xValues = headerCells.slice(1).map(Number);

  const yValues: number[] = [];
  const rawValues: number[] = [];

  for (let r = 1; r < dataLines.length; r++) {
    const cells = dataLines[r].split(",");
    yValues.push(Number(cells[0]));
    for (let c = 0; c < xValues.length; c++) {
      const raw = cells[c + 1] ?? "";
      rawValues.push(raw.trim() === "" ? NaN : Number(raw));
    }
  }

  const values = new Float32Array(rawValues);

  return { request, xValues, yValues, values, optimumIndex, computeMs, degenerate };
}

// ---------------------------------------------------------------------------
// Frame-stream export
// ---------------------------------------------------------------------------

/**
 * Produce a per-degree crank-angle CSV for the rider described by config.
 *
 * Uses the 121 samples in metrics.curves (0..2π inclusive) and interpolates
 * to 360 rows (1° steps, angle_deg = 0..359).
 *
 * Header columns:
 *   angle_deg,
 *   hip_x, hip_y, knee_x, knee_y, ankle_x, ankle_y, pedal_x, pedal_y,
 *   f_tan_R, f_rad_R, f_tan_L, f_rad_L,
 *   joint_power_hip, joint_power_knee, joint_power_ankle
 *
 * All position units: cm (from computeFrame).
 * Force units: N (from StrokeCurves — tangential/radial pedal forces).
 * Power units: W.
 */
export function framesToCSV(config: Config): string {
  const metrics = computeMetrics(config);
  const { curves } = metrics;
  const N_SRC = curves.crankAngle.length; // 121

  const TAU = Math.PI * 2;

  /** Linear interpolation helper (wraps for the closed periodic curve). */
  function lerp(arr: number[], t: number): number {
    // t in [0, TAU]; map to [0, N_SRC-1].
    const frac = ((t % TAU) / TAU) * (N_SRC - 1);
    const lo = Math.floor(frac);
    const hi = Math.min(lo + 1, N_SRC - 1);
    const alpha = frac - lo;
    const vLo = arr[lo];
    const vHi = arr[hi];
    if (!Number.isFinite(vLo) || !Number.isFinite(vHi)) return NaN;
    return vLo + alpha * (vHi - vLo);
  }

  const header = [
    "angle_deg",
    "hip_x", "hip_y",
    "knee_x", "knee_y",
    "ankle_x", "ankle_y",
    "pedal_x", "pedal_y",
    "f_tan_R", "f_rad_R",
    "f_tan_L", "f_rad_L",
    "joint_power_hip", "joint_power_knee", "joint_power_ankle",
  ].join(",");

  const lines: string[] = [header];

  for (let deg = 0; deg < 360; deg++) {
    const theta = (deg / 360) * TAU;
    const frame = computeFrame(config, theta);
    const { right } = frame;

    // Interpolate force / power curves.
    const fTanR  = lerp(curves.tangentialR,    theta);
    const fRadR  = lerp(curves.radialR,         theta);
    const fTanL  = lerp(curves.tangentialL,    theta);
    const fRadL  = lerp(curves.radialL,         theta);
    const jpHip  = lerp(curves.jointPowerHip,   theta);
    const jpKnee = lerp(curves.jointPowerKnee,  theta);
    const jpAnkle= lerp(curves.jointPowerAnkle, theta);

    const fmt = (v: number) => Number.isFinite(v) ? v.toFixed(4) : "";

    lines.push([
      deg,
      fmt(right.hip.x),   fmt(right.hip.y),
      fmt(right.knee.x),  fmt(right.knee.y),
      fmt(right.ankle.x), fmt(right.ankle.y),
      fmt(right.pedal.x), fmt(right.pedal.y),
      fmt(fTanR),  fmt(fRadR),
      fmt(fTanL),  fmt(fRadL),
      fmt(jpHip),  fmt(jpKnee), fmt(jpAnkle),
    ].join(","));
  }

  return lines.join("\n");
}
