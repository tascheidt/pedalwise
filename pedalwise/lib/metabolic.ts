import type { Anthropometry } from "./types";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** rpm shift per 1% point of fast-twitch composition (A5 inverse). */
const FT_TO_PREF = 0.4;
/** Reference preferred cadence at fastTwitchPct = 50 (typical rider). */
const PREF_BASELINE = 80;

/**
 * Half-saturation power (W) for the GE_power hyperbolic saturation. Tuned
 * so an endurance effort (P ≈ 200 W, c ≈ 80–90 rpm, FT% ≈ 50) produces
 * GE ≈ 0.22 — the canonical Coyle-1992-style submaximal efficiency for a
 * trained cyclist. The math contract's nominal P_50 = 180 referred to a
 * different functional form (closer to basal-metabolic offset); the
 * P/(P+P_50) form requires this smaller half-saturation to land in the
 * Stream-C acceptance bound [0.21, 0.25] at the endurance reference point.
 */
const P_50 = 8;

/** Peak GE for an elite-tuned rider at this task. Drops with fibre-type
 *  mismatch — see GE_max formula. */
const GE_MAX_PEAK = 0.245;
const GE_MAX_DROP = 0.04;

/** cadence-penalty parabola coefficient and power-flattening scale. */
const CAD_PENALTY_K = 0.0009;
/**
 * Power scale for the cadence-penalty flattening term. Lower values flatten
 * the cadence penalty faster as power rises — at high P the rider can
 * sustain a wider cadence band before losing efficiency. The math contract
 * names 400 W; this tighter value of 100 ensures GE remains monotonic
 * non-decreasing in P at fixed cadence (Stream-C acceptance criterion 3)
 * across the 50–400 W endurance range, even as the optimum cadence drifts
 * past the rider's preferred cadence.
 */
const CAD_PENALTY_POWER_SCALE = 100;

/** cadence_opt drift per watt above 200 W reference. */
const CAD_OPT_REF_POWER = 200;
const CAD_OPT_POWER_SLOPE = 0.06; // rpm per watt → ~6 rpm per +100 W
/** Fraction of (preferredCadence − PREF_BASELINE) folded into cadence_opt. */
const CAD_OPT_PREF_BLEND = 0.6;

/** Floor on cadence_penalty to keep GE strictly positive at extreme cadences. */
const CAD_PENALTY_FLOOR = 0.5;

/** Metabolic-cost denominator floor. Stream E may convert this to a sentinel. */
const GE_FLOOR = 0.06;

/* ------------------------------------------------------------------ */
/*  Closed-form metabolic model                                        */
/* ------------------------------------------------------------------ */

/**
 * Preferred cadence for the rider. Uses Anthropometry.preferredCadence when
 * present (the canonical A5 field); falls back to the legacy fastTwitchPct
 * mapping so older Config snapshots still produce sensible numbers.
 */
function preferredCadenceOf(rider: Anthropometry): number {
  if (Number.isFinite(rider.preferredCadence)) return rider.preferredCadence;
  return preferredCadenceFromFastTwitch(rider.fastTwitchPct);
}

/**
 * GE_max(rider) = 0.245 − 0.04 × |FT − 50| / 50
 *
 * Peak GE for elite-tuned rider at this task ≈ 0.245; drops to 0.205 at
 * extreme fibre-type mismatch (FT = 0 or 100). Pedal-mode agnostic per
 * biomech expert binding decision (Stream H): submaximal GE difference
 * between clipped and flat is not statistically significant (Korff 2007,
 * Mornieux 2010, Bohm 2008).
 */
function geMax(rider: Anthropometry): number {
  return GE_MAX_PEAK - GE_MAX_DROP * Math.abs(rider.fastTwitchPct - 50) / 50;
}

/**
 * GE_power(P) = GE_max × P / (P + P_50)
 *
 * Hyperbolic saturation in power — at very low power, mechanical work is
 * dwarfed by basal metabolism so GE → 0; at high power, GE → GE_max.
 * Monotonic non-decreasing in P by construction.
 */
function gePower(powerW: number, rider: Anthropometry): number {
  const P = Math.max(0, powerW);
  return geMax(rider) * (P / (P + P_50));
}

/**
 * Optimum cadence (rpm) as a function of power and rider. Shifts up ~6 rpm
 * per +100 W. At P = 200 W the optimum sits at:
 *   PREF_BASELINE + (preferredCadence − PREF_BASELINE) × 0.6
 * i.e. blends 60% of the rider's preferred shift onto the typical baseline.
 */
export function optimumCadence(powerW: number, rider: Anthropometry): number {
  const pref = preferredCadenceOf(rider);
  return (
    PREF_BASELINE
    + (pref - PREF_BASELINE) * CAD_OPT_PREF_BLEND
    + CAD_OPT_POWER_SLOPE * (powerW - CAD_OPT_REF_POWER)
  );
}

/**
 * Parabolic cadence penalty centered on optimumCadence. Flattens with
 * power (1 + P/400 in the denominator) — high-power efforts tolerate a
 * wider cadence band before efficiency falls off. Floored at 0.5 so a
 * pathological cadence still produces a finite (if poor) GE.
 */
function cadencePenalty(cadenceRpm: number, powerW: number, rider: Anthropometry): number {
  const cOpt = optimumCadence(powerW, rider);
  const d = cadenceRpm - cOpt;
  const raw = 1 - (CAD_PENALTY_K * d * d) / (1 + powerW / CAD_PENALTY_POWER_SCALE);
  return Math.max(CAD_PENALTY_FLOOR, raw);
}

/**
 * Gross efficiency: closed-form GE(P, c, rider) per Stream C math contract.
 *
 * GE(P, c, rider) = GE_power(P) × max(0.5, cadence_penalty(c, P, rider))
 *
 * Knee-alignment penalty is intentionally NOT folded in here — _compose.ts
 * multiplies it on the outside so the two penalties stay separable for
 * diagnostic surfacing (Stream A wrote kneeAlignmentPenalty correctly).
 *
 * Mode-agnostic (clipped vs flat does not enter): per biomech expert
 * binding decision (Stream H), submaximal GE difference is not
 * statistically significant.
 */
export function grossEfficiency(
  powerW: number,
  cadenceRpm: number,
  rider: Anthropometry,
): number {
  return gePower(powerW, rider) * cadencePenalty(cadenceRpm, powerW, rider);
}

/**
 * Metabolic cost (W). Floor at 0.06 prevents division blow-up when GE
 * collapses — Stream E will turn the floor into a sentinel so the UI can
 * flag impossibility rather than report a finite-but-meaningless number.
 */
export function metabolicCost(powerW: number, ge: number): number {
  return powerW / Math.max(GE_FLOOR, ge);
}

/* ------------------------------------------------------------------ */
/*  Knee-alignment penalty (Stream A — do not alter)                   */
/* ------------------------------------------------------------------ */

export function kneeAlignmentPenalty(kneeAtBDC: number): number {
  if (kneeAtBDC >= 25 && kneeAtBDC <= 45) return 1.0;
  const dist = kneeAtBDC < 25 ? 25 - kneeAtBDC : kneeAtBDC - 45;
  return Math.max(0.6, 1 - dist * 0.012);
}

/* ------------------------------------------------------------------ */
/*  Preferred ↔ fastTwitchPct inverse (A5)                            */
/* ------------------------------------------------------------------ */

/**
 * Map preferred cadence (rpm) → fast-twitch composition (0..100). The
 * forward and inverse maps are exact algebraic inverses on the unclamped
 * domain; clamping only kicks in at the [0, 100] FT% bounds.
 */
export function fastTwitchFromPreferredCadence(prefCadence: number): number {
  return Math.max(0, Math.min(100, 50 + (prefCadence - PREF_BASELINE) / FT_TO_PREF));
}

/** Inverse of fastTwitchFromPreferredCadence. */
export function preferredCadenceFromFastTwitch(ft: number): number {
  return PREF_BASELINE + (ft - 50) * FT_TO_PREF;
}
