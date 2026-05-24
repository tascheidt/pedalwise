"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Config, Recommendation } from "./types";
import { optimize } from "./optimizer";

type State =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "done"; rec: Recommendation }
  | { kind: "error"; message: string };

/**
 * Tries to run optimization in a Web Worker; falls back to the main thread
 * if Workers aren't available in this environment.
 */
export function useOptimizer() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const workerRef = useRef<Worker | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    let w: Worker | null = null;
    try {
      w = new Worker(new URL("../app/worker/optimizer.worker.ts", import.meta.url), {
        type: "module",
      });
      w.onmessage = (e: MessageEvent<{ id: number; rec: Recommendation }>) => {
        if (e.data.id === reqIdRef.current) {
          setState({ kind: "done", rec: e.data.rec });
        }
      };
      workerRef.current = w;
    } catch {
      workerRef.current = null;
    }
    return () => {
      w?.terminate();
      workerRef.current = null;
    };
  }, []);

  const run = useCallback((cfg: Config) => {
    setState({ kind: "running" });
    const id = ++reqIdRef.current;
    if (workerRef.current) {
      workerRef.current.postMessage({ id, cfg });
    } else {
      // Fallback: run on main thread, mimic 250 ms delay
      const t0 = performance.now();
      const rec = optimize(cfg);
      const wait = Math.max(0, 250 - (performance.now() - t0));
      setTimeout(() => {
        if (reqIdRef.current === id) setState({ kind: "done", rec });
      }, wait);
    }
  }, []);

  const clear = useCallback(() => setState({ kind: "idle" }), []);

  return { state, run, clear };
}
