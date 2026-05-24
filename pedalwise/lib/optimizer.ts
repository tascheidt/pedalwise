import type { Config, GearCandidate, Recommendation } from "./types";
import { evaluate } from "./kinematics";
import { CHAINRINGS, COGS, WHEEL_DIAMETER_M } from "./presets";

/** Saddle-height target from LeMond + Holmes heuristics. */
function saddleHeightHeuristic(femur: number, tibia: number, foot: number): number {
  const inseam = femur + tibia + foot * 0.4;
  return inseam * 0.883 + 1.5;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function configWith(cfg: Config, patch: Partial<Config>): Config {
  return { ...cfg, ...patch };
}

/** Local hill climber over (saddleHeight, crankLength, cadence, setback). */
function hillClimb(start: Config): { best: Config; converged: boolean } {
  let cur = start;
  let curM = evaluate(cur).grossEfficiency;
  const steps = [
    { key: "saddleHeight", delta: 0.5, lo: 55, hi: 95 },
    { key: "crankLength",  delta: 2.5, lo: 150, hi: 180 },
    { key: "cadence",      delta: 1,   lo: 55, hi: 120 },
    { key: "saddleSetback",delta: 0.5, lo: 0, hi: 12 },
  ] as const;

  let improved = true;
  let iters = 0;
  while (improved && iters < 200) {
    improved = false;
    iters++;
    for (const s of steps) {
      for (const sign of [-1, 1]) {
        const next = configWith(cur, {
          [s.key]: clamp((cur as unknown as Record<string, number>)[s.key] + s.delta * sign, s.lo, s.hi),
        } as Partial<Config>);
        const m = evaluate(next);
        if (m.geometryImpossible) continue;
        if (m.grossEfficiency > curM + 1e-5) {
          cur = next;
          curM = m.grossEfficiency;
          improved = true;
        }
      }
    }
  }
  return { best: cur, converged: iters < 200 };
}

/** Multi-start optimizer: 8 random perturbations, pick the best. */
export function optimize(start: Config): Recommendation {
  const currentMetrics = evaluate(start);
  const seeds: Config[] = [start];
  // Targeted seed using the heuristic saddle height
  seeds.push(configWith(start, {
    saddleHeight: clamp(saddleHeightHeuristic(start.femur, start.tibia, start.foot), 55, 95),
    cadence: 88,
  }));
  for (let i = 0; i < 6; i++) {
    seeds.push(configWith(start, {
      saddleHeight: clamp(start.saddleHeight + (Math.random() - 0.5) * 6, 55, 95),
      crankLength: clamp(start.crankLength + (Math.random() - 0.5) * 10, 150, 180),
      cadence: clamp(80 + Math.random() * 20, 65, 110),
      saddleSetback: clamp(start.saddleSetback + (Math.random() - 0.5) * 4, 0, 12),
    }));
  }

  let best: Config = start;
  let bestE = -Infinity;
  let converged = false;
  for (const seed of seeds) {
    const { best: b, converged: c } = hillClimb(seed);
    const e = evaluate(b).grossEfficiency;
    if (e > bestE) {
      bestE = e;
      best = b;
      converged = c;
    }
  }

  const m = evaluate(best);
  const gain = (m.grossEfficiency - currentMetrics.grossEfficiency) * 100;

  // Gear candidates: search commercial chainring × cog combos that bring
  // cadence closest to optimum at the target speed.
  const speedMs = m.speed / 3.6;
  const wheelCircM = Math.PI * WHEEL_DIAMETER_M;
  const candidates: GearCandidate[] = [];
  for (const cr of CHAINRINGS) {
    for (const cog of COGS) {
      const ratio = cr / cog;
      const cadenceAt = (speedMs * 60) / (ratio * wheelCircM);
      candidates.push({
        chainring: cr,
        cog,
        ratio,
        cadenceAtTarget: cadenceAt,
        label: `${cr} × ${cog}`,
      });
    }
  }
  candidates.sort((a, b) => Math.abs(a.cadenceAtTarget - m.cadence) - Math.abs(b.cadenceAtTarget - m.cadence));
  const topGears = candidates.slice(0, 3);

  // Sensitivity bars — change each parameter by ±5% and measure efficiency change.
  const baseE = m.grossEfficiency;
  const measure = (patch: Partial<Config>) => {
    const e = evaluate(configWith(best, patch)).grossEfficiency;
    return Math.abs(e - baseE) * 100;
  };
  const sensitivity = [
    { label: "Saddle height",  pctImpact: measure({ saddleHeight: best.saddleHeight * 1.05 }) },
    { label: "Crank length",   pctImpact: measure({ crankLength:  best.crankLength * 1.05 })  },
    { label: "Cadence",        pctImpact: measure({ cadence:      best.cadence + 5 })          },
    { label: "Setback",        pctImpact: measure({ saddleSetback: best.saddleSetback + 1 })   },
  ];

  return {
    fit: {
      crankLength: best.crankLength,
      saddleHeight: best.saddleHeight,
      saddleSetback: best.saddleSetback,
    },
    goal: { cadence: best.cadence },
    metrics: m,
    gainPercentPoints: gain,
    diff: {
      saddleHeight: {
        current: start.saddleHeight,
        optimum: best.saddleHeight,
        delta: best.saddleHeight - start.saddleHeight,
      },
      crankLength: {
        current: start.crankLength,
        optimum: best.crankLength,
        delta: best.crankLength - start.crankLength,
      },
      cadence: {
        current: start.cadence,
        optimum: best.cadence,
        delta: best.cadence - start.cadence,
      },
      saddleSetback: {
        current: start.saddleSetback,
        optimum: best.saddleSetback,
        delta: best.saddleSetback - start.saddleSetback,
      },
    },
    gears: topGears,
    sensitivity,
    trained: start.fastTwitchPct >= 45,
    converged,
  };
}
