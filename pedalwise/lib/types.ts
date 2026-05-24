export type RiderProfile = {
  height: number;   // cm
  femur: number;    // cm  (thigh)
  tibia: number;    // cm  (shank)
  foot: number;     // cm  (ankle->ball-of-foot length)
  mass: number;     // kg
  fastTwitchPct: number; // 0–100
};

export type BikeFit = {
  crankLength: number;  // mm (e.g. 172.5)
  saddleHeight: number; // cm (BB to top of saddle, along seat tube)
  saddleSetback: number; // cm (horizontal behind BB)
};

export type Goal = {
  targetSpeed: number; // km/h
  roadGrade: number;   // %
  cadence: number;     // rpm
};

export type Config = RiderProfile & BikeFit & Goal;

export type ViewMode = "anatomical" | "realistic" | "diagnostic";

export type Preset = "5'4\"" | "5'9\"" | "6'2\"" | "Custom";

/** Sagittal-plane positions and angles for one leg, at one crank angle. */
export type LegPose = {
  hip:   { x: number; y: number };
  knee:  { x: number; y: number };
  ankle: { x: number; y: number };
  pedal: { x: number; y: number };
  /** Joint flexion angles (deg) — interior angle, smaller = more bent. */
  hipAngle: number;
  kneeAngle: number;
  ankleAngle: number;
  /** True when the inverse-kinematics solution is reachable. */
  reachable: boolean;
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
  ie: number;              // index of effectiveness 0..1
  optimumCadence: number;  // rpm
  geometryImpossible: boolean;
  impossibleReason?: string;
  jointShare: { hip: number; knee: number; ankle: number };
  reach: number;       // cm  (required leg reach at BDC)
  maxLeg: number;      // cm  (femur + tibia + foot)
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
