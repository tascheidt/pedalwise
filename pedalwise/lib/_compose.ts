import type { Config, Metrics, StrokeCurves } from "./types";
import { computeFrame, gradeResistanceWatts, ankleFromPedal } from "./geometry";
import {
  grossEfficiency,
  metabolicCost,
  optimumCadence,
  kneeAlignmentPenalty,
} from "./metabolic";
import { sampleStrokeCurves } from "./dynamics";
import { WHEEL_DIAMETER_M } from "./presets";

const TAU = Math.PI * 2;

/**
 * Internal composer. Stream A skeleton; Stream B rebinds ie / ieRight /
 * ieLeft / lrBalance / jointShare to the real integrated curves.
 * grossEfficiency + kneeAlignmentPenalty remain Stream C territory.
 */
export function computeMetrics(cfg: Config): Metrics {
  const maxIK = cfg.femur + cfg.tibia;
  const crankCm = cfg.crankLength / 10;
  // Stream D: IK hip anchor is the pelvis (saddle nose + offset), not the
  // saddle. The reach test must therefore reach to the pelvis, otherwise
  // the visible IK and the impossibility flag will disagree.
  const pelvisAboveSaddle = cfg.pelvisAboveSaddle ?? 6.0;
  const hipX = -cfg.saddleSetback;
  const hipY = cfg.saddleHeight + pelvisAboveSaddle;
  // At BDC the pedal is directly below the BB; ankle is offset by the foot
  // (Stream G: ankle is now above-and-slightly-behind the cleat, not behind
  // by the full shoe length — see ankleFromPedal).
  const pedalBDC = { x: 0, y: -crankCm };
  const ankleBDC = ankleFromPedal(pedalBDC, cfg.foot);
  const reach = Math.hypot(hipX - ankleBDC.x, hipY - ankleBDC.y);
  const geometryImpossible = reach > maxIK - 0.5;
  const maxLeg = cfg.femur + cfg.tibia + cfg.foot;

  const frameBDC = computeFrame(cfg, Math.PI);
  const kneeAtBDC = frameBDC.right.kneeAngle;

  const power = gradeResistanceWatts(cfg.targetSpeed, cfg.roadGrade, cfg.mass);
  const baseEff = grossEfficiency(power, cfg.cadence, cfg);
  const ge = baseEff * kneeAlignmentPenalty(kneeAtBDC);
  const cost = metabolicCost(power, ge);
  const optCad = optimumCadence(power, cfg);

  // Real stroke curves (calibrated to target power).
  const curves = sampleStrokeCurves(cfg);

  // Derived per-leg integrals over one revolution.
  const { ieRight, ieLeft, ie, lrBalance, jointShare } =
    integrateCurves(cfg, curves);

  const speedMs = cfg.targetSpeed / 3.6;
  const wheelCircM = Math.PI * WHEEL_DIAMETER_M;
  const requiredRatio = (speedMs * 60) / (cfg.cadence * wheelCircM);

  return {
    power,
    cadence: cfg.cadence,
    speed: cfg.targetSpeed,
    gearRatio: requiredRatio,
    grossEfficiency: ge,
    metabolicCost: cost,
    kneeAtBDC,
    optimumCadence: optCad,
    geometryImpossible,
    impossibleReason: geometryImpossible
      ? `Hip-to-ankle reach of ${reach.toFixed(1)} cm exceeds femur+tibia of ${maxIK.toFixed(1)} cm.`
      : undefined,
    reach,
    maxLeg,
    ie,
    ieRight,
    ieLeft,
    lrBalance,
    jointShare,
    curves,
  };
}

/* ------------------------------------------------------------------ */
/*  Integrals: IE, lrBalance, joint share                             */
/* ------------------------------------------------------------------ */

function integrateCurves(
  cfg: Config,
  curves: StrokeCurves,
): {
  ieRight: number;
  ieLeft: number;
  ie: number;
  lrBalance: number;
  jointShare: { hip: number; knee: number; ankle: number };
} {
  const N = curves.crankAngle.length;
  const omega = (cfg.cadence * TAU) / 60; // rad/s
  const rCrankM = cfg.crankLength / 1000; // m
  const dTheta = TAU / (N - 1);

  // Trapezoidal helpers over a closed period (treat index 0 == N-1).
  // We sum samples 0..N-2 and multiply by dTheta — equivalent to a
  // periodic trapezoidal rule.
  let sumPosTanR = 0;
  let sumAbsForceR = 0;
  let sumPosTanL = 0;
  let sumAbsForceL = 0;

  let sumTanR = 0;
  let sumTanL = 0;

  let sumHip = 0;
  let sumKnee = 0;
  let sumAnkle = 0;

  for (let i = 0; i < N - 1; i++) {
    const tR = curves.tangentialR[i];
    const rR = curves.radialR[i];
    const tL = curves.tangentialL[i];
    const rL = curves.radialL[i];

    if (Number.isFinite(tR)) {
      sumPosTanR += Math.max(0, tR);
      sumAbsForceR += Math.hypot(tR, rR);
      sumTanR += tR;
    }
    if (Number.isFinite(tL)) {
      sumPosTanL += Math.max(0, tL);
      sumAbsForceL += Math.hypot(tL, rL);
      sumTanL += tL;
    }

    if (Number.isFinite(curves.jointPowerHip[i])) sumHip += curves.jointPowerHip[i];
    if (Number.isFinite(curves.jointPowerKnee[i])) sumKnee += curves.jointPowerKnee[i];
    if (Number.isFinite(curves.jointPowerAnkle[i])) sumAnkle += curves.jointPowerAnkle[i];
  }

  // IE = ∫ max(F_tan,0) dθ / ∫ |F| dθ
  const ieRightRaw = sumAbsForceR > 1e-6 ? (sumPosTanR / sumAbsForceR) : 0;
  const ieLeftRaw = sumAbsForceL > 1e-6 ? (sumPosTanL / sumAbsForceL) : 0;
  const ieRight = clamp01(ieRightRaw);
  const ieLeft = clamp01(ieLeftRaw);
  const ie = (ieRight + ieLeft) / 2;

  // L/R balance from mean tangential power per leg.
  // <P_R> = <F_tan_R> · r · ω; the constant factor cancels in the ratio.
  const meanTanR = sumTanR / (N - 1);
  const meanTanL = sumTanL / (N - 1);
  const pwrR = meanTanR * rCrankM * omega;
  const pwrL = meanTanL * rCrankM * omega;
  const totalP = pwrR + pwrL;
  let lrBalance = 0.5;
  if (Math.abs(totalP) > 1e-3 && Number.isFinite(totalP)) {
    lrBalance = pwrR / totalP;
  }
  // Clamp to sane range so a UI consumer never sees something silly.
  lrBalance = Math.max(0, Math.min(1, lrBalance));

  // Joint share: mean joint power per joint over rev. Use absolute values
  // so eccentric phases don't cancel out the share contribution.
  const meanHip = Math.abs(sumHip * dTheta) / TAU;
  const meanKnee = Math.abs(sumKnee * dTheta) / TAU;
  const meanAnkle = Math.abs(sumAnkle * dTheta) / TAU;
  const totalJ = meanHip + meanKnee + meanAnkle;
  let hipPct: number, kneePct: number, anklePct: number;
  if (totalJ > 1e-3 && Number.isFinite(totalJ)) {
    hipPct = (100 * meanHip) / totalJ;
    kneePct = (100 * meanKnee) / totalJ;
    anklePct = 100 - hipPct - kneePct;
  } else {
    hipPct = 50;
    kneePct = 35;
    anklePct = 15;
  }

  return {
    ieRight,
    ieLeft,
    ie,
    lrBalance,
    jointShare: { hip: hipPct, knee: kneePct, ankle: anklePct },
  };
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}
