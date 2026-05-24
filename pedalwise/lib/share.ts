/**
 * URL-safe encode/decode of a Config for share links (PW-102).
 *
 * Encoding strategy:
 *   1. Build a compact object with deterministic key order.
 *   2. Apply toFixed rounding where safe (saddle/setback/barDrop → 0.1 cm;
 *      cadence/speed/grade → integer; anatomy fields full precision).
 *   3. JSON.stringify → TextEncoder → base64url.
 *   4. Throw if the result exceeds 2 KB (prevents QR-code overflow).
 *
 * Round-trip guarantee: decodeConfig(encodeConfig(c)) deep-equals c within
 * the stated toFixed precision rules.
 */

import type { Config, Discipline, PedalMode } from "./types";
import type { AmpProfile } from "./types";

// ---------------------------------------------------------------------------
// Compact wire format (deterministic field order)
// ---------------------------------------------------------------------------

/** Wire format — must not change without a version bump. */
type Wire = {
  v: 1;                         // schema version
  // Anthropometry
  ht: number;   // height cm (full precision)
  fe: number;   // femur cm
  ti: number;   // tibia cm
  fo: number;   // foot cm
  tl: number;   // torsoLength cm
  ms: number;   // mass kg
  pc: number;   // preferredCadence rpm (integer)
  ft: number;   // fastTwitchPct (integer)
  // BikeFit
  cl: number;   // crankLength mm (integer)
  sh: number;   // saddleHeight cm → toFixed(1)
  ss: number;   // saddleSetback cm → toFixed(1)
  pa?: number;  // pelvisAboveSaddle cm → toFixed(1)
  bd?: number;  // barDrop cm → toFixed(1)
  co?: number;  // cleatOffset cm → toFixed(1)
  pm?: PedalMode;
  // Goal
  ts: number;   // targetSpeed km/h (integer)
  rg: number;   // roadGrade % (integer)
  ca: number;   // cadence rpm (integer)
  // Discipline
  di: Discipline;
  // RiderModel
  us: number;   // upstrokeEffortPct (3 dp)
  // AmpProfile — 12 values each leg; order: hipExt, hipFlex, kneeExt, kneeFlex, anklePlantar, ankleDorsi
  ar: [number, number, number, number, number, number];
  al: [number, number, number, number, number, number];
};

const MAX_BYTES = 2048;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function r1(v: number): number { return Number(v.toFixed(1)); }
function r0(v: number): number { return Math.round(v); }
function r3(v: number): number { return Number(v.toFixed(3)); }

function ampToArray(
  side: AmpProfile["R"],
): [number, number, number, number, number, number] {
  return [
    side.hipExt,
    side.hipFlex,
    side.kneeExt,
    side.kneeFlex,
    side.anklePlantar,
    side.ankleDorsi,
  ];
}

function arrayToAmpSide(
  a: [number, number, number, number, number, number],
): AmpProfile["R"] {
  return {
    hipExt: a[0],
    hipFlex: a[1],
    kneeExt: a[2],
    kneeFlex: a[3],
    anklePlantar: a[4],
    ankleDorsi: a[5],
  };
}

// ---------------------------------------------------------------------------
// Encode
// ---------------------------------------------------------------------------

export function encodeConfig(c: Config): string {
  const wire: Wire = {
    v: 1,
    ht: c.height,
    fe: c.femur,
    ti: c.tibia,
    fo: c.foot,
    tl: c.torsoLength,
    ms: c.mass,
    pc: r0(c.preferredCadence),
    ft: r0(c.fastTwitchPct),
    cl: r0(c.crankLength),
    sh: r1(c.saddleHeight),
    ss: r1(c.saddleSetback),
    ts: r0(c.targetSpeed),
    rg: r0(c.roadGrade),
    ca: r0(c.cadence),
    di: c.discipline,
    us: r3(c.rider.upstrokeEffortPct),
    ar: ampToArray(c.rider.amp.R),
    al: ampToArray(c.rider.amp.L),
  };

  // Optional BikeFit fields — only include when present.
  if (c.pelvisAboveSaddle !== undefined) wire.pa = r1(c.pelvisAboveSaddle);
  if (c.barDrop !== undefined) wire.bd = r1(c.barDrop);
  if (c.cleatOffset !== undefined) wire.co = r1(c.cleatOffset);
  if (c.pedalMode !== undefined) wire.pm = c.pedalMode;

  const json = JSON.stringify(wire);
  const bytes = new TextEncoder().encode(json);

  if (bytes.length > MAX_BYTES) {
    throw new Error(
      `encodeConfig: encoded blob is ${bytes.length} bytes, exceeds 2 KB limit.`,
    );
  }

  // base64url (RFC 4648 §5) — no padding, URL-safe chars.
  const b64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return b64;
}

// ---------------------------------------------------------------------------
// Decode
// ---------------------------------------------------------------------------

export function decodeConfig(s: string): Config {
  // Restore standard base64 from base64url.
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if needed.
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);

  let json: string;
  try {
    const binary = atob(padded);
    json = binary;
  } catch {
    throw new Error("decodeConfig: invalid base64url string.");
  }

  let wire: Wire;
  try {
    wire = JSON.parse(json) as Wire;
  } catch {
    throw new Error("decodeConfig: JSON parse failed.");
  }

  if (wire.v !== 1) {
    throw new Error(`decodeConfig: unknown schema version ${wire.v}.`);
  }

  const config: Config = {
    height: wire.ht,
    femur: wire.fe,
    tibia: wire.ti,
    foot: wire.fo,
    torsoLength: wire.tl,
    mass: wire.ms,
    preferredCadence: wire.pc,
    fastTwitchPct: wire.ft,
    crankLength: wire.cl,
    saddleHeight: wire.sh,
    saddleSetback: wire.ss,
    targetSpeed: wire.ts,
    roadGrade: wire.rg,
    cadence: wire.ca,
    discipline: wire.di,
    rider: {
      upstrokeEffortPct: wire.us,
      amp: {
        R: arrayToAmpSide(wire.ar),
        L: arrayToAmpSide(wire.al),
      },
    },
  };

  // Re-attach optional BikeFit fields.
  if (wire.pa !== undefined) config.pelvisAboveSaddle = wire.pa;
  if (wire.bd !== undefined) config.barDrop = wire.bd;
  if (wire.co !== undefined) config.cleatOffset = wire.co;
  if (wire.pm !== undefined) config.pedalMode = wire.pm;

  return config;
}
