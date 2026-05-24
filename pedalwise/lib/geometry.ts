import type { Config, Frame, LegPose } from "./types";

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
export function solveLegIK(
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
export const FOOT_TOE_DOWN_RAD = (8 * Math.PI) / 180;

/**
 * Stream G fix: the cleat sits under the ball of the foot, not at the heel.
 * The ankle is roughly above-and-slightly-behind the pedal axle, not behind
 * by the full shoe length. Biomechanically meaningful distance is
 * ankle-to-cleat along the foot ≈ 0.55 × shoe-length, with the ankle bone
 * ≈ 0.10 × shoe-length above the sole (pedal axle).
 *
 * In the foot frame (toe = +x, sole down), the ankle sits at
 *   (−cleatToAnkle, +ankleAboveSole)
 * relative to the pedal axle (i.e. the cleat). The foot pitches toe-down by
 * θ = FOOT_TOE_DOWN_RAD (positive plantar), which is a clockwise rotation in
 * the world frame.
 */
export function ankleFromPedal(
  pedal: { x: number; y: number },
  footLen: number,
): { x: number; y: number } {
  const cleatToAnkle = footLen * 0.55;     // cm, along the shoe sole
  const ankleAboveSole = footLen * 0.10;   // cm, ankle bone above the cleat
  const theta = FOOT_TOE_DOWN_RAD;
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  // Rotate (−cleatToAnkle, +ankleAboveSole) by θ clockwise (toe-down):
  //   x' =  (−cleatToAnkle)·cos(θ) + (+ankleAboveSole)·sin(θ)
  //   y' = −(−cleatToAnkle)·sin(θ) + (+ankleAboveSole)·cos(θ)
  return {
    x: pedal.x - cleatToAnkle * c + ankleAboveSole * s,
    y: pedal.y + cleatToAnkle * s + ankleAboveSole * c,
  };
}

/** Interior angle at vertex `b` in triangle a-b-c (deg). */
export function interiorAngleDeg(
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
 * Stream D: torso lean derived from barDrop. Static v1.1 lookup; v1.2 may
 * derive from reach/stem.
 *
 * Reference points (rad from vertical):
 *   barDrop −2 cm (upright MTB / commuter)  → ≈ 25° (0.44 rad)
 *   barDrop  0 cm                           → ≈ 26° (0.45 rad)
 *   barDrop  8 cm (road endurance)          → ≈ 37° (0.65 rad)
 *   barDrop 14 cm (TT / aero)               → ≈ 46° (0.80 rad)
 * Clamped at 25° upright minimum and 65° aero TT maximum.
 */
function torsoLeanRadFromBarDrop(barDrop: number): number {
  const raw = 0.45 + barDrop * 0.025;
  return Math.max(0.43, Math.min(1.13, raw));
}

/**
 * Compute a single frame of the simulator at crank angle `theta` (rad).
 * Coordinate system: world cm, +x = forward (toward front of bike),
 * +y = up. Origin is bottom bracket.
 *
 * Stream D: the IK hip anchor is the **pelvis** (saddle nose + offset),
 * not the saddle. The shoulder is derived from the torso lean angle
 * (driven by barDrop). LegPose.hipFlexion is the trunk-thigh angle at
 * the pelvis vertex.
 */
export function computeFrame(cfg: Config, theta: number): Frame {
  const crankCm = cfg.crankLength / 10;
  const setback = cfg.saddleSetback;
  // Saddle position relative to BB
  const sx = -setback;
  const sy = cfg.saddleHeight;

  // Pelvis: sits directly above the saddle nose by pelvisAboveSaddle.
  // (v1.1: saddle is level, so the offset is straight up.)
  const pelvisAboveSaddle = cfg.pelvisAboveSaddle ?? 6.0;
  const pelvisX = sx;
  const pelvisY = sy + pelvisAboveSaddle;

  // Hip joint = pelvis (Stream D: was saddle pre-Stream-D).
  const hip = { x: pelvisX, y: pelvisY };

  // Shoulder: torso pivots at pelvis, length torsoLength, leans forward.
  // At lean=0 the torso is vertical (shoulder directly above pelvis);
  // increasing lean tips the shoulder forward and (relatively) down.
  const torsoLength = cfg.torsoLength ?? (cfg.height * 0.30);
  const barDrop = cfg.barDrop ?? 8.0;
  const torsoLeanRad = torsoLeanRadFromBarDrop(barDrop);
  const shoulderX = pelvisX + torsoLength * Math.sin(torsoLeanRad);
  const shoulderY = pelvisY + torsoLength * Math.cos(torsoLeanRad);
  const shoulder = { x: shoulderX, y: shoulderY };

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

  // Hip flexion = angle at pelvis between shoulder and knee. Straight
  // (standing) ≈ 180°, deeply flexed (knee toward chest) → smaller.
  const rightHipFlexion = interiorAngleDeg(shoulder, hip, rightIK.knee);
  const leftHipFlexion  = interiorAngleDeg(shoulder, hip, leftIK.knee);

  const right: LegPose = {
    hip,
    knee: rightIK.knee,
    ankle: rightAnkle,
    pedal: rightPedal,
    hipAngle: 180 - interiorAngleDeg({ x: hip.x, y: hip.y - 10 }, hip, rightIK.knee),
    kneeAngle: 180 - interiorAngleDeg(hip, rightIK.knee, rightAnkle),
    ankleAngle: interiorAngleDeg(rightIK.knee, rightAnkle, rightPedal),
    reachable: rightIK.reachable,
    hipFlexion: rightHipFlexion,
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
    hipFlexion: leftHipFlexion,
  };

  return {
    crankAngle: ((theta % TAU) + TAU) % TAU,
    right,
    left,
    bbX: 0,
    bbY: 0,
    saddleX: sx,
    saddleY: sy,
    pelvisX,
    pelvisY,
    shoulderX,
    shoulderY,
  };
}

/* ------------------------------------------------------------------ */
/*  Power demand                                                      */
/* ------------------------------------------------------------------ */

/**
 * Combined aero + rolling + grade resistance (W) needed to hold steady
 * speed. Pure function; lifted from kinematics.ts so other modules can
 * import without dragging the whole metrics pipeline.
 */
export function gradeResistanceWatts(
  speedKmh: number,
  gradePct: number,
  massKg: number,
): number {
  const v = speedKmh / 3.6;
  const cdA = 0.35;
  const rho = 1.225;
  const aero = 0.5 * rho * cdA * v * v * v;
  const crr = 0.005;
  const rolling = crr * massKg * 9.81 * v;
  const grade = (gradePct / 100) * massKg * 9.81 * v;
  return aero + rolling + grade;
}
