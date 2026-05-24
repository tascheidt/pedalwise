import type { Config, Preset } from "./types";

export const PRESETS: Record<Exclude<Preset, "Custom">, Config> = {
  "5'4\"": {
    height: 163,
    femur: 39.6,
    tibia: 40.2,
    foot: 24.6,
    mass: 62,
    fastTwitchPct: 45,
    crankLength: 165,
    saddleHeight: 67.0,
    saddleSetback: 4.5,
    targetSpeed: 30,
    roadGrade: 0,
    cadence: 90,
  },
  "5'9\"": {
    height: 175,
    femur: 42.9,
    tibia: 43.1,
    foot: 26.6,
    mass: 75,
    fastTwitchPct: 50,
    crankLength: 172.5,
    saddleHeight: 73.5,
    saddleSetback: 5.0,
    targetSpeed: 30,
    roadGrade: 0,
    cadence: 90,
  },
  "6'2\"": {
    height: 188,
    femur: 46.5,
    tibia: 46.0,
    foot: 28.6,
    mass: 84,
    fastTwitchPct: 55,
    crankLength: 175,
    saddleHeight: 79.0,
    saddleSetback: 5.5,
    targetSpeed: 30,
    roadGrade: 0,
    cadence: 90,
  },
};

export const DEFAULT_CONFIG: Config = PRESETS["5'9\""];

/** Commercial gear inventory (chainring × cog). */
export const CHAINRINGS = [50, 52, 53];
export const COGS = [11, 12, 13, 14, 15, 16, 17, 19, 21, 23, 25];
export const WHEEL_DIAMETER_M = 0.679; // 700×25c effective rolling
