import type { Config, Frame, LegPose, Metrics } from "./types";
import { WHEEL_DIAMETER_M } from "./presets";

const TAU = Math.PI * 2;
const DEG = 180 / Math.PI;

/* ------------------------------------------------------------------ */
/*  Geometry                                                          */
/* ------------------------------------------------------------------ */

/**
 * Solve a two-link planar arm reaching a target ankle point from the hip.
 * The two links are femur (hip→knee) and tibia (knee→ankle). The foot is
 * a separate rigid segment from ankle to pedal, modeled below.
 */
function solveLegIK(
  hip: { x: number; y: number },
  ankle: { x: number; y: number },
  femur: number,
  tibia: number,
  /** Knee bends "forward" (toward +x). */
  forwardKnee: boolean,
): { knee: { x: number; y: number }; reachable: boolean } {
  const dx = ankle.x - hip.x;
  const dy = ankle.y - hip.y;
  const d = Math.hypot(dx, dy);
  if (d > femur + tibia - 1e-6 || d < Math.abs(femur - tibia) + 1e-6) {
    // Degenerate: clamp to fully extended on the line
    const t = Math.min(1, femur / Math.max(d, 1e-6));
    return {
      knee: { x: hip.x + dx * t, y: hip.y + dy * t },
      reachable: false,
    };
  }
  const a = (femur * femur - tibia * tibia + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, femur * femur - a * a));
  const ux = dx / d;
  const uy = dy / d;
  // Perpendicular (rotate +90°)
  const px = -uy;
  const py = ux;
  const sign = forwardKnee ? 1 : -1;
  const kx = hip.x + ux * a + px * h * sign;
  const ky = hip.y + uy * a + py * h * sign;
  return { knee: { x: kx, y: ky }, reachable: true };
}

/**
 * The foot is rigidly attached to the pedal at the cleat (ball of foot).
 * For v1 we model the foot at a constant slight toe-down attitude in the
 * world frame — a coarse approximation of average ankling. Varying this
 * through the stroke would be a richer ankling model.
 */
const FOOT_TOE_DOWN_RAD = (8 * Math.PI) / 180;

function ankleFromPedal(
  pedal: { x: number; y: number },
  footLen: number,
): { x: number; y: number } {
  // Ankle sits behind (-x) and above (+y) the pedal axle by the foot length.
  return {
    x: pedal.x - Math.cos(FOOT_TOE_DOWN_RAD) * footLen,
    y: pedal.y + Math.sin(FOOT_TOE_DOWN_RAD) * footLen,
  };
}

/** Interior angle at vertex `b` in triangle a-b-c (deg). */
function interiorAngleDeg(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
): number {
  const v1x = a.x - b.x, v1y = a.y - b.y;
  const v2x = c.x - b.x, v2y = c.y - b.y;
  const n1 = Math.hypot(v1x, v1y) || 1e-9;
  const n2 = Math.hypot(v2x, v2y) || 1e-9;
  const cos = Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / (n1 * n2)));
  return Math.acos(cos) * DEG;
}

/**
 * Compute a single frame of the simulator at crank angle `theta` (rad).
 * Coordinate system: world cm, +x = forward (toward front of bike),
 * +y = up. Origin is bottom bracket.
 */
export function computeFrame(cfg: Config, theta: number): Frame {
  const crankCm = cfg.crankLength / 10;
  const setback = cfg.saddleSetback;
  // Saddle position relative to BB
  const sx = -setback;
  const sy = cfg.saddleHeight;

  // The hip is a small offset above the saddle nose. For our 2-link
  // (no-pelvis) model treat the hip as the saddle position.
  const hip = { x: sx, y: sy };

  // Pedal positions for both crank arms (right is the reference).
  // θ = 0 → TDC (pedal at +y); θ increases clockwise as viewed from the
  // drive side, so the pedal sweeps TDC → forward → BDC → back → TDC,
  // i.e. forward pedaling.
  const rightPedal = {
    x: crankCm * Math.sin(theta),
    y: crankCm * Math.cos(theta),
  };
  const leftPedal = {
    x: crankCm * Math.sin(theta + Math.PI),
    y: crankCm * Math.cos(theta + Math.PI),
  };

  const rightAnkle = ankleFromPedal(rightPedal, cfg.foot);
  const leftAnkle  = ankleFromPedal(leftPedal,  cfg.foot);

  const rightIK = solveLegIK(hip, rightAnkle, cfg.femur, cfg.tibia, true);
  const leftIK  = solveLegIK(hip, leftAnkle,  cfg.femur, cfg.tibia, true);

  const right: LegPose = {
    hip,
    knee: rightIK.knee,
    ankle: rightAnkle,
    pedal: rightPedal,
    hipAngle: 180 - interiorAngleDeg({ x: hip.x, y: hip.y - 10 }, hip, rightIK.knee),
    kneeAngle: 180 - interiorAngleDeg(hip, rightIK.knee, rightAnkle),
    ankleAngle: interiorAngleDeg(rightIK.knee, rightAnkle, rightPedal),
    reachable: rightIK.reachable,
  };
  const left: LegPose = {
    hip,
    knee: leftIK.knee,
    ankle: leftAnkle,
    pedal: leftPedal,
    hipAngle: 180 - interiorAngleDeg({ x: hip.x, y: hip.y - 10 }, hip, leftIK.knee),
    kneeAngle: 180 - interiorAngleDeg(hip, leftIK.knee, leftAnkle),
    ankleAngle: interiorAngleDeg(leftIK.knee, leftAnkle, leftPedal),
    reachable: leftIK.reachable,
  };

  return {
    crankAngle: ((theta % TAU) + TAU) % TAU,
    right,
    left,
    bbX: 0,
    bbY: 0,
    saddleX: sx,
    saddleY: sy,
  };
}

/* ------------------------------------------------------------------ */
/*  Per-leg torque around the crank (one revolution)                  */
/* ------------------------------------------------------------------ */

/** Tangential force fraction at crank angle θ relative to TDC for one leg. */
export function tangentialForceCurve(theta: number): number {
  // Asymmetric bell centred near 100° past TDC, zero in the recovery half.
  const t = ((theta % TAU) + TAU) % TAU;
  if (t > Math.PI && t < TAU) return 0.05; // tiny recovery contribution
  const peak = 1.78; // rad ≈ 102°
  const sigma = 0.78;
  const x = (t - peak) / sigma;
  return Math.max(0, Math.exp(-0.5 * x * x));
}

/** Total per-leg (right or left) torque, normalized 0..1. */
export function crankTorqueCurve(thetaRight: number, side: "R" | "L" | "Sum"): number {
  const r = tangentialForceCurve(thetaRight);
  const l = tangentialForceCurve(thetaRight + Math.PI);
  if (side === "R") return r;
  if (side === "L") return l;
  return r + l;
}

/* ------------------------------------------------------------------ */
/*  Steady-state metrics                                              */
/* ------------------------------------------------------------------ */

const HOLMES_MIN = 25; // deg knee flexion at BDC
const HOLMES_MAX = 45;

function efficiencyVsCadence(cadence: number, fastTwitchPct: number): number {
  // Inverted parabola, peak shifts with fibre composition.
  const optimum = 80 + (fastTwitchPct - 50) * 0.4; // ≈ 80–94 rpm
  const w = 38; // width
  const peak = 0.245; // ~24.5%
  const diff = cadence - optimum;
  return Math.max(0.06, peak - (diff * diff) / (w * w) * 0.08);
}

function kneeAlignmentPenalty(kneeAtBDC: number): number {
  if (kneeAtBDC >= HOLMES_MIN && kneeAtBDC <= HOLMES_MAX) return 1.0;
  const dist = kneeAtBDC < HOLMES_MIN
    ? HOLMES_MIN - kneeAtBDC
    : kneeAtBDC - HOLMES_MAX;
  return Math.max(0.6, 1 - dist * 0.012);
}

function gradeResistanceWatts(speedKmh: number, gradePct: number, massKg: number): number {
  // Combined aero + rolling + grade, very simplified
  const v = speedKmh / 3.6;
  const cdA = 0.35;
  const rho = 1.225;
  const aero = 0.5 * rho * cdA * v * v * v;
  const crr = 0.005;
  const rolling = crr * massKg * 9.81 * v;
  const grade = (gradePct / 100) * massKg * 9.81 * v;
  return aero + rolling + grade;
}

export function evaluate(cfg: Config): Metrics {
  // The two-link IK extends from hip to ankle (femur + tibia). The foot
  // is a rigid segment from ankle to pedal — it doesn't extend reach in
  // the IK sense, it shifts the ankle target.
  const maxIK = cfg.femur + cfg.tibia;
  const crankCm = cfg.crankLength / 10;
  const hipY = cfg.saddleHeight;
  const hipX = -cfg.saddleSetback;
  // At BDC the pedal is directly below the BB; ankle is offset by the foot.
  const pedalBDC = { x: 0, y: -crankCm };
  const ankleBDC = ankleFromPedal(pedalBDC, cfg.foot);
  const reach = Math.hypot(hipX - ankleBDC.x, hipY - ankleBDC.y);
  const geometryImpossible = reach > maxIK - 0.5;
  // Total leg envelope (informational, drives the reach circle in the UI).
  const maxLeg = cfg.femur + cfg.tibia + cfg.foot;

  // Knee flexion at BDC (compute from IK)
  const frameBDC = computeFrame(cfg, Math.PI); // θ=π → pedal at BDC for right
  const kneeAtBDC = frameBDC.right.kneeAngle;

  // Hip range from a couple frames
  const hipFlexionRangeOK = true; void hipFlexionRangeOK;

  const baseEff = efficiencyVsCadence(cfg.cadence, cfg.fastTwitchPct);
  const align = kneeAlignmentPenalty(kneeAtBDC);
  const grossEfficiency = baseEff * align;

  const power = gradeResistanceWatts(cfg.targetSpeed, cfg.roadGrade, cfg.mass);
  const metabolicCost = power / Math.max(0.06, grossEfficiency);

  const ie = Math.max(
    0.35,
    Math.min(0.85, 0.7 - Math.abs(cfg.cadence - 88) * 0.004),
  );

  const optimumCadence = 80 + (cfg.fastTwitchPct - 50) * 0.4;

  // Joint share rough split. Hip dominates with more reach, knee
  // contribution rises if the saddle is too low.
  const hipPct = Math.max(38, Math.min(58, 50 - (kneeAtBDC - 35) * 0.5));
  const kneePct = Math.max(22, Math.min(40, 32 + (kneeAtBDC - 35) * 0.4));
  const anklePct = Math.max(6, 100 - hipPct - kneePct);

  // Gear: distance per crank rev = wheel circumference × ratio.
  const speedMs = cfg.targetSpeed / 3.6;
  const wheelCircM = Math.PI * WHEEL_DIAMETER_M;
  const requiredRatio = (speedMs * 60) / (cfg.cadence * wheelCircM);

  return {
    power,
    cadence: cfg.cadence,
    speed: cfg.targetSpeed,
    gearRatio: requiredRatio,
    grossEfficiency,
    metabolicCost,
    kneeAtBDC,
    ie,
    optimumCadence,
    geometryImpossible,
    impossibleReason: geometryImpossible
      ? `Hip-to-ankle reach of ${reach.toFixed(1)} cm exceeds femur+tibia of ${maxIK.toFixed(1)} cm.`
      : undefined,
    jointShare: { hip: hipPct, knee: kneePct, ankle: anklePct },
    reach,
    maxLeg,
  };
}

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
