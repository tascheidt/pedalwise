/// <reference lib="webworker" />
import type { Config } from "@/lib/types";
import { optimize } from "@/lib/optimizer";

self.onmessage = (e: MessageEvent<{ id: number; cfg: Config }>) => {
  const { id, cfg } = e.data;
  const t0 = performance.now();
  const rec = optimize(cfg);
  // Synthetic minimum ~250ms so the loading state is perceivable.
  const elapsed = performance.now() - t0;
  const delay = Math.max(0, 250 - elapsed);
  setTimeout(() => {
    (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, rec });
  }, delay);
};

export {};
