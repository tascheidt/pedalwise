import type {
  Config,
  FrameDynamics,
  LegDynamics,
  PedalMode,
  StrokeCurves,
  AmpProfile,
} from "./types";
import { computeFrame, gradeResistanceWatts } from "./geometry";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const TAU = Math.PI * 2;
const JAC_EPS = 1e-3; // rad, central-difference step for Jacobian
const N_SAMPLES = 121;
const CM_TO_M = 0.01;
/** Literature ceiling on upstroke radial unloading (Stream H biomech). */
const MAX_UPSTROKE_CLIPPED = 0.25;

/* ------------------------------------------------------------------ */
/*  Pedal-mode helpers                                                */
/* ------------------------------------------------------------------ */

/** Default to "clipped" for back-compat with presets that don't set it. */
function resolvePedalMode(cfg: Config): PedalMode {
  return cfg.pedalMode ?? "clipped";
}

/**
 * Gate the rider's requested upstroke effort by pedal mode:
 *  - "flat":    always 0 (foot cannot pull on a platform pedal).
 *  - "clipped": clamp into [0, 0.25] (Korff 2007, Mornieux 2010 ceiling).
 * Compute once per dynamics invocation, then thread the scalar through
 * the leg helpers so we don't re-derive per joint.
 */
function effectiveUpstrokeFor(cfg: Config): number {
  if (resolvePedalMode(cfg) === "flat") return 0;
  return Math.max(0, Math.min(MAX_UPSTROKE_CLIPPED, cfg.rider.upstrokeEffortPct));
}

/* ------------------------------------------------------------------ */
/*  Default amp profile                                               */
/* ------------------------------------------------------------------ */

export const DEFAULT_AMP_PROFILE: AmpProfile = {
  R: {
    hipExt: 120,
    hipFlex: 25,
    kneeExt: 80,
    kneeFlex: 20,
    anklePlantar: 35,
    ankleDorsi: 8,
  },
  L: {
    hipExt: 120,
    hipFlex: 25,
    kneeExt: 80,
    kneeFlex: 20,
    anklePlantar: 35,
    ankleDorsi: 8,
  },
};

/* ------------------------------------------------------------------ */
/*  Joint-angle derivation from geometry                              */
/* ------------------------------------------------------------------ */

type JointAngles = { thetaH: number; thetaK: number; thetaA: number };
type Side = "R" | "L";

function pt(x: number, y: number) {
  return { x, y };
}

/** Unsigned interior angle (rad) at vertex b in triangle a-b-c. */
function interiorAngleRad(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
): number {
  const v1x = a.x - b.x, v1y = a.y - b.y;
  const v2x = c.x - b.x, v2y = c.y - b.y;
  const n1 = Math.hypot(v1x, v1y) || 1e-9;
  const n2 = Math.hypot(v2x, v2y) || 1e-9;
  const cos = Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / (n1 * n2)));
  return Math.acos(cos);
}

/** Signed ankle angle (rad). 0 = foot perpendicular to tibia; + = plantar. */
function ankleAngleFromGeometry(
  K: { x: number; y: number },
  A: { x: number; y: number },
  P: { x: number; y: number },
): number {
  // Tibia direction (K → A) and foot direction (A → P).
  const tibAngle = Math.atan2(A.y - K.y, A.x - K.x);
  const footAngle = Math.atan2(P.y - A.y, P.x - A.x);
  // Signed angle from tibia to foot, in (-π, π].
  let diff = footAngle - tibAngle;
  while (diff > Math.PI) diff -= TAU;
  while (diff < -Math.PI) diff += TAU;
  // Neutral is foot perpendicular to tibia → diff = ±π/2.
  // Subtract π/2 (or add, choose sign s.t. + = plantar flexion).
  // Geometry: forward-pedaling rider, foot toe-down → diff ≈ -π/2 at neutral.
  // Use diff + π/2 so plantar (toe-down deeper than neutral) is positive.
  return diff + Math.PI / 2;
}

/** Compute (θ_h, θ_k, θ_a) for both legs at crank angle theta. */
export function computeJointAngles(
  cfg: Config,
  theta: number,
): { R: JointAngles; L: JointAngles } {
  const frame = computeFrame(cfg, theta);
  return {
    R: legAnglesFromPose(frame.right.hip, frame.right.knee, frame.right.ankle, frame.right.pedal),
    L: legAnglesFromPose(frame.left.hip, frame.left.knee, frame.left.ankle, frame.left.pedal),
  };
}

function legAnglesFromPose(
  H: { x: number; y: number },
  K: { x: number; y: number },
  A: { x: number; y: number },
  P: { x: number; y: number },
): JointAngles {
  // θ_h: signed angle of femur from vertical (+ forward).
  // Femur vector is H → K; vertical down is (0, -1).
  // atan2(Kx - Hx, Hy - Ky) gives + when knee is forward of hip.
  const thetaH = Math.atan2(K.x - H.x, H.y - K.y);
  // θ_k = π - interior angle at K in triangle H-K-A.
  // Straight leg → interior π → θ_k = 0. Bent leg → interior < π → θ_k > 0.
  const thetaK = Math.PI - interiorAngleRad(H, K, A);
  // θ_a: signed plantar/dorsi from neutral.
  const thetaA = ankleAngleFromGeometry(K, A, P);
  return { thetaH, thetaK, thetaA };
}

/* ------------------------------------------------------------------ */
/*  Analytic forward kinematics (for Jacobian only)                   */
/* ------------------------------------------------------------------ */

/**
 * Analytic FK: given joint angles, return pedal world position (cm).
 * NOTE: this is used only inside the Jacobian numerical differentiation.
 * Do NOT use it for visible rendering — `computeFrame` is the canonical
 * geometry path.
 *
 * MUST mirror `computeFrame` exactly, otherwise the Jacobian columns describe
 * a leg that differs from the one that produced the joint angles, and the
 * pedal-force solution is meaningless. The chain matches geometry.ts:
 *   hip = pelvis = saddle + (0, pelvisAboveSaddle)
 *   knee = hip + lf · (sin θ_h, −cos θ_h)
 *   ankle = knee + lt · (sin (θ_h−θ_k), −cos (θ_h−θ_k))
 *   pedal = ankle + |A→P| · (cos α_foot, sin α_foot)
 * where |A→P| and α_foot use the cleat-under-ball foot model from
 * `ankleFromPedal`: A→P length is sqrt(cleatToAnkle² + ankleAboveSole²)
 * and its world angle is derived from `ankleAngleFromGeometry`'s
 * convention (θ_a = 0 means foot perpendicular to tibia, + = plantar).
 */
export function analyticFK(
  cfg: Config,
  _side: Side,
  thetaH: number,
  thetaK: number,
  thetaA: number,
): { x: number; y: number } {
  const lf = cfg.femur;
  const lt = cfg.tibia;

  // Stream G foot model (cleat under ball-of-foot). The pedal sits below
  // and slightly forward of the ankle; the world orientation of A→P is
  // determined by θ_a per ankleAngleFromGeometry's convention, so once
  // the length is right and the formula matches that convention, the
  // closure with computeFrame's geometry is exact (modulo the cleatOffset
  // rake, which v1.1 leaves as a pure shortening of the structural foot).
  const footLen = cfg.foot - (cfg.cleatOffset ?? 0);
  const cleatToAnkle = footLen * 0.55;
  const ankleAboveSole = footLen * 0.10;
  const lAP = Math.hypot(cleatToAnkle, ankleAboveSole);

  // Stream D: hip = pelvis = saddle nose + (0, pelvisAboveSaddle).
  const pelvisAboveSaddle = cfg.pelvisAboveSaddle ?? 6.0;
  const hx = -cfg.saddleSetback;
  const hy = cfg.saddleHeight + pelvisAboveSaddle;

  // Knee from hip; femur swings from vertical by θ_h (+ forward).
  const kx = hx + lf * Math.sin(thetaH);
  const ky = hy - lf * Math.cos(thetaH);

  // Tibia world: standard CCW-from-+x angle α_tib = θ_h − θ_k − π/2.
  const tibWorld = thetaH - thetaK;
  const ax = kx + lt * Math.sin(tibWorld);
  const ay = ky - lt * Math.cos(tibWorld);

  // Foot world angle (standard CCW-from-+x for the vector A→P).
  // From legAnglesFromPose / ankleAngleFromGeometry:
  //   θ_a = (footAngleStd − tibAngleStd) + π/2,
  //   tibAngleStd = θ_h − θ_k − π/2
  // ⇒  α_foot ≡ footAngleStd = θ_h − θ_k + θ_a − π
  const alphaFoot = thetaH - thetaK + thetaA - Math.PI;
  const px = ax + lAP * Math.cos(alphaFoot);
  const py = ay + lAP * Math.sin(alphaFoot);

  return { x: px, y: py };
}

/* ------------------------------------------------------------------ */
/*  Jacobian                                                          */
/* ------------------------------------------------------------------ */

/**
 * 2×3 Jacobian ∂P/∂q where q = (θ_h, θ_k, θ_a).
 * Units: cm per rad. Layout: matrix[row][col], row ∈ {0:x, 1:y}, col ∈ {0:h, 1:k, 2:a}.
 */
export function computeJacobian(
  cfg: Config,
  side: Side,
  thetaH: number,
  thetaK: number,
  thetaA: number,
): number[][] {
  const J: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
  ];
  const angles = [thetaH, thetaK, thetaA];
  for (let i = 0; i < 3; i++) {
    const plus = angles.slice();
    const minus = angles.slice();
    plus[i] += JAC_EPS;
    minus[i] -= JAC_EPS;
    const pPlus = analyticFK(cfg, side, plus[0], plus[1], plus[2]);
    const pMinus = analyticFK(cfg, side, minus[0], minus[1], minus[2]);
    J[0][i] = (pPlus.x - pMinus.x) / (2 * JAC_EPS);
    J[1][i] = (pPlus.y - pMinus.y) / (2 * JAC_EPS);
  }
  return J;
}

/* ------------------------------------------------------------------ */
/*  Activation-derived joint torques                                  */
/* ------------------------------------------------------------------ */

type AmpSide = AmpProfile["R"];

/**
 * Joint torques for one leg (N·m), expressed in the same generalised-angle
 * convention used by `legAnglesFromPose` / `analyticFK`:
 *
 *   θ_h: signed femur-from-vertical, + when knee is forward of hip.
 *        Hip *extension* moves the knee backward → θ_h decreases →
 *        extensor torque is in the −θ_h direction.
 *   θ_k = π − interior(H,K,A): 0 when leg straight, > 0 when bent.
 *        Knee *extension* drives θ_k → 0 → extensor torque is in the
 *        −θ_k direction.
 *   θ_a: signed plantar/dorsi from `ankleAngleFromGeometry`. Plantar
 *        flexion rotates the foot CW relative to the tibia, which
 *        *decreases* θ_a (the +π/2 offset puts the rider's working
 *        range above π — see closure trace) → plantar torque is in
 *        the −θ_a direction.
 *
 * Therefore each "extension/plantar" amplitude contributes with a
 * negative sign in the generalised-torque vector, and the corresponding
 * antagonist with a positive sign. The Jacobian pseudoinverse will then
 * produce pedal forces that are correctly propulsive during the
 * downstroke (and correctly unloading during the upstroke).
 *
 * theta is the *right* crank angle; for the left leg pass isLeftLeg = true
 * (this function adds π internally).
 */
export function jointTorques(
  ampSide: AmpSide,
  theta: number,
  upstrokeEffortPct: number,
  isLeftLeg: boolean,
): { tauH: number; tauK: number; tauA: number } {
  const t = isLeftLeg ? theta + Math.PI : theta;
  const u = Math.max(0, Math.min(1, upstrokeEffortPct / 0.25));

  const wExt = (phi: number) => Math.max(0, Math.sin(t + phi));
  const wFlex = (phi: number) => Math.max(0, -Math.sin(t + phi)) * u;

  const tauHipExt = ampSide.hipExt * wExt(0.1);
  const tauHipFlex = ampSide.hipFlex * wFlex(0.1);
  const tauKneeExt = ampSide.kneeExt * wExt(-0.05);
  const tauKneeFlex = ampSide.kneeFlex * wFlex(-0.05);
  const tauPlantar = ampSide.anklePlantar * wExt(-0.2);
  const tauDorsi = ampSide.ankleDorsi * wFlex(-0.2);

  return {
    tauH: -tauHipExt + tauHipFlex,
    tauK: -tauKneeExt + tauKneeFlex,
    tauA: -tauPlantar + tauDorsi,
  };
}

/* ------------------------------------------------------------------ */
/*  Torque → pedal force                                              */
/* ------------------------------------------------------------------ */

/**
 * Solve F_pedal (N) from J^T F = τ via left pseudoinverse.
 * J is cm-per-rad; converting to m-per-rad on J before solving keeps
 * the result in Newtons.
 */
function torqueToPedalForce(
  J_cm: number[][],
  tau: [number, number, number],
): { fx: number; fy: number; bad: boolean } {
  // Convert J to meters so torque/force units come out in N·m / m = N.
  const J: number[][] = [
    [J_cm[0][0] * CM_TO_M, J_cm[0][1] * CM_TO_M, J_cm[0][2] * CM_TO_M],
    [J_cm[1][0] * CM_TO_M, J_cm[1][1] * CM_TO_M, J_cm[1][2] * CM_TO_M],
  ];
  // M = J · J^T  (2×2)
  const a = J[0][0] * J[0][0] + J[0][1] * J[0][1] + J[0][2] * J[0][2];
  const b = J[0][0] * J[1][0] + J[0][1] * J[1][1] + J[0][2] * J[1][2];
  const c = J[1][0] * J[1][0] + J[1][1] * J[1][1] + J[1][2] * J[1][2];
  const det = a * c - b * b;
  if (!isFinite(det) || Math.abs(det) < 1e-9) {
    return { fx: 0, fy: 0, bad: true };
  }
  // J · τ  (2-vec)
  const jt0 = J[0][0] * tau[0] + J[0][1] * tau[1] + J[0][2] * tau[2];
  const jt1 = J[1][0] * tau[0] + J[1][1] * tau[1] + J[1][2] * tau[2];
  // M^{-1} · (J τ) = (1/det) · [[c -b][-b a]] · (jt0, jt1)
  const fx = (c * jt0 - b * jt1) / det;
  const fy = (-b * jt0 + a * jt1) / det;
  if (!isFinite(fx) || !isFinite(fy)) return { fx: 0, fy: 0, bad: true };
  return { fx, fy, bad: false };
}

/* ------------------------------------------------------------------ */
/*  Per-frame dynamics                                                */
/* ------------------------------------------------------------------ */

/**
 * Real per-frame dynamics. Uses cfg.rider.amp directly (no calibration);
 * calibration is applied at the sweep level inside sampleStrokeCurves.
 */
export function computeFrameDynamics(cfg: Config, theta: number): FrameDynamics {
  return computeFrameDynamicsWithAmp(cfg, theta, cfg.rider.amp);
}

function computeFrameDynamicsWithAmp(
  cfg: Config,
  theta: number,
  amp: AmpProfile,
): FrameDynamics {
  const angles = computeJointAngles(cfg, theta);
  const u = effectiveUpstrokeFor(cfg);
  const mode = resolvePedalMode(cfg);
  const right = computeLegDynamics(cfg, "R", theta, angles.R, amp.R, u, mode, false);
  const left = computeLegDynamics(cfg, "L", theta, angles.L, amp.L, u, mode, true);

  const rCrankM = cfg.crankLength / 1000;
  const crankTorque = (right.fTangential + left.fTangential) * rCrankM;

  return { right, left, crankTorque };
}

function computeLegDynamics(
  cfg: Config,
  side: Side,
  theta: number,
  ja: JointAngles,
  ampSide: AmpSide,
  upstrokeEffortPct: number,
  pedalMode: PedalMode,
  isLeftLeg: boolean,
): LegDynamics {
  const J = computeJacobian(cfg, side, ja.thetaH, ja.thetaK, ja.thetaA);
  const { tauH, tauK, tauA } = jointTorques(ampSide, theta, upstrokeEffortPct, isLeftLeg);
  const { fx, fy } = torqueToPedalForce(J, [tauH, tauK, tauA]);

  // Crank angle for this leg's pedal.
  const legTheta = isLeftLeg ? theta + Math.PI : theta;
  // Tangent (+ = CW propulsive) and radial (+ = outward from BB) unit vectors
  // at the pedal location, given pedal world position (sin θ, cos θ) · r.
  // d(pedal)/dθ ∝ (cos θ, -sin θ) → tangent.
  const tx = Math.cos(legTheta);
  const ty = -Math.sin(legTheta);
  const rx = Math.sin(legTheta);
  const ry = Math.cos(legTheta);

  let fxN = fx;
  let fyN = fy;
  let fTan = fx * tx + fy * ty;
  let fRad = fx * rx + fy * ry;

  // Upstroke unloading on radial during recovery half (θ ∈ (π, 2π)).
  // (On flat pedals upstrokeEffortPct has already been gated to 0 upstream,
  // so this branch is a no-op there.)
  const legThetaWrapped = ((legTheta % TAU) + TAU) % TAU;
  if (legThetaWrapped > Math.PI && legThetaWrapped < TAU) {
    const u = Math.max(0, Math.min(1, upstrokeEffortPct / MAX_UPSTROKE_CLIPPED));
    if (fRad > 0) fRad -= u * fRad;
  }

  // Flat-pedal lift clamp: a platform pedal can only transmit force where
  // the foot pushes DOWN on the pedal (world −y). The foot cannot pull
  // the pedal upward (no cleat), so any frame where the leg's pedal force
  // has a world +y component is mechanically impossible on a flat pedal.
  // (Earlier versions clamped on negative radial, but during the downstroke
  // the pedal sits above the BB and the *legitimate* push-down direction
  // IS negative radial — clamping it zeroed out the real propulsive
  // portion of the flat-pedal stroke and inverted the clipped-vs-flat IE
  // ordering. World-frame lift is the correct invariant.)
  let tauHipOut = tauH;
  let tauKneeOut = tauK;
  let tauAnkleOut = tauA;
  if (pedalMode === "flat" && fyN > 0) {
    fRad = 0;
    fTan = 0;
    fxN = 0;
    fyN = 0;
    tauHipOut = 0;
    tauKneeOut = 0;
    tauAnkleOut = 0;
  }

  return {
    fxN,
    fyN,
    fTangential: fTan,
    fRadial: fRad,
    jointTorque: { hip: tauHipOut, knee: tauKneeOut, ankle: tauAnkleOut },
    // jointPower filled at the sweep level (needs ω_joint via finite diff).
    jointPower: { hip: 0, knee: 0, ankle: 0 },
  };
}

/* ------------------------------------------------------------------ */
/*  Calibration                                                       */
/* ------------------------------------------------------------------ */

function deepCloneAmp(amp: AmpProfile): AmpProfile {
  return {
    R: { ...amp.R },
    L: { ...amp.L },
  };
}

function scaleAmp(amp: AmpProfile, k: number): AmpProfile {
  return {
    R: {
      hipExt: amp.R.hipExt * k,
      hipFlex: amp.R.hipFlex * k,
      kneeExt: amp.R.kneeExt * k,
      kneeFlex: amp.R.kneeFlex * k,
      anklePlantar: amp.R.anklePlantar * k,
      ankleDorsi: amp.R.ankleDorsi * k,
    },
    L: {
      hipExt: amp.L.hipExt * k,
      hipFlex: amp.L.hipFlex * k,
      kneeExt: amp.L.kneeExt * k,
      kneeFlex: amp.L.kneeFlex * k,
      anklePlantar: amp.L.anklePlantar * k,
      ankleDorsi: amp.L.ankleDorsi * k,
    },
  };
}

/**
 * Single-rev average mechanical power (W) from a torque sweep.
 * Trapezoidal over [0, 2π] then × (1/(2π)) × ∫dθ → mean.
 */
function meanPowerFromSweep(
  cfg: Config,
  amp: AmpProfile,
  omega: number,
): number {
  const N = N_SAMPLES;
  const rCrankM = cfg.crankLength / 1000;
  let sumTorque = 0;
  for (let i = 0; i < N - 1; i++) {
    const theta = (i / (N - 1)) * TAU;
    const fd = computeFrameDynamicsWithAmp(cfg, theta, amp);
    sumTorque += fd.crankTorque;
  }
  const meanTorque = sumTorque / (N - 1);
  return meanTorque * omega;
}

/**
 * Calibrate amp so the mean mechanical power matches targetPowerW.
 * Returns a fresh deep-cloned, scaled AmpProfile. Does NOT mutate cfg.
 */
export function calibrateAmpForPower(
  cfg: Config,
  targetPowerW: number,
): AmpProfile {
  const omega = (cfg.cadence * TAU) / 60;
  const baseAmp = deepCloneAmp(cfg.rider.amp);
  const rawPower = meanPowerFromSweep(cfg, baseAmp, omega);
  const denom = Math.max(rawPower, 1e-3);
  const scale = targetPowerW / denom;
  return scaleAmp(baseAmp, scale);
}

/* ------------------------------------------------------------------ */
/*  Stroke-curve sweep                                                */
/* ------------------------------------------------------------------ */

/**
 * 121-sample stroke curves over [0, 2π]. Internally calibrates amp once
 * so the mean crank power matches gradeResistanceWatts (the target).
 */
export function sampleStrokeCurves(cfg: Config): StrokeCurves {
  const N = N_SAMPLES;
  const omega = (cfg.cadence * TAU) / 60;

  // 1. Calibrate amp so mean crank power matches external demand.
  const targetPower = gradeResistanceWatts(cfg.targetSpeed, cfg.roadGrade, cfg.mass);
  const ampCal = calibrateAmpForPower(cfg, targetPower);

  // 2. Sweep & collect curves.
  const crankAngle: number[] = new Array(N);
  const tangentialR: number[] = new Array(N);
  const tangentialL: number[] = new Array(N);
  const radialR: number[] = new Array(N);
  const radialL: number[] = new Array(N);

  const tauHR: number[] = new Array(N);
  const tauKR: number[] = new Array(N);
  const tauAR: number[] = new Array(N);
  const tauHL: number[] = new Array(N);
  const tauKL: number[] = new Array(N);
  const tauAL: number[] = new Array(N);

  const thHR: number[] = new Array(N);
  const thKR: number[] = new Array(N);
  const thAR: number[] = new Array(N);
  const thHL: number[] = new Array(N);
  const thKL: number[] = new Array(N);
  const thAL: number[] = new Array(N);

  const u = effectiveUpstrokeFor(cfg);
  const mode = resolvePedalMode(cfg);

  for (let i = 0; i < N; i++) {
    const theta = (i / (N - 1)) * TAU;
    crankAngle[i] = theta;

    const angles = computeJointAngles(cfg, theta);
    thHR[i] = angles.R.thetaH;
    thKR[i] = angles.R.thetaK;
    thAR[i] = angles.R.thetaA;
    thHL[i] = angles.L.thetaH;
    thKL[i] = angles.L.thetaK;
    thAL[i] = angles.L.thetaA;

    const rLeg = computeLegDynamics(cfg, "R", theta, angles.R, ampCal.R, u, mode, false);
    const lLeg = computeLegDynamics(cfg, "L", theta, angles.L, ampCal.L, u, mode, true);

    tangentialR[i] = isFinite(rLeg.fTangential) ? rLeg.fTangential : 0;
    tangentialL[i] = isFinite(lLeg.fTangential) ? lLeg.fTangential : 0;
    radialR[i] = isFinite(rLeg.fRadial) ? rLeg.fRadial : 0;
    radialL[i] = isFinite(lLeg.fRadial) ? lLeg.fRadial : 0;

    tauHR[i] = rLeg.jointTorque.hip;
    tauKR[i] = rLeg.jointTorque.knee;
    tauAR[i] = rLeg.jointTorque.ankle;
    tauHL[i] = lLeg.jointTorque.hip;
    tauKL[i] = lLeg.jointTorque.knee;
    tauAL[i] = lLeg.jointTorque.ankle;
  }

  // 3. Joint power per frame via finite-diff joint velocities.
  // Δt between samples = (2π / (N-1)) / ω.
  const dt = TAU / (N - 1) / omega;
  const jointPowerHip: number[] = new Array(N);
  const jointPowerKnee: number[] = new Array(N);
  const jointPowerAnkle: number[] = new Array(N);

  const wrap = (i: number) => ((i % (N - 1)) + (N - 1)) % (N - 1);
  const omegaJ = (arr: number[], i: number) => {
    // Use samples at i+1, i-1 with periodic wrap (treating index N-1 == 0).
    const ip = wrap(i + 1);
    const im = wrap(i - 1);
    return (arr[ip] - arr[im]) / (2 * dt);
  };

  for (let i = 0; i < N; i++) {
    const wHR = omegaJ(thHR, i);
    const wKR = omegaJ(thKR, i);
    const wAR = omegaJ(thAR, i);
    const wHL = omegaJ(thHL, i);
    const wKL = omegaJ(thKL, i);
    const wAL = omegaJ(thAL, i);

    const pHip = tauHR[i] * wHR + tauHL[i] * wHL;
    const pKnee = tauKR[i] * wKR + tauKL[i] * wKL;
    const pAnkle = tauAR[i] * wAR + tauAL[i] * wAL;

    jointPowerHip[i] = isFinite(pHip) ? pHip : 0;
    jointPowerKnee[i] = isFinite(pKnee) ? pKnee : 0;
    jointPowerAnkle[i] = isFinite(pAnkle) ? pAnkle : 0;
  }

  return {
    crankAngle,
    tangentialR,
    tangentialL,
    radialR,
    radialL,
    jointPowerHip,
    jointPowerKnee,
    jointPowerAnkle,
  };
}

