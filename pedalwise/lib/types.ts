// Anthropometry (was RiderProfile — alias the old name for back-compat)
export type Anthropometry = {
  height: number;       // cm
  femur: number;        // cm
  tibia: number;        // cm
  foot: number;         // cm  (ankle → ball-of-foot, structural)
  /** NEW (S4) default ≈ 0.30 × height. */
  torsoLength: number;  // cm
  mass: number;         // kg
  /** NEW (A5) range 60..100 rpm. */
  preferredCadence: number; // rpm
  /** @deprecated use preferredCadence; derived for compat. */
  fastTwitchPct: number;    // 0..100 — kept for compat
};

/** @deprecated use Anthropometry; kept as alias for back-compat. */
export type RiderProfile = Anthropometry;

/**
 * Pedal-shoe interface mode. Binary per biomech expert (Stream H):
 *  - "clipped": clipless/clip-in shoes (road, TT, most XC MTB). Foot is
 *    anchored at the cleat. Rider can apply tangential pull on the
 *    upstroke (up to ~25% body-weight unloading).
 *  - "flat": platform pedal. Foot held by gravity + friction only.
 *    Cannot apply pulling force; radial force from pedal must be ≥ 0.
 *
 * Explicitly OUT OF SCOPE for v1.1 (do not relitigate):
 *   cleat float angle (3D, sagittal-invisible), Q-factor (frontal-plane),
 *   shoe-sole stiffness (<1% effect), pedal mass/inertia,
 *   cleat fore-aft (separate fit input; see Stream A4),
 *   left/right asymmetric pull (model is symmetric by construction).
 */
export type PedalMode = "clipped" | "flat";

export type BikeFit = {
  crankLength: number;        // mm
  saddleHeight: number;       // cm
  saddleSetback: number;      // cm
  /** NEW (Stream H) default per discipline. Equipment attribute. */
  pedalMode?: PedalMode;
  /** NEW (S4) default 6.0 cm. Optional during the Stream-A→D rollout so the
   *  optimizer's existing literal `{crankLength,saddleHeight,saddleSetback}`
   *  still satisfies the type. Stream D will tighten to required. */
  pelvisAboveSaddle?: number;
  /** NEW (S4) default 8.0 cm. See pelvisAboveSaddle re: optionality. */
  barDrop?: number;
  /** NEW (A4) default 0.0 cm (+ = rearward). See pelvisAboveSaddle. */
  cleatOffset?: number;
};

/**
 * Riding discipline. Primary UX surface for pedalMode + position defaults
 * (see DISCIPLINE_DEFAULTS in presets.ts). Sets pedalMode, barDrop hint,
 * default cadence, and upstroke effort in a single click.
 */
export type Discipline =
  | "Road"
  | "TT/Tri"
  | "XC MTB"
  | "Gravity MTB"
  | "Commuter"
  | "Custom";

export type Goal = {
  targetSpeed: number; // km/h
  roadGrade: number;   // %
  cadence: number;     // rpm
};

/**
 * Per-joint, per-leg, per-direction peak torque amplitudes (N·m).
 * Calibration scales all 12 to match target power.
 */
export type AmpProfile = {
  R: {
    hipExt: number; hipFlex: number;
    kneeExt: number; kneeFlex: number;
    anklePlantar: number; ankleDorsi: number;
  };
  L: {
    hipExt: number; hipFlex: number;
    kneeExt: number; kneeFlex: number;
    anklePlantar: number; ankleDorsi: number;
  };
};

export type RiderModel = {
  amp: AmpProfile;
  /** Fraction 0..0.25 of recovery-half radial unloading the rider applies. */
  upstrokeEffortPct: number;
};

export type Config = Anthropometry & BikeFit & Goal & {
  rider: RiderModel;
  /** Riding discipline; drives pedalMode/barDrop/cadence defaults. CP-021. */
  discipline: Discipline;
};

// ---------------------------------------------------------------------------
// Fitter studio types (PW-103) — persisted in LocalStorage via lib/storage.ts
// ---------------------------------------------------------------------------

export type Client = {
  id: string;
  name: string;
  notes?: string;
  createdAt: number;       // epoch ms
  archivedAt?: number;     // soft-delete; undefined = active
};

export type Session = {
  id: string;
  clientId: string;
  createdAt: number;
  config: Config;          // rider/fit/goal at session time
  applied?: {              // populated when fitter clicks "Apply to client's fit"
    fit: BikeFit;
    goalCadence: number;
    metrics: Metrics;
    at: number;
  };
};

export type ViewMode = "anatomical" | "realistic" | "diagnostic";

export type Preset = "5'4\"" | "5'9\"" | "6'2\"" | "Custom";

/** Sagittal-plane positions and angles for one leg, at one crank angle. */
export type LegPose = {
  hip:   { x: number; y: number };
  knee:  { x: number; y: number };
  ankle: { x: number; y: number };
  pedal: { x: number; y: number };
  /** Legacy unsigned interior angle (deg). Smaller = more bent. */
  hipAngle: number;
  kneeAngle: number;
  ankleAngle: number;
  /** True when the inverse-kinematics solution is reachable. */
  reachable: boolean;
  /** Trunk-to-thigh angle, post-S4. NaN until Stream D lands. */
  hipFlexion: number;
};

export type Frame = {
  crankAngle: number; // rad, 0 = TDC right, increasing CW
  right: LegPose;
  left:  LegPose;
  /** Origin reference: bottom bracket world coordinate (cm). */
  bbX: number;
  bbY: number;
  /** Saddle position (cm). */
  saddleX: number;
  saddleY: number;
  /** NEW (S4) — pre-Stream-D: equal to saddle. */
  pelvisX: number;
  pelvisY: number;
  /** NEW (S4) — pre-Stream-D: equal to saddle. */
  shoulderX: number;
  shoulderY: number;
};

export type LegDynamics = {
  fxN: number; fyN: number;
  /** N signed; + = propulsive CW. */
  fTangential: number;
  /** N signed; + = outward. */
  fRadial: number;
  /** W. */
  jointPower:  { hip: number; knee: number; ankle: number };
  /** N·m. */
  jointTorque: { hip: number; knee: number; ankle: number };
};

export type FrameDynamics = {
  right: LegDynamics;
  left: LegDynamics;
  /** N·m, summed across legs. */
  crankTorque: number;
};

export type StrokeCurves = {
  /** rad, 121 samples 0..2π. */
  crankAngle: number[];
  tangentialR: number[];
  tangentialL: number[];
  radialR: number[];
  radialL: number[];
  /** W, sum of L+R. */
  jointPowerHip: number[];
  jointPowerKnee: number[];
  jointPowerAnkle: number[];
};

/** Outputs of a steady-state biomechanics evaluation. */
export type Metrics = {
  power: number;       // W
  cadence: number;     // rpm
  speed: number;       // km/h
  gearRatio: number;
  grossEfficiency: number; // 0..1
  metabolicCost: number;   // W
  kneeAtBDC: number;       // deg (knee flexion when pedal at BDC)
  optimumCadence: number;  // rpm
  geometryImpossible: boolean;
  impossibleReason?: string;
  reach: number;       // cm  (required leg reach at BDC)
  maxLeg: number;      // cm  (femur + tibia + foot)
  /** Index of effectiveness 0..1 (Stream B will redefine properly). */
  ie: number;
  /** NEW — per-leg IE, Stream B fills. */
  ieRight: number;
  ieLeft: number;
  /** NEW — rightPower / total, ≈ 0.5. Stream B fills. */
  lrBalance: number;
  jointShare: { hip: number; knee: number; ankle: number };
  /** NEW — Stream B fills, A stubs to legacy Gaussian. */
  curves: StrokeCurves;
};

export type GearCandidate = {
  chainring: number;
  cog: number;
  ratio: number;     // chainring / cog
  cadenceAtTarget: number; // rpm achieved at goal.targetSpeed with this gear
  label: string;
};

export type Recommendation = {
  fit: BikeFit;
  goal: Pick<Goal, "cadence">;
  metrics: Metrics;
  gainPercentPoints: number;
  diff: {
    saddleHeight: { current: number; optimum: number; delta: number };
    crankLength:  { current: number; optimum: number; delta: number };
    cadence:      { current: number; optimum: number; delta: number };
    saddleSetback:{ current: number; optimum: number; delta: number };
  };
  gears: GearCandidate[];
  sensitivity: { label: string; pctImpact: number }[];
  trained: boolean;
  converged: boolean;
};
