// Façade. Re-exports for back-compat. New code should import from the
// specific module (geometry, dynamics, metabolic, triangle).

export { computeFrame, gradeResistanceWatts } from "./geometry";
export { solveTriangle } from "./triangle";
export type { TriangleState, TriangleVar } from "./triangle";
export { computeMetrics } from "./_compose";
export { computeMetrics as evaluate } from "./_compose";
