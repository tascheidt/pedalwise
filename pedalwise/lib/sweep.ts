"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Config } from "./types";

// ---------------------------------------------------------------------------
// Sweep types
// ---------------------------------------------------------------------------

/** Axis selector: which Config field varies, and over what range. */
export type SweepAxis = {
  /**
   * Enumerated Config field path. Keep this list explicit so the worker can
   * spread it directly into the base Config without eval/reflection.
   */
  field:
    | "saddleHeight"   // cm
    | "crankLength"    // mm
    | "saddleSetback"  // cm
    | "cadence"        // rpm
    | "barDrop"        // cm
    | "cleatOffset"    // cm
    | "targetSpeed"    // km/h
    | "roadGrade";     // %
  min: number;
  max: number;
  step: number;
};

/** Output measure plotted in the heatmap cell. */
export type SweepMeasure =
  | "grossEfficiency"
  | "metabolicCost"
  | "ie"
  | "kneeAtBDC"
  | "power";

export type SweepRequest = {
  base: Config;
  xAxis: SweepAxis;
  yAxis: SweepAxis;
  measure: SweepMeasure;
};

export type SweepResult = {
  request: SweepRequest;
  /** Length = cols (xAxis samples). */
  xValues: number[];
  /** Length = rows (yAxis samples). */
  yValues: number[];
  /**
   * Float32Array, row-major: values[r * cols + c] = measure at (xValues[c], yValues[r]).
   * NaN for geometryImpossible cells.
   */
  values: Float32Array;
  /**
   * Index into values of the best cell: argmax for grossEfficiency / ie / power;
   * argmin for metabolicCost; argmin of |x − 35| for kneeAtBDC.
   * -1 when all cells are NaN.
   */
  optimumIndex: number;
  /** Wall-clock milliseconds the worker spent computing. */
  computeMs: number;
  /**
   * True when step > (max − min) on either axis, making the effective grid
   * a single cell. A warning toast should be shown to the user.
   */
  degenerate: boolean;
};

// ---------------------------------------------------------------------------
// Worker message protocol
// ---------------------------------------------------------------------------

export type SweepWorkerIn =
  | { kind: "run"; id: number; request: SweepRequest }
  | { kind: "cancel" };

export type SweepWorkerOut =
  | { kind: "result"; id: number; result: SweepResult }
  | { kind: "error"; id: number; message: string };

// ---------------------------------------------------------------------------
// useSweep hook
// ---------------------------------------------------------------------------

type SweepState = {
  result: SweepResult | null;
  inFlight: boolean;
  error: string | null;
};

/**
 * React hook — fire-and-forget; latest request wins.
 * Spins up the sweep worker once; posts run/cancel messages.
 */
export function useSweep(): {
  result: SweepResult | null;
  inFlight: boolean;
  error: string | null;
  run: (req: SweepRequest) => void;
  cancel: () => void;
} {
  const [state, setState] = useState<SweepState>({
    result: null,
    inFlight: false,
    error: null,
  });

  const workerRef = useRef<Worker | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    let w: Worker | null = null;
    try {
      w = new Worker(
        new URL("../app/worker/sweep.worker.ts", import.meta.url),
        { type: "module" }
      );

      w.onmessage = (e: MessageEvent<SweepWorkerOut>) => {
        const msg = e.data;
        if (msg.kind === "result") {
          if (msg.id === reqIdRef.current) {
            setState({ result: msg.result, inFlight: false, error: null });
          }
          // Older result from a superseded request — silently drop.
        } else if (msg.kind === "error") {
          if (msg.id === reqIdRef.current) {
            setState((prev) => ({
              ...prev,
              inFlight: false,
              error: msg.message,
            }));
          }
        }
      };

      w.onerror = (ev) => {
        setState((prev) => ({
          ...prev,
          inFlight: false,
          error: ev.message ?? "Sweep worker error",
        }));
      };

      workerRef.current = w;
    } catch {
      // Workers unavailable (SSR / test env) — caller will degrade gracefully.
      workerRef.current = null;
    }

    return () => {
      w?.terminate();
      workerRef.current = null;
    };
  }, []);

  const run = useCallback((req: SweepRequest) => {
    const id = ++reqIdRef.current;
    setState({ result: null, inFlight: true, error: null });

    if (workerRef.current) {
      const msg: SweepWorkerIn = { kind: "run", id, request: req };
      workerRef.current.postMessage(msg);
    } else {
      // Workers are unavailable in this environment (SSR, test).
      // Surface a clear error so V10 can show a degraded state.
      setState({
        result: null,
        inFlight: false,
        error: "Web Workers are not available in this environment.",
      });
    }
  }, []);

  const cancel = useCallback(() => {
    // Bump the request ID so any in-flight result is silently dropped.
    reqIdRef.current++;
    if (workerRef.current) {
      const msg: SweepWorkerIn = { kind: "cancel" };
      workerRef.current.postMessage(msg);
    }
    setState((prev) => ({ ...prev, inFlight: false }));
  }, []);

  return {
    result: state.result,
    inFlight: state.inFlight,
    error: state.error,
    run,
    cancel,
  };
}
