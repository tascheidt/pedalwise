import { WHEEL_DIAMETER_M } from "./presets";

/* ------------------------------------------------------------------ */
/*  Speed / cadence / gear triangle                                   */
/* ------------------------------------------------------------------ */

export type TriangleVar = "speed" | "cadence" | "gear";
export type TriangleState = {
  speed: number;    // km/h
  cadence: number;  // rpm
  gear: number;     // ratio
  pinned: [TriangleVar, TriangleVar];
};

export function solveTriangle(state: TriangleState): TriangleState {
  const wheelCircM = Math.PI * WHEEL_DIAMETER_M;
  const pinned = new Set(state.pinned);
  const solved = (["speed", "cadence", "gear"] as TriangleVar[]).find(
    (v) => !pinned.has(v),
  )!;
  const next = { ...state };
  if (solved === "speed") {
    next.speed = (state.cadence / 60) * state.gear * wheelCircM * 3.6;
  } else if (solved === "cadence") {
    next.cadence = ((state.speed / 3.6) * 60) / (state.gear * wheelCircM);
  } else {
    next.gear = (state.speed / 3.6) * 60 / (state.cadence * wheelCircM);
  }
  return next;
}
