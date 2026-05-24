import type { Config, Discipline, PedalMode, Preset } from "./types";
import { DEFAULT_AMP_PROFILE } from "./dynamics";
import { preferredCadenceFromFastTwitch } from "./metabolic";

/**
 * Discipline defaults — primary UX surface for pedalMode + position.
 * Sets pedalMode, barDrop (which drives torso lean post-Stream-D),
 * default cadence, and upstroke-effort starting point. Selected by
 * the Discipline picker; user can override individual fields.
 *
 * Numbers calibrated from biomech expert review (Stream H):
 *  - Road / TT / XC MTB → clipped, upstroke up to ~25% allowed
 *  - Gravity MTB / Commuter → flat, upstroke forced to 0
 *  - barDrop: more aggressive (TT) → more upright (MTB/commuter)
 *  - cadence: matches discipline-typical self-selected cadence
 */
export type DisciplineDefaults = {
  pedalMode: PedalMode;
  barDrop: number;            // cm — drives torso lean
  cadence: number;            // rpm — typical
  upstrokeEffortPct: number;  // fraction 0..0.25
};

export const DISCIPLINE_DEFAULTS: Record<Exclude<Discipline, "Custom">, DisciplineDefaults> = {
  "Road":        { pedalMode: "clipped", barDrop:  8, cadence: 90, upstrokeEffortPct: 0.05 },
  "TT/Tri":      { pedalMode: "clipped", barDrop: 14, cadence: 88, upstrokeEffortPct: 0.08 },
  "XC MTB":      { pedalMode: "clipped", barDrop:  2, cadence: 80, upstrokeEffortPct: 0.04 },
  "Gravity MTB": { pedalMode: "flat",    barDrop: -2, cadence: 70, upstrokeEffortPct: 0.00 },
  "Commuter":    { pedalMode: "flat",    barDrop:  4, cadence: 75, upstrokeEffortPct: 0.00 },
};

/** Default discipline applied to anthropometric presets — road is the
 *  modal Pedalwise user (bike fitter primary audience). */
export const DEFAULT_DISCIPLINE: Discipline = "Road";

// helper for backward-compat: derive preferredCadence from old fastTwitchPct
const prefFromFT = (ft: number) => preferredCadenceFromFastTwitch(ft);

export const PRESETS: Record<Exclude<Preset, "Custom">, Config> = {
  "5'4\"": {
    height: 163,
    femur: 39.6,
    tibia: 40.2,
    foot: 24.6,
    mass: 62,
    torsoLength: 49, // ≈ 0.30 × 163
    fastTwitchPct: 45,
    preferredCadence: prefFromFT(45), // = 78 rpm
    crankLength: 165,
    // Stream G: lowered from 67.0 so that with the corrected foot model and
    // pelvis-anchored hip, BDC reach stays under femur+tibia−0.5 cm.
    saddleHeight: 59.5,
    saddleSetback: 4.5,
    pelvisAboveSaddle: 6.0,
    barDrop: DISCIPLINE_DEFAULTS[DEFAULT_DISCIPLINE].barDrop,
    cleatOffset: 0.0,
    pedalMode: DISCIPLINE_DEFAULTS[DEFAULT_DISCIPLINE].pedalMode,
    discipline: "Road",
    targetSpeed: 30,
    roadGrade: 0,
    cadence: DISCIPLINE_DEFAULTS[DEFAULT_DISCIPLINE].cadence,
    rider: {
      amp: DEFAULT_AMP_PROFILE,
      upstrokeEffortPct: DISCIPLINE_DEFAULTS[DEFAULT_DISCIPLINE].upstrokeEffortPct,
    },
  },
  "5'9\"": {
    height: 175,
    femur: 42.9,
    tibia: 43.1,
    foot: 26.6,
    mass: 75,
    torsoLength: 53,
    fastTwitchPct: 50,
    preferredCadence: prefFromFT(50), // = 80 rpm
    crankLength: 172.5,
    // Stream G: lowered from 73.5 so that with the corrected foot model and
    // pelvis-anchored hip, BDC reach stays under femur+tibia−0.5 cm.
    saddleHeight: 65.5,
    saddleSetback: 5.0,
    pelvisAboveSaddle: 6.0,
    barDrop: DISCIPLINE_DEFAULTS[DEFAULT_DISCIPLINE].barDrop,
    cleatOffset: 0.0,
    pedalMode: DISCIPLINE_DEFAULTS[DEFAULT_DISCIPLINE].pedalMode,
    discipline: "Road",
    targetSpeed: 30,
    roadGrade: 0,
    cadence: DISCIPLINE_DEFAULTS[DEFAULT_DISCIPLINE].cadence,
    rider: {
      // A subtle 2% L-side reduction per architect §6 risk #8 so the
      // asymmetry surface is visible on first load once Stream B lands.
      amp: {
        R: DEFAULT_AMP_PROFILE.R,
        L: {
          ...DEFAULT_AMP_PROFILE.L,
          hipExt: DEFAULT_AMP_PROFILE.L.hipExt * 0.98,
        },
      },
      upstrokeEffortPct: DISCIPLINE_DEFAULTS[DEFAULT_DISCIPLINE].upstrokeEffortPct,
    },
  },
  "6'2\"": {
    height: 188,
    femur: 46.5,
    tibia: 46.0,
    foot: 28.6,
    mass: 84,
    torsoLength: 56,
    fastTwitchPct: 55,
    preferredCadence: prefFromFT(55), // = 82 rpm
    crankLength: 175,
    // Stream G: lowered from 79.0 so that with the corrected foot model and
    // pelvis-anchored hip, BDC reach stays under femur+tibia−0.5 cm.
    saddleHeight: 72.0,
    saddleSetback: 5.5,
    pelvisAboveSaddle: 6.0,
    barDrop: DISCIPLINE_DEFAULTS[DEFAULT_DISCIPLINE].barDrop,
    cleatOffset: 0.0,
    pedalMode: DISCIPLINE_DEFAULTS[DEFAULT_DISCIPLINE].pedalMode,
    discipline: "Road",
    targetSpeed: 30,
    roadGrade: 0,
    cadence: DISCIPLINE_DEFAULTS[DEFAULT_DISCIPLINE].cadence,
    rider: {
      amp: DEFAULT_AMP_PROFILE,
      upstrokeEffortPct: DISCIPLINE_DEFAULTS[DEFAULT_DISCIPLINE].upstrokeEffortPct,
    },
  },
};

export const DEFAULT_CONFIG: Config = PRESETS["5'9\""];

/** Commercial gear inventory (chainring × cog). */
export const CHAINRINGS = [50, 52, 53];
export const COGS = [11, 12, 13, 14, 15, 16, 17, 19, 21, 23, 25];
export const WHEEL_DIAMETER_M = 0.679; // 700×25c effective rolling
